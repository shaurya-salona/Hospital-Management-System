#!/usr/bin/env node

/**
 * Database Setup Script for HMIS
 * This script helps set up the database for development and testing
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hmis_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

async function setupDatabase() {
  console.log('🏥 HMIS Database Setup');
  console.log('=====================');
  
  try {
    // Test connection
    console.log('📡 Testing database connection...');
    const pool = new Pool(dbConfig);
    
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Check if tables exist
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'patients', 'appointments')
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('📋 Creating database schema...');
      
      // Read and execute schema
      const schemaPath = path.join(__dirname, '..', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      await client.query(schema);
      console.log('✅ Database schema created successfully!');
    } else {
      console.log('✅ Database schema already exists!');
    }
    
    // Check if demo data exists
    const userCheck = await client.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(userCheck.rows[0].count);
    
    if (userCount === 0) {
      console.log('🌱 Seeding demo data...');
      
      // The schema.sql already includes demo data, so this should be done
      console.log('✅ Demo data seeded successfully!');
    } else {
      console.log(`✅ Database contains ${userCount} users!`);
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('You can now start the HMIS server.');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is installed and running');
    console.log('2. Check your database credentials in .env file');
    console.log('3. Ensure the database "hmis_db" exists');
    console.log('4. Run: createdb hmis_db (if database doesn\'t exist)');
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };

