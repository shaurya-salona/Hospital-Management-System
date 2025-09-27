#!/usr/bin/env node

/**
 * Backend Integration Test
 * Tests backend API endpoints and database integration
 */

const http = require('http');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5000';
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'hmis_db',
    user: process.env.DB_USER || 'hmis_user',
    password: process.env.DB_PASSWORD || 'CHANGE_ME_SECURE_PASSWORD_123!@#'
};

console.log('🧪 Backend Integration Test');
console.log('==========================');

// Test API endpoint
function testAPIEndpoint(endpoint, method = 'GET', data = null) {
    return new Promise((resolve) => {
        const url = new URL(endpoint, API_BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data ? Buffer.byteLength(data) : 0
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: responseData,
                    success: res.statusCode >= 200 && res.statusCode < 300
                });
            });
        });

        req.on('error', (error) => {
            resolve({
                status: 0,
                error: error.message,
                success: false
            });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            resolve({
                status: 0,
                error: 'Request timeout',
                success: false
            });
        });

        if (data) {
            req.write(data);
        }
        
        req.end();
    });
}

// Test database connection
async function testDatabaseConnection() {
    const pool = new Pool(dbConfig);
    
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time');
        client.release();
        await pool.end();
        
        console.log('✅ Database connection test passed');
        console.log(`   Database time: ${result.rows[0].current_time}`);
        return true;
    } catch (error) {
        console.log('❌ Database connection test failed');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

// Test backend health endpoint
async function testBackendHealth() {
    console.log('\n🔄 Testing backend health endpoint...');
    
    const response = await testAPIEndpoint('/health');
    
    if (response.success) {
        console.log('✅ Backend health endpoint working');
        console.log(`   Status: ${response.status}`);
        return true;
    } else {
        console.log('❌ Backend health endpoint failed');
        console.log(`   Status: ${response.status}`);
        console.log(`   Error: ${response.error || response.data}`);
        return false;
    }
}

// Test API documentation endpoint
async function testAPIDocs() {
    console.log('\n🔄 Testing API documentation endpoint...');
    
    const response = await testAPIEndpoint('/api-docs');
    
    if (response.success) {
        console.log('✅ API documentation endpoint working');
        console.log(`   Status: ${response.status}`);
        return true;
    } else {
        console.log('❌ API documentation endpoint failed');
        console.log(`   Status: ${response.status}`);
        return false;
    }
}

// Test authentication endpoint
async function testAuthEndpoint() {
    console.log('\n🔄 Testing authentication endpoint...');
    
    const loginData = JSON.stringify({
        username: 'admin',
        password: 'admin123'
    });
    
    const response = await testAPIEndpoint('/api/auth/login', 'POST', loginData);
    
    if (response.success) {
        console.log('✅ Authentication endpoint working');
        console.log(`   Status: ${response.status}`);
        return true;
    } else {
        console.log('❌ Authentication endpoint failed');
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${response.data}`);
        return false;
    }
}

// Run all tests
async function runIntegrationTests() {
    console.log('🚀 Starting backend integration tests...\n');
    
    const tests = [
        { name: 'Database Connection', test: testDatabaseConnection },
        { name: 'Backend Health', test: testBackendHealth },
        { name: 'API Documentation', test: testAPIDocs },
        { name: 'Authentication', test: testAuthEndpoint }
    ];
    
    const results = [];
    
    for (const test of tests) {
        console.log(`\n📋 Running ${test.name} test...`);
        const success = await test.test();
        results.push({ name: test.name, success });
        
        if (success) {
            console.log(`✅ ${test.name} test passed`);
        } else {
            console.log(`❌ ${test.name} test failed`);
        }
    }
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    
    results.forEach(result => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`${result.name}: ${status}`);
    });
    
    console.log(`\n📈 Overall: ${passed}/${results.length} tests passed`);
    
    if (failed === 0) {
        console.log('\n🎉 All integration tests passed!');
        return true;
    } else {
        console.log(`\n⚠️  ${failed} test(s) failed`);
        return false;
    }
}

// Run the tests
runIntegrationTests()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Integration test error:', error);
        process.exit(1);
    });
