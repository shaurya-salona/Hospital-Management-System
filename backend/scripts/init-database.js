#!/usr/bin/env node

/**
 * Database Initialization Script
 * Creates database schema and seeds initial data
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'hmis_db',
    user: process.env.DB_USER || 'hmis_user',
    password: process.env.DB_PASSWORD || 'CHANGE_ME_SECURE_PASSWORD_123!@#',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

async function initializeDatabase() {
    const pool = new Pool(dbConfig);
    
    try {
        console.log('🔄 Initializing database...');
        
        // Test connection first
        const client = await pool.connect();
        console.log('✅ Database connection established');
        
        // Read and execute schema
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            console.log('📄 Reading database schema...');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            // Split schema into individual statements
            const statements = schema
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
            
            console.log(`📊 Executing ${statements.length} schema statements...`);
            
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (statement.trim()) {
                    try {
                        await client.query(statement);
                        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
                    } catch (error) {
                        console.log(`⚠️  Statement ${i + 1} failed (might already exist): ${error.message}`);
                    }
                }
            }
            
            console.log('✅ Database schema created/updated');
        } else {
            console.log('⚠️ Schema file not found, skipping schema creation');
        }
        
        // Seed initial data
        const seedPath = path.join(__dirname, 'seedDemoData.js');
        if (fs.existsSync(seedPath)) {
            console.log('🌱 Seeding database with initial data...');
            const { seedDatabase } = require(seedPath);
            await seedDatabase();
            console.log('✅ Database seeded with initial data');
        } else {
            console.log('⚠️ Seed file not found, skipping data seeding');
        }
        
        // Verify tables were created
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log(`\n📋 Database contains ${tablesResult.rows.length} tables:`);
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
        client.release();
        console.log('\n🎉 Database initialization completed successfully!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.error('   Make sure PostgreSQL is running and accessible');
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run initialization
initializeDatabase();
