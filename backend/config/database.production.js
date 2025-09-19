const { Pool } = require('pg');
const config = require('./config');
const logger = require('./logger');

// Production PostgreSQL Configuration
const productionConfig = {
  user: config.database.user,
  host: config.database.host,
  database: config.database.name,
  password: config.database.password,
  port: config.database.port,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  statement_timeout: 30000, // Terminate any statement that takes more than 30 seconds
  query_timeout: 30000, // Terminate any query that takes more than 30 seconds
};

// Create production database pool
const pool = new Pool(productionConfig);

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('✅ PostgreSQL connection established successfully');
    logger.info(`Database time: ${result.rows[0].now}`);
    return true;
  } catch (err) {
    logger.error('❌ Failed to connect to PostgreSQL database:', err.message);
    return false;
  }
};

// Initialize database schema
const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    
    // Read and execute schema
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schema);
    client.release();
    
    logger.info('✅ Database schema initialized successfully');
    return true;
  } catch (err) {
    logger.error('❌ Failed to initialize database schema:', err.message);
    return false;
  }
};

// Seed demo data
const seedDemoData = async () => {
  try {
    const client = await pool.connect();
    
    // Check if data already exists
    const result = await client.query('SELECT COUNT(*) FROM users');
    if (result.rows[0].count > 0) {
      logger.info('Database already contains data, skipping seed');
      client.release();
      return true;
    }
    
    // Read and execute seed data
    const fs = require('fs');
    const path = require('path');
    const seedPath = path.join(__dirname, '..', 'scripts', 'seedDemoData.js');
    
    // Execute seed script
    const { exec } = require('child_process');
    exec(`node ${seedPath}`, (error, stdout, stderr) => {
      if (error) {
        logger.error('Seed data execution error:', error);
        return;
      }
      logger.info('✅ Demo data seeded successfully');
    });
    
    client.release();
    return true;
  } catch (err) {
    logger.error('❌ Failed to seed demo data:', err.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  seedDemoData,
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  end: () => pool.end()
};





