const { Pool } = require('pg');
const { logger } = require('./logger');

// Production database configuration
const productionConfig = {
  // Connection settings
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'hmis_production',
  user: process.env.DB_USER || 'hmis_user',
  password: process.env.DB_PASSWORD,

  // Connection pool settings
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  min: parseInt(process.env.DB_MIN_CONNECTIONS) || 5,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,

  // SSL settings for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    ca: process.env.DB_SSL_CA,
    cert: process.env.DB_SSL_CERT,
    key: process.env.DB_SSL_KEY
  } : false,

  // Query timeout
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,

  // Application name for monitoring
  application_name: 'HMIS-Backend',

  // Statement timeout
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,

  // Keep alive settings
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

// Create production pool
let pool;

try {
  pool = new Pool(productionConfig);

  // Handle pool errors
  pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  });

  // Handle pool connect
  pool.on('connect', (client) => {
    logger.info('New client connected to database', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    });
  });

  // Handle pool acquire
  pool.on('acquire', (client) => {
    logger.debug('Client acquired from pool', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    });
  });

  // Handle pool remove
  pool.on('remove', (client) => {
    logger.info('Client removed from pool', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    });
  });

  logger.info('Production database pool created successfully', {
    host: productionConfig.host,
    port: productionConfig.port,
    database: productionConfig.database,
    maxConnections: productionConfig.max,
    ssl: !!productionConfig.ssl
  });

} catch (error) {
  logger.error('Failed to create production database pool', {
    error: error.message,
    stack: error.stack,
    config: {
      host: productionConfig.host,
      port: productionConfig.port,
      database: productionConfig.database
    }
  });
  throw error;
}

// Enhanced query function with retry logic
const queryWithRetry = async (text, params, retries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const start = Date.now();
      const result = await pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Database query executed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rowCount: result.rowCount,
        attempt
      });

      return result;
    } catch (error) {
      lastError = error;

      logger.warn('Database query failed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        error: error.message,
        attempt,
        maxRetries: retries
      });

      // Don't retry on certain errors
      if (error.code === '42P01' || // relation does not exist
          error.code === '42703' || // column does not exist
          error.code === '23505' || // unique violation
          error.code === '23503') { // foreign key violation
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  logger.error('Database query failed after all retries', {
    query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    error: lastError.message,
    maxRetries: retries
  });

  throw lastError;
};

// Health check function
const healthCheck = async () => {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    const duration = Date.now() - start;

    return {
      status: 'healthy',
      responseTime: duration,
      currentTime: result.rows[0].current_time,
      version: result.rows[0].version,
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  } catch (error) {
    logger.error('Database health check failed', {
      error: error.message,
      stack: error.stack
    });

    return {
      status: 'unhealthy',
      error: error.message,
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  }
};

// Connection test function
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test');
    client.release();

    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
};

// Graceful shutdown function
const closePool = async () => {
  try {
    logger.info('Closing database pool...');
    await pool.end();
    logger.info('Database pool closed successfully');
  } catch (error) {
    logger.error('Error closing database pool', {
      error: error.message,
      stack: error.stack
    });
  }
};

// Transaction helper
const withTransaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Batch insert helper
const batchInsert = async (table, columns, values, batchSize = 1000) => {
  if (values.length === 0) return [];

  const results = [];

  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    const placeholders = batch.map((_, index) => {
      const rowIndex = i + index;
      const rowPlaceholders = columns.map((_, colIndex) =>
        `$${rowIndex * columns.length + colIndex + 1}`
      ).join(', ');
      return `(${rowPlaceholders})`;
    }).join(', ');

    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${placeholders}
      RETURNING *
    `;

    const flatValues = batch.flat();
    const result = await queryWithRetry(query, flatValues);
    results.push(...result.rows);
  }

  return results;
};

// Export the enhanced database interface
module.exports = {
  // Main query function
  query: queryWithRetry,

  // Pool instance for advanced operations
  pool,

  // Utility functions
  healthCheck,
  testConnection,
  closePool,
  withTransaction,
  batchInsert,

  // Configuration
  config: productionConfig
};
