const { 
  createBackup, 
  cleanupOldBackups, 
  getDatabaseStats 
} = require('../database-pg');
const cron = require('node-cron');

// Logger utility
const logger = {
  info: (message, data = {}) => {
    console.log(`[MAINTENANCE-INFO] ${new Date().toISOString()}: ${message}`, data);
  },
  error: (message, error = {}) => {
    console.error(`[MAINTENANCE-ERROR] ${new Date().toISOString()}: ${message}`, error);
  },
  warn: (message, data = {}) => {
    console.warn(`[MAINTENANCE-WARN] ${new Date().toISOString()}: ${message}`, data);
  }
};

// Daily backup task
async function performDailyBackup() {
  try {
    logger.info('Starting daily database backup');
    
    // Create backup
    const backupFile = await createBackup();
    logger.info('Daily backup completed successfully', { backupFile });
    
    // Clean up old backups
    const deletedCount = await cleanupOldBackups();
    if (deletedCount > 0) {
      logger.info('Old backups cleaned up', { deletedCount });
    }
    
    // Get database stats
    const stats = await getDatabaseStats();
    logger.info('Database maintenance completed', { stats });
    
  } catch (error) {
    logger.error('Database maintenance failed', { error: error.message });
  }
}

// Weekly optimization task
async function performWeeklyOptimization() {
  try {
    logger.info('Starting weekly database optimization');
    
    // VACUUM the database to reclaim space
    await new Promise((resolve, reject) => {
      const { pool } = require('../database-pg');
      pool.query('VACUUM', (err) => {
        if (err) {
          logger.error('Failed to VACUUM database', { error: err.message });
          reject(err);
        } else {
          logger.info('Database VACUUM completed successfully');
          resolve();
        }
      });
    });
    
    // Analyze tables for better query planning
    await new Promise((resolve, reject) => {
      const { pool } = require('../database-pg');
      pool.query('ANALYZE', (err) => {
        if (err) {
          logger.error('Failed to ANALYZE database', { error: err.message });
          reject(err);
        } else {
          logger.info('Database ANALYZE completed successfully');
          resolve();
        }
      });
    });
    
    logger.info('Weekly database optimization completed');
    
  } catch (error) {
    logger.error('Weekly database optimization failed', { error: error.message });
  }
}

// Start maintenance scheduler
function startMaintenanceScheduler() {
  logger.info('Starting database maintenance scheduler');
  
  // Daily backup at 2 AM
  cron.schedule('0 2 * * *', performDailyBackup, {
    scheduled: true,
    timezone: "UTC"
  });
  
  // Weekly optimization on Sunday at 3 AM
  cron.schedule('0 3 * * 0', performWeeklyOptimization, {
    scheduled: true,
    timezone: "UTC"
  });
  
  logger.info('Database maintenance scheduler started');
}

// Manual maintenance functions
async function manualBackup() {
  logger.info('Manual backup requested');
  await performDailyBackup();
}

async function manualOptimization() {
  logger.info('Manual optimization requested');
  await performWeeklyOptimization();
}

// Get maintenance status
async function getMaintenanceStatus() {
  try {
    const stats = await getDatabaseStats();
    const fs = require('fs');
    const path = require('path');
    
    // Check backup directory
    const backupPath = process.env.DB_BACKUP_PATH || path.join(__dirname, '../backups');
    let backupCount = 0;
    let latestBackup = null;
    
    if (fs.existsSync(backupPath)) {
      const files = fs.readdirSync(backupPath);
      backupCount = files.filter(file => file.startsWith('saas-backup-') && file.endsWith('.db')).length;
      
      if (backupCount > 0) {
        const backupFiles = files
          .filter(file => file.startsWith('saas-backup-') && file.endsWith('.db'))
          .map(file => ({
            name: file,
            path: path.join(backupPath, file),
            mtime: fs.statSync(path.join(backupPath, file)).mtime
          }))
          .sort((a, b) => b.mtime - a.mtime);
        
        latestBackup = backupFiles[0];
      }
    }
    
    return {
      database: stats,
      backups: {
        count: backupCount,
        latest: latestBackup,
        directory: backupPath
      },
      maintenance: {
        dailyBackup: '0 2 * * *',
        weeklyOptimization: '0 3 * * 0',
        timezone: 'UTC'
      }
    };
  } catch (error) {
    logger.error('Failed to get maintenance status', { error: error.message });
    throw error;
  }
}

module.exports = {
  startMaintenanceScheduler,
  performDailyBackup,
  performWeeklyOptimization,
  manualBackup,
  manualOptimization,
  getMaintenanceStatus
};
