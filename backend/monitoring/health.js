const { db } = require('../database');
const axios = require('axios');

// Health check status
let healthStatus = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  checks: {}
};

// Database health check
async function checkDatabase() {
  try {
    const start = Date.now();
    await new Promise((resolve, reject) => {
      db.get('SELECT 1 as test', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      duration: `${duration}ms`,
      message: 'Database connection successful'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'Database connection failed'
    };
  }
}

// Kommo API health check
async function checkKommoAPI() {
  try {
    const start = Date.now();
    // Test with a simple Kommo API endpoint
    const response = await axios.get('https://www.kommo.com/api/v4/account', {
      timeout: 5000
    });
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      duration: `${duration}ms`,
      message: 'Kommo API accessible'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'Kommo API check failed'
    };
  }
}

// Stripe API health check
async function checkStripeAPI() {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const start = Date.now();
    await stripe.paymentMethods.list({ limit: 1 });
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      duration: `${duration}ms`,
      message: 'Stripe API accessible'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'Stripe API check failed'
    };
  }
}

// Memory usage check
function checkMemoryUsage() {
  const used = process.memoryUsage();
  const memoryUsage = {
    rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
    external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`
  };
  
  // Check if memory usage is reasonable (less than 1GB RSS)
  const rssMB = used.rss / 1024 / 1024;
  const isHealthy = rssMB < 1024; // 1GB limit
  
  return {
    status: isHealthy ? 'healthy' : 'warning',
    memoryUsage,
    message: isHealthy ? 'Memory usage is normal' : 'Memory usage is high'
  };
}

// Disk space check
function checkDiskSpace() {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const dbPath = path.join(__dirname, '../saas.db');
    const stats = fs.statSync(dbPath);
    const sizeMB = stats.size / 1024 / 1024;
    
    return {
      status: 'healthy',
      databaseSize: `${Math.round(sizeMB * 100) / 100} MB`,
      message: 'Disk space check passed'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'Disk space check failed'
    };
  }
}

// Comprehensive health check
async function performHealthCheck() {
  const checks = {};
  
  // Run all health checks
  checks.database = await checkDatabase();
  checks.kommoAPI = await checkKommoAPI();
  checks.stripeAPI = await checkStripeAPI();
  checks.memory = checkMemoryUsage();
  checks.disk = checkDiskSpace();
  
  // Determine overall status
  const unhealthyChecks = Object.values(checks).filter(check => check.status === 'unhealthy');
  const warningChecks = Object.values(checks).filter(check => check.status === 'warning');
  
  let overallStatus = 'healthy';
  if (unhealthyChecks.length > 0) {
    overallStatus = 'unhealthy';
  } else if (warningChecks.length > 0) {
    overallStatus = 'warning';
  }
  
  healthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    uptime: process.uptime(),
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
  
  return healthStatus;
}

// Get cached health status
function getHealthStatus() {
  return healthStatus;
}

// Update health status periodically
function startHealthMonitoring() {
  // Initial health check
  performHealthCheck();
  
  // Update every 30 seconds
  setInterval(performHealthCheck, 30000);
}

module.exports = {
  performHealthCheck,
  getHealthStatus,
  startHealthMonitoring
};
