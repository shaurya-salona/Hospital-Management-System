#!/usr/bin/env node

/**
 * HMIS Startup Script
 * Handles initialization and startup of the Hospital Management Information System
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
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

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Check if Docker is available
function checkDocker() {
    return new Promise((resolve) => {
        exec('docker --version', (error) => {
            if (error) {
                logError('Docker is not installed or not in PATH');
                logInfo('Please install Docker Desktop from https://www.docker.com/products/docker-desktop');
                resolve(false);
            } else {
                logSuccess('Docker is available');
                resolve(true);
            }
        });
    });
}

// Check if Docker Compose is available
function checkDockerCompose() {
    return new Promise((resolve) => {
        exec('docker-compose --version', (error) => {
            if (error) {
                logError('Docker Compose is not installed or not in PATH');
                resolve(false);
            } else {
                logSuccess('Docker Compose is available');
                resolve(true);
            }
        });
    });
}

// Check if Node.js is available
function checkNode() {
    return new Promise((resolve) => {
        exec('node --version', (error, stdout) => {
            if (error) {
                logError('Node.js is not installed or not in PATH');
                logInfo('Please install Node.js from https://nodejs.org/');
                resolve(false);
            } else {
                logSuccess(`Node.js ${stdout.trim()} is available`);
                resolve(true);
            }
        });
    });
}

// Check if npm is available
function checkNpm() {
    return new Promise((resolve) => {
        exec('npm --version', (error, stdout) => {
            if (error) {
                logError('npm is not installed or not in PATH');
                resolve(false);
            } else {
                logSuccess(`npm ${stdout.trim()} is available`);
                resolve(true);
            }
        });
    });
}

// Check if PostgreSQL is available
function checkPostgreSQL() {
    return new Promise((resolve) => {
        exec('psql --version', (error) => {
            if (error) {
                logWarning('PostgreSQL client is not available (optional for Docker setup)');
                resolve(false);
            } else {
                logSuccess('PostgreSQL client is available');
                resolve(true);
            }
        });
    });
}

// Check system requirements
async function checkRequirements() {
    logHeader('Checking System Requirements');

    const checks = [
        { name: 'Node.js', check: checkNode },
        { name: 'npm', check: checkNpm },
        { name: 'Docker', check: checkDocker },
        { name: 'Docker Compose', check: checkDockerCompose },
        { name: 'PostgreSQL', check: checkPostgreSQL }
    ];

    const results = await Promise.all(checks.map(async (check) => {
        const result = await check.check();
        return { name: check.name, available: result };
    }));

    const required = ['Node.js', 'npm'];
    const missing = results.filter(r => required.includes(r.name) && !r.available);

    if (missing.length > 0) {
        logError('Missing required dependencies:');
        missing.forEach(m => logError(`  - ${m.name}`));
        process.exit(1);
    }

    logSuccess('All required dependencies are available');
    return results;
}

// Check if .env file exists
function checkEnvFile() {
    const envPath = path.join(__dirname, '.env');
    const envExamplePath = path.join(__dirname, 'env.example');

    if (!fs.existsSync(envPath)) {
        if (fs.existsSync(envExamplePath)) {
            logWarning('.env file not found, copying from env.example');
            fs.copyFileSync(envExamplePath, envPath);
            logSuccess('.env file created from template');
        } else {
            logError('No .env file found and no env.example template available');
            return false;
        }
    } else {
        logSuccess('.env file exists');
    }

    return true;
}

// Install backend dependencies
function installBackendDependencies() {
    return new Promise((resolve, reject) => {
        logInfo('Installing backend dependencies...');

        const npm = spawn('npm', ['install'], {
            cwd: path.join(__dirname, 'backend'),
            stdio: 'inherit',
            shell: true
        });

        npm.on('close', (code) => {
            if (code === 0) {
                logSuccess('Backend dependencies installed');
                resolve();
            } else {
                logError('Failed to install backend dependencies');
                reject(new Error('npm install failed'));
            }
        });
    });
}

// Start backend server
function startBackend() {
    return new Promise((resolve, reject) => {
        logInfo('Starting backend server...');

        const server = spawn('npm', ['start'], {
            cwd: path.join(__dirname, 'backend'),
            stdio: 'inherit',
            shell: true
        });

        // Give server time to start
        setTimeout(() => {
            logSuccess('Backend server started');
            resolve(server);
        }, 3000);

        server.on('error', (error) => {
            logError('Failed to start backend server');
            reject(error);
        });
    });
}

// Start with Docker
function startWithDocker() {
    return new Promise((resolve, reject) => {
        logInfo('Starting HMIS with Docker Compose...');

        const docker = spawn('docker-compose', ['up', '--build'], {
            cwd: __dirname,
            stdio: 'inherit',
            shell: true
        });

        docker.on('close', (code) => {
            if (code === 0) {
                logSuccess('HMIS started successfully with Docker');
                resolve();
            } else {
                logError('Failed to start HMIS with Docker');
                reject(new Error('Docker Compose failed'));
            }
        });
    });
}

// Start without Docker (development mode)
async function startWithoutDocker() {
    logHeader('Starting HMIS in Development Mode');

    try {
        await installBackendDependencies();
        const server = await startBackend();

        logHeader('HMIS Started Successfully');
        logSuccess('Backend API: http://localhost:5000');
        logSuccess('Frontend: http://localhost:3000 (if configured)');
        logSuccess('API Documentation: http://localhost:5000/api-docs');
        logSuccess('Health Check: http://localhost:5000/health');

        logInfo('Press Ctrl+C to stop the server');

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            logInfo('Shutting down HMIS...');
            server.kill();
            process.exit(0);
        });

    } catch (error) {
        logError('Failed to start HMIS in development mode');
        logError(error.message);
        process.exit(1);
    }
}

// Main startup function
async function main() {
    logHeader('Hospital Management Information System (HMIS)');
    logInfo('Starting HMIS initialization...');

    try {
        // Check system requirements
        const requirements = await checkRequirements();

        // Check environment configuration
        if (!checkEnvFile()) {
            process.exit(1);
        }

        // Determine startup method
        const dockerAvailable = requirements.find(r => r.name === 'Docker' && r.available);
        const dockerComposeAvailable = requirements.find(r => r.name === 'Docker Compose' && r.available);

        if (dockerAvailable && dockerComposeAvailable) {
            logInfo('Docker and Docker Compose available - starting with Docker');
            await startWithDocker();
        } else {
            logInfo('Docker not available - starting in development mode');
            await startWithoutDocker();
        }

    } catch (error) {
        logError('Failed to start HMIS');
        logError(error.message);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logError('Uncaught Exception:');
    logError(error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logError('Unhandled Rejection at:');
    logError(promise);
    logError('Reason:');
    logError(reason);
    process.exit(1);
});

// Start the application
if (require.main === module) {
    main();
}

module.exports = {
    checkRequirements,
    startWithDocker,
    startWithoutDocker
};
