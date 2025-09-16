#!/usr/bin/env node

/**
 * Production Database Setup Script
 * This script sets up PostgreSQL database for production use
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const logger = require('../config/logger');

// Database setup configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

async function setupProductionDatabase() {
  logger.info('🚀 Starting PostgreSQL production database setup...');
  
  try {
    // Step 1: Connect to PostgreSQL server (without specific database)
    const adminPool = new Pool({
      ...dbConfig,
      database: 'postgres' // Connect to default postgres database
    });

    const adminClient = await adminPool.connect();
    logger.info('✅ Connected to PostgreSQL server');

    // Step 2: Create database if it doesn't exist
    const dbName = config.database.name;
    const createDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    
    const dbExists = await adminClient.query(createDbQuery, [dbName]);
    
    if (dbExists.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      logger.info(`✅ Database '${dbName}' created successfully`);
    } else {
      logger.info(`✅ Database '${dbName}' already exists`);
    }

    adminClient.release();
    await adminPool.end();

    // Step 3: Connect to the new database and create schema
    const appPool = new Pool({
      ...dbConfig,
      database: dbName
    });

    const appClient = await appPool.connect();
    logger.info(`✅ Connected to database '${dbName}'`);

    // Step 4: Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await appClient.query(schema);
      logger.info('✅ Database schema created successfully');
    } else {
      logger.warn('⚠️ Schema file not found, creating basic tables...');
      await createBasicTables(appClient);
    }

    // Step 5: Seed demo data
    await seedDemoData(appClient);

    appClient.release();
    await appPool.end();

    logger.info('🎉 Production database setup completed successfully!');
    logger.info('📊 Database Configuration:');
    logger.info(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    logger.info(`   Database: ${dbName}`);
    logger.info(`   User: ${dbConfig.user}`);
    logger.info(`   SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}`);

  } catch (error) {
    logger.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

async function createBasicTables(client) {
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'patient')),
      phone VARCHAR(20),
      address TEXT,
      date_of_birth DATE,
      gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Patients table
    `CREATE TABLE IF NOT EXISTS patients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      patient_id VARCHAR(50) UNIQUE NOT NULL,
      emergency_contact_name VARCHAR(100),
      emergency_contact_phone VARCHAR(20),
      insurance_provider VARCHAR(100),
      insurance_number VARCHAR(100),
      medical_history TEXT,
      allergies TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Appointments table
    `CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
      appointment_date TIMESTAMP NOT NULL,
      status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Medical records table
    `CREATE TABLE IF NOT EXISTS medical_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
      visit_date TIMESTAMP NOT NULL,
      diagnosis TEXT,
      treatment TEXT,
      prescription TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const table of tables) {
    await client.query(table);
  }
  
  logger.info('✅ Basic tables created successfully');
}

async function seedDemoData(client) {
  // Check if data already exists
  const result = await client.query('SELECT COUNT(*) FROM users');
  if (parseInt(result.rows[0].count) > 0) {
    logger.info('✅ Database already contains data, skipping seed');
    return;
  }

  const bcrypt = require('bcryptjs');
  
  // Seed users
  const users = [
    {
      email: 'admin@hospital.com',
      password: await bcrypt.hash('admin123', 10),
      first_name: 'System',
      last_name: 'Administrator',
      role: 'admin',
      phone: '+1-555-0100'
    },
    {
      email: 'dr.smith@hospital.com',
      password: await bcrypt.hash('doctor123', 10),
      first_name: 'Dr. John',
      last_name: 'Smith',
      role: 'doctor',
      phone: '+1-555-0101'
    },
    {
      email: 'patient@hospital.com',
      password: await bcrypt.hash('patient123', 10),
      first_name: 'Jane',
      last_name: 'Doe',
      role: 'patient',
      phone: '+1-555-0102'
    }
  ];

  for (const user of users) {
    await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [user.email, user.password, user.first_name, user.last_name, user.role, user.phone]);
  }

  logger.info('✅ Demo users seeded successfully');
}

// Run setup if called directly
if (require.main === module) {
  setupProductionDatabase();
}

module.exports = { setupProductionDatabase };


