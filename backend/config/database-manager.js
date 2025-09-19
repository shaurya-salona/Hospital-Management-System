/**
 * Centralized Database Manager
 * Provides consistent database access across the application
 */

const { logger } = require('./logger');

// Force demo mode for now to test complete integration
let db;
let isDemoMode = true;

logger.info('Using demo database for testing');
try {
  db = require('./demo-database');
  logger.info('✅ Using demo database');
} catch (demoError) {
  logger.error('❌ Failed to load demo database', { error: demoError.message });
  throw new Error('No database available');
}

// Enhanced database interface
const databaseManager = {
  // Core database operations
  query: db.query,
  getClient: db.getClient,
  transaction: db.transaction,
  
  // Database info
  isDemoMode: () => isDemoMode,
  getDatabaseType: () => isDemoMode ? 'demo' : 'postgresql',
  
  // Health check
  healthCheck: async () => {
    try {
      if (isDemoMode) {
        return { status: 'healthy', type: 'demo', message: 'Demo database is active' };
      }
      
      const result = await db.query('SELECT NOW() as current_time');
      return { 
        status: 'healthy', 
        type: 'postgresql', 
        message: 'Database connection successful',
        timestamp: result.rows[0].current_time
      };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return { status: 'unhealthy', type: isDemoMode ? 'demo' : 'postgresql', error: error.message };
    }
  },
  
  // Get demo data if in demo mode
  getDemoData: () => {
    if (isDemoMode && db.demoData) {
      return db.demoData;
    }
    return null;
  },
  
  // Test connection
  testConnection: async () => {
    try {
      if (isDemoMode) {
        return true;
      }
      
      if (db.testConnection) {
        return await db.testConnection();
      }
      
      // Fallback test
      await db.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database connection test failed', { error: error.message });
      return false;
    }
  }
};

// Log database status on startup
logger.info('Database Manager initialized', {
  type: databaseManager.getDatabaseType(),
  demoMode: isDemoMode
});

module.exports = databaseManager;





