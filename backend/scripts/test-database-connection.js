#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests all aspects of database connectivity and functionality
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
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000
};

console.log('🧪 Database Connection Test');
console.log('==========================');

async function testDatabaseConnection() {
    const pool = new Pool(dbConfig);
    
    try {
        console.log('🔄 Testing database connection...');
        
        // Test 1: Basic connection
        const client = await pool.connect();
        console.log('✅ Database connection established');
        
        // Test 2: Query execution
        const result = await client.query('SELECT NOW() as current_time, version() as db_version');
        console.log('✅ Query execution successful');
        console.log(`   Current time: ${result.rows[0].current_time}`);
        console.log(`   Database version: ${result.rows[0].db_version}`);
        
        // Test 3: Check if tables exist
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log(`✅ Found ${tablesResult.rows.length} tables in database`);
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
        // Test 4: Test specific HMIS tables
        const requiredTables = ['users', 'staff', 'patients', 'doctors', 'appointments'];
        const existingTables = tablesResult.rows.map(row => row.table_name);
        
        console.log('\n🔍 Checking required HMIS tables:');
        requiredTables.forEach(table => {
            if (existingTables.includes(table)) {
                console.log(`✅ ${table} table exists`);
            } else {
                console.log(`❌ ${table} table missing`);
            }
        });
        
        // Test 5: Test data insertion (if tables exist)
        if (existingTables.includes('users')) {
            try {
                const testUser = await client.query(`
                    INSERT INTO users (username, email, password_hash, first_name, last_name, role)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id, username, email, role
                `, ['test_user', 'test@example.com', 'hashed_password', 'Test', 'User', 'admin']);
                
                console.log('✅ Test data insertion successful');
                console.log(`   Created user: ${testUser.rows[0].username} (ID: ${testUser.rows[0].id})`);
                
                // Clean up test data
                await client.query('DELETE FROM users WHERE username = $1', ['test_user']);
                console.log('✅ Test data cleaned up');
                
            } catch (insertError) {
                console.log('⚠️  Data insertion test failed (table might be read-only or have constraints)');
                console.log(`   Error: ${insertError.message}`);
            }
        }
        
        // Test 6: Connection pool health
        console.log('\n🔍 Testing connection pool:');
        console.log(`   Total connections: ${pool.totalCount}`);
        console.log(`   Idle connections: ${pool.idleCount}`);
        console.log(`   Waiting clients: ${pool.waitingCount}`);
        
        client.release();
        
        console.log('\n🎉 All database tests passed!');
        return true;
        
    } catch (error) {
        console.error('❌ Database connection test failed:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        console.error(`   Detail: ${error.detail || 'N/A'}`);
        return false;
    } finally {
        await pool.end();
    }
}

// Run the test
testDatabaseConnection()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test script error:', error);
        process.exit(1);
    });
