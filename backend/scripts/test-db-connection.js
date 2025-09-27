#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests database connectivity and provides diagnostic information
 */

const { Pool } = require('pg');
const config = require('../config/config');

console.log('🔍 HMIS Database Connection Test');
console.log('================================');

// Get database configuration
const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  query_timeout: 10000
};

console.log('📋 Database Configuration:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}`);
console.log('');

// Test database connection
async function testDatabaseConnection() {
  const pool = new Pool(dbConfig);

  try {
    console.log('🔄 Testing database connection...');

    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');

    // Test query execution
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log(`✅ Query execution successful`);
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].version}`);

    // Test table existence
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`✅ Found ${tablesResult.rows.length} tables in database:`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Test specific HMIS tables
    const hmisTables = ['users', 'patients', 'appointments', 'medical_records'];
    console.log('\n🔍 Checking HMIS tables:');

    for (const table of hmisTables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ✅ ${table}: ${countResult.rows[0].count} records`);
      } catch (error) {
        console.log(`   ❌ ${table}: Table not found or error - ${error.message}`);
      }
    }

    client.release();

    // Test connection pool
    console.log('\n🔄 Testing connection pool...');
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
    console.log(`   Total connections: ${poolStats.totalCount}`);
    console.log(`   Idle connections: ${poolStats.idleCount}`);
    console.log(`   Waiting connections: ${poolStats.waitingCount}`);

    await pool.end();
    console.log('✅ Connection pool test successful');

    return true;

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.error(`   Detail: ${error.detail || 'No additional details'}`);

    // Provide troubleshooting suggestions
    console.log('\n🔧 Troubleshooting suggestions:');

    if (error.code === 'ECONNREFUSED') {
      console.log('   - Check if PostgreSQL is running');
      console.log('   - Verify the host and port are correct');
      console.log('   - Check firewall settings');
    } else if (error.code === '28P01') {
      console.log('   - Check username and password');
      console.log('   - Verify user has access to the database');
    } else if (error.code === '3D000') {
      console.log('   - Check if the database exists');
      console.log('   - Verify database name is correct');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   - Check if the hostname is correct');
      console.log('   - Verify DNS resolution');
    }

    await pool.end();
    return false;
  }
}

// Test environment variables
function testEnvironmentVariables() {
  console.log('🔍 Testing environment variables...');

  const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];

  const missing = [];
  const present = [];

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  });

  if (present.length > 0) {
    console.log('✅ Present environment variables:');
    present.forEach(varName => {
      const value = process.env[varName];
      const displayValue = varName.includes('PASSWORD') ? '***' : value;
      console.log(`   ${varName}: ${displayValue}`);
    });
  }

  if (missing.length > 0) {
    console.log('❌ Missing environment variables:');
    missing.forEach(varName => {
      console.log(`   ${varName}: Not set`);
    });
  }

  console.log('');
  return missing.length === 0;
}

// Test Docker connectivity
async function testDockerConnectivity() {
  console.log('🐳 Testing Docker connectivity...');

  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Check if Docker is running
    try {
      await execAsync('docker --version');
      console.log('✅ Docker is available');
    } catch (error) {
      console.log('❌ Docker is not available or not running');
      return false;
    }

    // Check if Docker Compose is available
    try {
      await execAsync('docker-compose --version');
      console.log('✅ Docker Compose is available');
    } catch (error) {
      console.log('❌ Docker Compose is not available');
      return false;
    }

    // Check if HMIS containers are running
    try {
      const { stdout } = await execAsync('docker-compose ps');
      console.log('✅ Docker Compose services status:');
      console.log(stdout);
    } catch (error) {
      console.log('❌ Could not check Docker Compose services');
      console.log('   Make sure you are in the project directory');
    }

    return true;
  } catch (error) {
    console.log('❌ Docker connectivity test failed:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting database connection tests...\n');

  // Test 1: Environment variables
  const envTest = testEnvironmentVariables();

  // Test 2: Docker connectivity
  const dockerTest = await testDockerConnectivity();

  // Test 3: Database connection
  const dbTest = await testDatabaseConnection();

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`Environment Variables: ${envTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Docker Connectivity: ${dockerTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Connection: ${dbTest ? '✅ PASS' : '❌ FAIL'}`);

  if (envTest && dockerTest && dbTest) {
    console.log('\n🎉 All tests passed! Database connection is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Please check the issues above.');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testDatabaseConnection,
  testEnvironmentVariables,
  testDockerConnectivity,
  runTests
};
