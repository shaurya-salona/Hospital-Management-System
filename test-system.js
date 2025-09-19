#!/usr/bin/env node

/**
 * HMIS System Test Script
 * Tests the complete system functionality
 */

const http = require('http');
const https = require('https');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
    log('\n' + '='.repeat(60), 'cyan');
    log(`  ${message}`, 'bright');
    log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Test configuration
const config = {
    baseURL: 'http://localhost:5000',
    timeout: 5000,
    testUser: {
        username: 'doctor',
        password: 'doctor123'
    }
};

// Make HTTP request
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: config.timeout
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => reject(new Error('Request timeout')));

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

// Test health endpoint
async function testHealth() {
    try {
        logInfo('Testing health endpoint...');
        const response = await makeRequest(`${config.baseURL}/health`);

        if (response.status === 200) {
            logSuccess('Health endpoint is working');
            return true;
        } else {
            logError(`Health endpoint returned status ${response.status}`);
            return false;
        }
    } catch (error) {
        logError(`Health endpoint test failed: ${error.message}`);
        return false;
    }
}

// Test authentication
async function testAuthentication() {
    try {
        logInfo('Testing authentication...');

        // Test login
        const loginResponse = await makeRequest(`${config.baseURL}/api/auth/login`, {
            method: 'POST',
            body: {
                username: config.testUser.username,
                password: config.testUser.password
            }
        });

        if (loginResponse.status === 200 && loginResponse.data.success) {
            logSuccess('Authentication is working');
            return loginResponse.data.data.token;
        } else {
            logError(`Authentication failed: ${loginResponse.data?.message || 'Unknown error'}`);
            return null;
        }
    } catch (error) {
        logError(`Authentication test failed: ${error.message}`);
        return null;
    }
}

// Test protected endpoints
async function testProtectedEndpoints(token) {
    if (!token) {
        logError('No token available for protected endpoint tests');
        return false;
    }

    const endpoints = [
        { name: 'Profile', url: '/api/auth/profile' },
        { name: 'Patients', url: '/api/patients' },
        { name: 'Appointments', url: '/api/appointments' },
        { name: 'Doctors', url: '/api/doctors/availability' }
    ];

    let successCount = 0;

    for (const endpoint of endpoints) {
        try {
            logInfo(`Testing ${endpoint.name} endpoint...`);

            const response = await makeRequest(`${config.baseURL}${endpoint.url}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                logSuccess(`${endpoint.name} endpoint is working`);
                successCount++;
            } else {
                logError(`${endpoint.name} endpoint returned status ${response.status}`);
            }
        } catch (error) {
            logError(`${endpoint.name} endpoint test failed: ${error.message}`);
        }
    }

    return successCount === endpoints.length;
}

// Test API documentation
async function testAPIDocs() {
    try {
        logInfo('Testing API documentation...');
        const response = await makeRequest(`${config.baseURL}/api-docs`);

        if (response.status === 200) {
            logSuccess('API documentation is accessible');
            return true;
        } else {
            logError(`API documentation returned status ${response.status}`);
            return false;
        }
    } catch (error) {
        logError(`API documentation test failed: ${error.message}`);
        return false;
    }
}

// Test frontend accessibility
async function testFrontend() {
    try {
        logInfo('Testing frontend accessibility...');
        const response = await makeRequest('http://localhost:80');

        if (response.status === 200) {
            logSuccess('Frontend is accessible');
            return true;
        } else {
            logError(`Frontend returned status ${response.status}`);
            return false;
        }
    } catch (error) {
        logError(`Frontend test failed: ${error.message}`);
        return false;
    }
}

// Main test function
async function runTests() {
    logHeader('HMIS System Test Suite');

    const tests = [
        { name: 'Health Check', test: testHealth },
        { name: 'Authentication', test: testAuthentication },
        { name: 'API Documentation', test: testAPIDocs },
        { name: 'Frontend', test: testFrontend }
    ];

    let results = {};
    let authToken = null;

    // Run tests sequentially
    for (const test of tests) {
        logInfo(`Running ${test.name} test...`);

        if (test.name === 'Authentication') {
            authToken = await test.test();
            results[test.name] = authToken !== null;
        } else {
            results[test.name] = await test.test();
        }
    }

    // Test protected endpoints if authentication succeeded
    if (authToken) {
        logInfo('Running protected endpoint tests...');
        results['Protected Endpoints'] = await testProtectedEndpoints(authToken);
    }

    // Display results
    logHeader('Test Results');

    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;

    Object.entries(results).forEach(([name, passed]) => {
        if (passed) {
            logSuccess(`${name}: PASSED`);
        } else {
            logError(`${name}: FAILED`);
        }
    });

    logHeader('Summary');
    logInfo(`Tests passed: ${passed}/${total}`);

    if (passed === total) {
        logSuccess('All tests passed! HMIS system is working correctly.');
        process.exit(0);
    } else {
        logError('Some tests failed. Please check the system configuration.');
        process.exit(1);
    }
}

// Handle errors
process.on('uncaughtException', (error) => {
    logError('Uncaught Exception:');
    logError(error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logError('Unhandled Rejection:');
    logError(reason);
    process.exit(1);
});

// Run tests
if (require.main === module) {
    runTests();
}

module.exports = {
    runTests,
    testHealth,
    testAuthentication,
    testProtectedEndpoints
};
