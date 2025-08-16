const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config();

// Enhanced logger
const logger = {
  info: (message, data = {}) => {
    console.log(`[DB-INFO] ${new Date().toISOString()}: ${message}`, data);
  },
  error: (message, error = {}) => {
    console.error(`[DB-ERROR] ${new Date().toISOString()}: ${message}`, error);
  },
  warn: (message, data = {}) => {
    console.warn(`[DB-WARN] ${new Date().toISOString()}: ${message}`, data);
  },
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB-DEBUG] ${new Date().toISOString()}: ${message}`, data);
    }
  }
};

// Backup configuration
const BACKUP_PATH = process.env.DB_BACKUP_PATH || path.join(__dirname, 'backups');
const BACKUP_RETENTION_DAYS = parseInt(process.env.DB_BACKUP_RETENTION_DAYS) || 30;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_PATH)) {
  fs.mkdirSync(BACKUP_PATH, { recursive: true });
  logger.info('Created backup directory', { path: BACKUP_PATH });
}

// PostgreSQL connection pool with enhanced settings
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'kommo_pulse',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT) || 2000,
  
  // Statement timeout (5 minutes)
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 300000,
});

// Connection event handlers
pool.on('connect', (client) => {
  logger.info('New PostgreSQL client connected', { 
    processId: client.processID,
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', { 
    error: err.message, 
    code: err.code,
    processId: client?.processID 
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down PostgreSQL pool gracefully...');
  pool.end(() => {
    logger.info('PostgreSQL pool closed successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Shutting down PostgreSQL pool gracefully...');
  pool.end(() => {
    logger.info('PostgreSQL pool closed successfully');
    process.exit(0);
  });
});

// Enhanced query wrapper with error handling and logging
async function executeQuery(query, params = [], operation = 'query') {
  const startTime = Date.now();
  const queryId = uuidv4().substring(0, 8);
  
  logger.debug('Executing query', { 
    queryId, 
    operation, 
    query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
    params: params.length 
  });
  
  try {
    const result = await pool.query(query, params);
    const duration = Date.now() - startTime;
    
    logger.debug('Query completed successfully', { 
      queryId, 
      operation, 
      duration: `${duration}ms`,
      rowCount: result.rowCount 
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Query failed', { 
      queryId, 
      operation, 
      duration: `${duration}ms`,
      error: error.message,
      code: error.code,
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      params: params.length
    });
    
    // Enhanced error handling
    if (error.code === '23505') { // Unique violation
      throw new Error(`Duplicate entry: ${error.detail || error.message}`);
    } else if (error.code === '23503') { // Foreign key violation
      throw new Error(`Referenced record not found: ${error.detail || error.message}`);
    } else if (error.code === '23502') { // Not null violation
      throw new Error(`Required field missing: ${error.detail || error.message}`);
    } else if (error.code === '42P01') { // Undefined table
      throw new Error(`Table not found: ${error.message}`);
    } else if (error.code === '42703') { // Undefined column
      throw new Error(`Column not found: ${error.message}`);
    }
    
    throw error;
  }
}

// Database backup functionality
async function createBackup() {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_PATH, `kommo_pulse_backup_${timestamp}.sql`);
    
    logger.info('Creating database backup', { backupFile });
    
    const { exec } = require('child_process');
    const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
    
    const command = `pg_dump "${connectionString}" --no-password --verbose --clean --if-exists --no-owner --no-privileges > "${backupFile}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.error('Failed to create backup', { error: error.message, stderr });
        reject(error);
      } else {
        logger.info('Database backup completed successfully', { backupFile });
        resolve(backupFile);
      }
    });
  });
}

// Clean up old backups
async function cleanupOldBackups() {
  return new Promise((resolve, reject) => {
    fs.readdir(BACKUP_PATH, (err, files) => {
      if (err) {
        logger.error('Failed to read backup directory', { error: err.message });
        reject(err);
        return;
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);
      
      let deletedCount = 0;
      files.forEach(file => {
        if (file.startsWith('kommo_pulse_backup_') && file.endsWith('.sql')) {
          const filePath = path.join(BACKUP_PATH, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            deletedCount++;
            logger.debug('Deleted old backup', { file });
          }
        }
      });
      
      if (deletedCount > 0) {
        logger.info('Cleaned up old backups', { deletedCount });
      }
      resolve(deletedCount);
    });
  });
}

// Database helper functions with enhanced error handling
const dbHelpers = {
  // User operations
  createUser: async (userData) => {
    const { id, email, password_hash, name, kommo_account } = userData;
    const query = `
      INSERT INTO users (id, email, password_hash, name, kommo_account) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, email, name, kommo_account
    `;
    
    logger.debug('Creating new user', { id, email, name, kommo_account });
    
    try {
      const result = await executeQuery(query, [id, email, password_hash, name, kommo_account], 'createUser');
      logger.info('User created successfully', { id, email, name });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create user', { error: error.message, email });
      throw error;
    }
  },

  getUserByEmail: async (email) => {
    try {
      const result = await executeQuery('SELECT * FROM users WHERE email = $1', [email], 'getUserByEmail');
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get user by email', { error: error.message, email });
      throw error;
    }
  },

  getUserById: async (id) => {
    try {
      const result = await executeQuery('SELECT * FROM users WHERE id = $1', [id], 'getUserById');
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get user by id', { error: error.message, id });
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const result = await executeQuery('SELECT * FROM users', [], 'getAllUsers');
      return result.rows;
    } catch (error) {
      logger.error('Failed to get all users', { error: error.message });
      throw error;
    }
  },

  updateUser: async (id, updates) => {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    values.unshift(id);
    
    const query = `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
    
    logger.debug('Updating user', { id, updates: Object.keys(updates) });
    
    try {
      const result = await executeQuery(query, values, 'updateUser');
      logger.info('User updated successfully', { id, changes: result.rowCount });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update user', { error: error.message, id });
      throw error;
    }
  },

  findUserByStripeCustomerId: async (stripe_customer_id) => {
    try {
      const result = await executeQuery('SELECT * FROM users WHERE stripe_customer_id = $1', [stripe_customer_id], 'findUserByStripeCustomerId');
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to find user by stripe customer id', { error: error.message, stripe_customer_id });
      throw error;
    }
  },

  // Subscription operations
  createSubscription: async (subscriptionData) => {
    const { id, user_id, plan_type, status, trial_ends_at } = subscriptionData;
    const query = `
      INSERT INTO subscriptions (id, user_id, plan_type, status, trial_ends_at) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    
    try {
      const result = await executeQuery(query, [id, user_id, plan_type, status, trial_ends_at], 'createSubscription');
      logger.info('Subscription created successfully', { id, user_id, plan_type });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create subscription', { error: error.message, user_id });
      throw error;
    }
  },

  getUserSubscription: async (user_id) => {
    try {
      const result = await executeQuery(
        'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [user_id],
        'getUserSubscription'
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get user subscription', { error: error.message, user_id });
      throw error;
    }
  },

  updateSubscription: async (user_id, updates) => {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    values.unshift(user_id);
    
    const query = `UPDATE subscriptions SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *`;
    
    try {
      const result = await executeQuery(query, values, 'updateSubscription');
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update subscription', { error: error.message, user_id });
      throw error;
    }
  },

  // Usage tracking
  logUsage: async (user_id, action_type, count = 1, metadata = null) => {
    const id = uuidv4();
    const query = `
      INSERT INTO usage_logs (id, user_id, action_type, count, metadata) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    
    try {
      const result = await executeQuery(query, [id, user_id, action_type, count, metadata], 'logUsage');
      logger.debug('Usage logged successfully', { id, user_id, action_type, count });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to log usage', { error: error.message, user_id, action_type });
      throw error;
    }
  },

  getUserUsage: async (user_id, action_type, date = null) => {
    let query = 'SELECT SUM(count) as total FROM usage_logs WHERE user_id = $1 AND action_type = $2';
    const params = [user_id, action_type];
    
    if (date) {
      query += ' AND date = $3';
      params.push(date);
    }
    
    try {
      const result = await executeQuery(query, params, 'getUserUsage');
      return parseInt(result.rows[0]?.total || 0);
    } catch (error) {
      logger.error('Failed to get user usage', { error: error.message, user_id, action_type });
      throw error;
    }
  },

  // Kommo token operations
  saveKommoTokens: async (account_domain, tokens) => {
    logger.debug('Saving Kommo tokens', { account_domain, hasAccessToken: !!tokens.access_token });
    
    const expires_at = new Date(tokens.expires_at);
    
    try {
      // Check if token exists
      const findResult = await executeQuery(
        'SELECT id FROM kommo_tokens WHERE account_domain = $1',
        [account_domain],
        'findKommoTokens'
      );
      
      if (findResult.rows.length > 0) {
        // Update existing token
        const updateQuery = `
          UPDATE kommo_tokens 
          SET access_token = $1, refresh_token = $2, expires_at = $3, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $4 
          RETURNING *
        `;
        
        const result = await executeQuery(updateQuery, [
          tokens.access_token, 
          tokens.refresh_token, 
          expires_at, 
          findResult.rows[0].id
        ], 'updateKommoTokens');
        
        logger.info('Kommo tokens updated successfully', { account_domain, id: findResult.rows[0].id });
        return { id: findResult.rows[0].id, account_domain, updated: true };
      } else {
        // Create new token
        const id = uuidv4();
        const insertQuery = `
          INSERT INTO kommo_tokens (id, account_domain, access_token, refresh_token, expires_at) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING *
        `;
        
        const result = await executeQuery(insertQuery, [
          id, 
          account_domain, 
          tokens.access_token, 
          tokens.refresh_token, 
          expires_at
        ], 'createKommoTokens');
        
        logger.info('Kommo tokens created successfully', { account_domain, id });
        return { id, account_domain, created: true };
      }
    } catch (error) {
      logger.error('Failed to save Kommo tokens', { error: error.message, account_domain });
      throw error;
    }
  },

  getKommoTokens: async (account_domain) => {
    logger.debug('Retrieving Kommo tokens', { account_domain });
    
    try {
      const result = await executeQuery(
        'SELECT * FROM kommo_tokens WHERE account_domain = $1',
        [account_domain],
        'getKommoTokens'
      );
      
      logger.debug('Kommo tokens retrieved', { account_domain, found: result.rows.length > 0 });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to retrieve Kommo tokens', { error: error.message, account_domain });
      throw error;
    }
  },

  // Report operations
  saveReport: async (reportId, userId, repId, reportType, timeRange, format, data) => {
    const query = `
      INSERT INTO reports (id, user_id, rep_id, report_type, time_range, format, data) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `;
    
    try {
      const result = await executeQuery(query, [
        reportId, userId, repId, reportType, timeRange, format, data
      ], 'saveReport');
      
      logger.info('Report saved successfully', { reportId, userId, reportType });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to save report', { error: error.message, reportId });
      throw error;
    }
  },

  getUserReports: async (userId, limit = 50) => {
    const query = `
      SELECT * FROM reports 
      WHERE user_id = $1 
      ORDER BY generated_at DESC 
      LIMIT $2
    `;
    
    try {
      const result = await executeQuery(query, [userId, limit], 'getUserReports');
      logger.debug('User reports retrieved', { userId, count: result.rows.length });
      return result.rows;
    } catch (error) {
      logger.error('Failed to get user reports', { error: error.message, userId });
      throw error;
    }
  },

  getReportStats: async (userId) => {
    const query = `
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN generated_at >= date_trunc('month', CURRENT_TIMESTAMP) THEN 1 END) as reports_this_month,
        COUNT(CASE WHEN format = 'PDF' THEN 1 END) as pdf_reports,
        COUNT(CASE WHEN format = 'CSV' THEN 1 END) as csv_reports,
        COUNT(CASE WHEN format = 'EXCEL' THEN 1 END) as excel_reports
      FROM reports 
      WHERE user_id = $1
    `;
    
    try {
      const result = await executeQuery(query, [userId], 'getReportStats');
      logger.debug('Report stats retrieved', { userId, stats: result.rows[0] });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get report stats', { error: error.message, userId });
      throw error;
    }
  },

  // Database maintenance and monitoring
  getDatabaseStats: async () => {
    try {
      const stats = {};
      
      const queries = [
        { name: 'users', sql: 'SELECT COUNT(*) as count FROM users' },
        { name: 'subscriptions', sql: 'SELECT COUNT(*) as count FROM subscriptions' },
        { name: 'usage_logs', sql: 'SELECT COUNT(*) as count FROM usage_logs' },
        { name: 'kommo_tokens', sql: 'SELECT COUNT(*) as count FROM kommo_tokens' },
        { name: 'reports', sql: 'SELECT COUNT(*) as count FROM reports' }
      ];
      
      for (const query of queries) {
        const result = await executeQuery(query.sql, [], `getStats_${query.name}`);
        stats[query.name] = parseInt(result.rows[0]?.count || 0);
      }
      
      return stats;
    } catch (error) {
      logger.error('Failed to get database stats', { error: error.message });
      throw error;
    }
  },

  // Connection health check
  testConnection: async () => {
    try {
      const result = await executeQuery('SELECT NOW() as current_time, version() as version', [], 'testConnection');
      logger.info('PostgreSQL connection test successful', { 
        current_time: result.rows[0].current_time,
        version: result.rows[0].version.substring(0, 50) + '...'
      });
      return true;
    } catch (error) {
      logger.error('PostgreSQL connection test failed', { error: error.message });
      return false;
    }
  },

  // Pool status
  getPoolStatus: () => {
    return {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
  },

  // Database backup functions
  createBackup,
  cleanupOldBackups,
  
  // Initialize database tables
  initializeTables: async () => {
    try {
      logger.info('Initializing database tables...');
      
      // Read and execute the migration SQL
      const migrationPath = path.join(__dirname, 'migrations', 'postgres-migration.sql');
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        await executeQuery(migrationSQL, [], 'initializeTables');
        logger.info('Database tables initialized successfully');
      } else {
        logger.warn('Migration file not found, skipping table initialization');
      }
    } catch (error) {
      logger.error('Failed to initialize database tables', { error: error.message });
      throw error;
    }
  }
};

module.exports = { pool, dbHelpers, logger };
