const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'saas.db');
const BACKUP_PATH = process.env.DB_BACKUP_PATH || path.join(__dirname, 'backups');
const BACKUP_RETENTION_DAYS = parseInt(process.env.DB_BACKUP_RETENTION_DAYS) || 30;

// Logger utility
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

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_PATH)) {
  fs.mkdirSync(BACKUP_PATH, { recursive: true });
  logger.info('Created backup directory', { path: BACKUP_PATH });
}

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    logger.error('Failed to open database', { error: err.message, path: DB_PATH });
  } else {
    logger.info('Connected to SQLite database successfully', { path: DB_PATH });
    
    // Enable WAL mode for better concurrency in production
    if (process.env.NODE_ENV === 'production') {
      db.run('PRAGMA journal_mode=WAL', (err) => {
        if (err) {
          logger.warn('Failed to enable WAL mode', { error: err.message });
        } else {
          logger.info('WAL mode enabled for production');
        }
      });
      
      // Set other production optimizations
      db.run('PRAGMA synchronous=NORMAL', (err) => {
        if (err) logger.warn('Failed to set synchronous mode', { error: err.message });
      });
      
      db.run('PRAGMA cache_size=10000', (err) => {
        if (err) logger.warn('Failed to set cache size', { error: err.message });
      });
      
      db.run('PRAGMA temp_store=MEMORY', (err) => {
        if (err) logger.warn('Failed to set temp store', { error: err.message });
      });
      
      // Force checkpoint every 1000 pages or on close
      db.run('PRAGMA wal_checkpoint(TRUNCATE)', (err) => {
        if (err) {
          logger.warn('Failed to checkpoint WAL', { error: err.message });
        } else {
          logger.info('WAL checkpoint completed');
        }
      });
    }
    
    initializeTables();
  }
});

// Graceful shutdown handler
process.on('SIGINT', () => {
  logger.info('Shutting down database gracefully...');
  db.run('PRAGMA wal_checkpoint(TRUNCATE)', (err) => {
    if (err) logger.warn('Failed to checkpoint WAL on shutdown', { error: err.message });
    db.close((err) => {
      if (err) {
        logger.error('Error closing database', { error: err.message });
      } else {
        logger.info('Database closed successfully');
      }
      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  logger.info('Shutting down database gracefully...');
  db.run('PRAGMA wal_checkpoint(TRUNCATE)', (err) => {
    if (err) logger.warn('Failed to checkpoint WAL on shutdown', { error: err.message });
    db.close((err) => {
      if (err) {
        logger.error('Error closing database', { error: err.message });
      } else {
        logger.info('Database closed successfully');
      }
      process.exit(0);
    });
  });
});

// Database backup functionality
function createBackup() {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_PATH, `saas-backup-${timestamp}.db`);
    
    logger.info('Creating database backup', { backupFile });
    
    const backupDb = new sqlite3.Database(backupFile, (err) => {
      if (err) {
        logger.error('Failed to create backup database', { error: err.message });
        reject(err);
        return;
      }
      
      db.backup(backupDb, (err) => {
        if (err) {
          logger.error('Failed to backup database', { error: err.message });
          reject(err);
        } else {
          logger.info('Database backup completed successfully', { backupFile });
          backupDb.close();
          resolve(backupFile);
        }
      });
    });
  });
}

// Clean up old backups
function cleanupOldBackups() {
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
        if (file.startsWith('saas-backup-') && file.endsWith('.db')) {
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

// Initialize database tables
function initializeTables() {
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      kommo_account TEXT,
      email_verified BOOLEAN DEFAULT FALSE,
      stripe_customer_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Subscriptions table
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_type TEXT NOT NULL CHECK(plan_type IN ('ENTERPRISE')),
      status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'CANCELLED', 'EXPIRED', 'TRIAL')),
      trial_ends_at DATETIME,
      current_period_start DATETIME,
      current_period_end DATETIME,
      cancelled_at DATETIME,
      cancel_at_period_end BOOLEAN DEFAULT FALSE,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`,
    
    // Usage logs table
    `CREATE TABLE IF NOT EXISTS usage_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      metadata TEXT, -- JSON string for additional data
      date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`,
    
    // Feature access table
    `CREATE TABLE IF NOT EXISTS feature_access (
      id TEXT PRIMARY KEY,
      subscription_id TEXT NOT NULL,
      feature_name TEXT NOT NULL,
      enabled BOOLEAN DEFAULT TRUE,
      usage_limit INTEGER,
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE CASCADE
    )`,
    
    // Kommo tokens table - one token per account domain (shared among users)
    `CREATE TABLE IF NOT EXISTS kommo_tokens (
      id TEXT PRIMARY KEY,
      account_domain TEXT UNIQUE NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  tables.forEach((sql, index) => {
    db.run(sql, (err) => {
      if (err) {
        logger.error(`Failed to create table ${index + 1}`, { error: err.message, sql });
      } else {
        logger.debug(`Table ${index + 1} created/verified successfully`);
      }
    });
  });

  // Create indexes for better performance
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_usage_logs_user_date ON usage_logs(user_id, date)',
    'CREATE INDEX IF NOT EXISTS idx_kommo_tokens_account ON kommo_tokens(account_domain)',
    'CREATE INDEX IF NOT EXISTS idx_users_kommo_account ON users(kommo_account)',
    'CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)',
    'CREATE INDEX IF NOT EXISTS idx_usage_logs_action_type ON usage_logs(action_type)'
  ];

  indexes.forEach(sql => {
    db.run(sql, (err) => {
      if (err) {
        logger.error('Failed to create index', { error: err.message, sql });
      } else {
        logger.debug('Index created/verified successfully');
      }
    });
  });
}

// Database helper functions
const dbHelpers = {
  // User operations
  createUser: (userData) => {
    return new Promise((resolve, reject) => {
      const { id, email, password_hash, name, kommo_account } = userData;
      const sql = `INSERT INTO users (id, email, password_hash, name, kommo_account) 
                   VALUES (?, ?, ?, ?, ?)`;
      
      logger.debug('Creating new user', { id, email, name, kommo_account });
      
      db.run(sql, [id, email, password_hash, name, kommo_account], function(err) {
        if (err) {
          logger.error('Failed to create user', { error: err.message, email });
          reject(err);
        } else {
          logger.info('User created successfully', { id, email, name });
          resolve({ id, email, name, kommo_account });
        }
      });
    });
  },

  getUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ?';
      db.get(sql, [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  getAllUsers: () => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users';
      db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  updateUser: (id, updates) => {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(id);
      
      const sql = `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      
      logger.debug('Updating user', { id, updates: Object.keys(updates) });
      
      db.run(sql, values, function(err) {
        if (err) {
          logger.error('Failed to update user', { error: err.message, id });
          reject(err);
        } else {
          logger.info('User updated successfully', { id, changes: this.changes });
          resolve({ changes: this.changes });
        }
      });
    });
  },

  findUserByStripeCustomerId: (stripe_customer_id) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE stripe_customer_id = ?';
      db.get(sql, [stripe_customer_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Subscription operations
  createSubscription: (subscriptionData) => {
    return new Promise((resolve, reject) => {
      const { id, user_id, plan_type, status, trial_ends_at } = subscriptionData;
      const sql = `INSERT INTO subscriptions (id, user_id, plan_type, status, trial_ends_at) 
                   VALUES (?, ?, ?, ?, ?)`;
      
      db.run(sql, [id, user_id, plan_type, status, trial_ends_at], function(err) {
        if (err) reject(err);
        else resolve({ id, user_id, plan_type, status, trial_ends_at });
      });
    });
  },

  getUserSubscription: (user_id) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
      db.get(sql, [user_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  updateSubscription: (user_id, updates) => {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(user_id);
      
      const sql = `UPDATE subscriptions SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
      
      db.run(sql, values, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Usage tracking
  logUsage: (user_id, action_type, count = 1, metadata = null) => {
    return new Promise((resolve, reject) => {
      const id = require('uuid').v4();
      const sql = `INSERT INTO usage_logs (id, user_id, action_type, count, metadata) 
                   VALUES (?, ?, ?, ?, ?)`;
      
      db.run(sql, [id, user_id, action_type, count, JSON.stringify(metadata)], function(err) {
        if (err) reject(err);
        else resolve({ id, user_id, action_type, count });
      });
    });
  },

  getUserUsage: (user_id, action_type, date = null) => {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT SUM(count) as total FROM usage_logs WHERE user_id = ? AND action_type = ?';
      const params = [user_id, action_type];
      
      if (date) {
        sql += ' AND date = ?';
        params.push(date);
      }
      
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  },

  // Kommo token operations - one token per account domain (shared among users)
  saveKommoTokens: (account_domain, tokens) => {
    return new Promise((resolve, reject) => {
      logger.debug('Saving Kommo tokens', { account_domain, hasAccessToken: !!tokens.access_token });
      
      // First, try to find existing token for this account
      const findSql = 'SELECT id FROM kommo_tokens WHERE account_domain = ?';
      
      db.get(findSql, [account_domain], (err, existingToken) => {
        if (err) {
          logger.error('Failed to check existing Kommo tokens', { error: err.message, account_domain });
          reject(err);
          return;
        }
        
        const expires_at = new Date(tokens.expires_at);
        
        if (existingToken) {
          // Update existing token
          const updateSql = `UPDATE kommo_tokens 
                           SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP 
                           WHERE id = ?`;
          
          db.run(updateSql, [tokens.access_token, tokens.refresh_token, expires_at, existingToken.id], 
            function(err) {
              if (err) {
                logger.error('Failed to update Kommo tokens', { error: err.message, account_domain });
                reject(err);
              } else {
                logger.info('Kommo tokens updated successfully', { account_domain, id: existingToken.id });
                resolve({ id: existingToken.id, account_domain, updated: true });
              }
            }
          );
        } else {
          // Create new token
          const id = require('uuid').v4();
          const insertSql = `INSERT INTO kommo_tokens 
                           (id, account_domain, access_token, refresh_token, expires_at) 
                           VALUES (?, ?, ?, ?, ?)`;
          
          db.run(insertSql, [id, account_domain, tokens.access_token, tokens.refresh_token, expires_at], 
            function(err) {
              if (err) {
                logger.error('Failed to create Kommo tokens', { error: err.message, account_domain });
                reject(err);
              } else {
                logger.info('Kommo tokens created successfully', { account_domain, id });
                resolve({ id, account_domain, created: true });
              }
            }
          );
        }
      });
    });
  },

  getKommoTokens: (account_domain) => {
    return new Promise((resolve, reject) => {
      logger.debug('Retrieving Kommo tokens', { account_domain });
      
      const sql = 'SELECT * FROM kommo_tokens WHERE account_domain = ?';
      db.get(sql, [account_domain], (err, row) => {
        if (err) {
          logger.error('Failed to retrieve Kommo tokens', { error: err.message, account_domain });
          reject(err);
        } else {
          logger.debug('Kommo tokens retrieved', { account_domain, found: !!row });
          resolve(row);
        }
      });
    });
  },

  // Database maintenance
  createBackup,
  cleanupOldBackups,
  
  // Force checkpoint WAL file
  checkpointWAL: () => {
    return new Promise((resolve, reject) => {
      db.run('PRAGMA wal_checkpoint(TRUNCATE)', (err) => {
        if (err) {
          logger.error('Failed to checkpoint WAL', { error: err.message });
          reject(err);
        } else {
          logger.info('WAL checkpoint completed successfully');
          resolve();
        }
      });
    });
  },
  
  // Get database stats
  getDatabaseStats: () => {
    return new Promise((resolve, reject) => {
      const stats = {};
      
      const queries = [
        { name: 'users', sql: 'SELECT COUNT(*) as count FROM users' },
        { name: 'subscriptions', sql: 'SELECT COUNT(*) as count FROM subscriptions' },
        { name: 'usage_logs', sql: 'SELECT COUNT(*) as count FROM usage_logs' },
        { name: 'kommo_tokens', sql: 'SELECT COUNT(*) as count FROM kommo_tokens' },
        { name: 'db_size', sql: 'SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()' }
      ];
      
      let completed = 0;
      queries.forEach(query => {
        db.get(query.sql, (err, row) => {
          if (err) {
            logger.error(`Failed to get ${query.name} stats`, { error: err.message });
          } else {
            stats[query.name] = row.count || row.size || 0;
          }
          
          completed++;
          if (completed === queries.length) {
            resolve(stats);
          }
        });
      });
    });
  }
};

module.exports = { db, dbHelpers };
