#!/usr/bin/env node

/**
 * HMIS Startup Script
 * This script starts the HMIS system with proper error handling
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🏥 HMIS Hospital Management System');
console.log('===================================');

// Check if we're in the right directory
const backendPath = path.join(__dirname, 'backend');
const frontendPath = path.join(__dirname, 'frontend');

if (!fs.existsSync(backendPath) || !fs.existsSync(frontendPath)) {
  console.error('❌ Error: Please run this script from the hmis-complete directory');
  process.exit(1);
}

// Function to start backend server
function startBackend() {
  console.log('🚀 Starting Backend Server...');
  
  const backendProcess = spawn('node', ['demo-server.js'], {
    cwd: backendPath,
    stdio: 'inherit',
    shell: true
  });
  
  backendProcess.on('error', (error) => {
    console.error('❌ Backend startup error:', error.message);
    console.log('💡 Try running: cd backend && npm install && node demo-server.js');
  });
  
  backendProcess.on('exit', (code) => {
    if (code !== 0) {
      console.log(`Backend process exited with code ${code}`);
    }
  });
  
  return backendProcess;
}

// Function to start frontend server
function startFrontend() {
  console.log('🌐 Starting Frontend Server...');
  
  const frontendProcess = spawn('node', ['server.js'], {
    cwd: frontendPath,
    stdio: 'inherit',
    shell: true
  });
  
  frontendProcess.on('error', (error) => {
    console.error('❌ Frontend startup error:', error.message);
    console.log('💡 Try running: cd frontend && node server.js');
  });
  
  frontendProcess.on('exit', (code) => {
    if (code !== 0) {
      console.log(`Frontend process exited with code ${code}`);
    }
  });
  
  return frontendProcess;
}

// Main startup function
async function startHMIS() {
  try {
    console.log('📋 Checking system requirements...');
    
    // Check if Node.js is available
    const nodeVersion = process.version;
    console.log(`✅ Node.js version: ${nodeVersion}`);
    
    // Check if backend dependencies are installed
    const backendNodeModules = path.join(backendPath, 'node_modules');
    if (!fs.existsSync(backendNodeModules)) {
      console.log('📦 Installing backend dependencies...');
      const installProcess = spawn('npm', ['install'], {
        cwd: backendPath,
        stdio: 'inherit',
        shell: true
      });
      
      await new Promise((resolve, reject) => {
        installProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`npm install failed with code ${code}`));
          }
        });
      });
    }
    
    console.log('✅ Backend dependencies ready');
    
    // Start servers
    const backendProcess = startBackend();
    
    // Wait a bit before starting frontend
    setTimeout(() => {
      const frontendProcess = startFrontend();
      
      console.log('\n🎉 HMIS System Started Successfully!');
      console.log('=====================================');
      console.log('📊 Backend API: http://localhost:5000');
      console.log('🌐 Frontend: http://localhost:3000');
      console.log('📋 Health Check: http://localhost:5000/health');
      console.log('📚 API Docs: http://localhost:5000/api-docs');
      console.log('\n💡 Press Ctrl+C to stop all servers');
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down HMIS system...');
        backendProcess.kill();
        frontendProcess.kill();
        process.exit(0);
      });
      
    }, 3000);
    
  } catch (error) {
    console.error('❌ Failed to start HMIS:', error.message);
    process.exit(1);
  }
}

// Start the system
startHMIS();

