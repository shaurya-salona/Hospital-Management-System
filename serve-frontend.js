#!/usr/bin/env node

/**
 * Simple Frontend Server
 * Serves the HMIS frontend files with proper routing
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const FRONTEND_DIR = path.join(__dirname, 'frontend');

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

function serveFile(res, filePath, mimeType) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 - File Not Found</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .error { color: #e74c3c; }
                        .back-link { margin-top: 20px; }
                        .back-link a { color: #3498db; text-decoration: none; }
                    </style>
                </head>
                <body>
                    <h1 class="error">404 - File Not Found</h1>
                    <p>The requested file could not be found.</p>
                    <div class="back-link">
                        <a href="/">← Back to Home</a>
                    </div>
                </body>
                </html>
            `);
            return;
        }

        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
    });
}

function handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Default to index.html for root
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // Remove leading slash and construct file path
    const filePath = path.join(FRONTEND_DIR, pathname);

    // Security check - prevent directory traversal
    if (!filePath.startsWith(FRONTEND_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<h1>403 - Forbidden</h1>');
        return;
    }

    // Check if file exists
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Try with .html extension for routes like /doctor-portal
            const htmlPath = filePath + '.html';
            fs.stat(htmlPath, (htmlErr, htmlStats) => {
                if (htmlErr || !htmlStats.isFile()) {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>404 - Page Not Found</title>
                            <style>
                                body {
                                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                    text-align: center;
                                    padding: 50px;
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                    color: white;
                                    min-height: 100vh;
                                    margin: 0;
                                    display: flex;
                                    flex-direction: column;
                                    justify-content: center;
                                    align-items: center;
                                }
                                .error-container {
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 40px;
                                    border-radius: 20px;
                                    backdrop-filter: blur(10px);
                                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                                }
                                .error { color: #ff6b6b; font-size: 3rem; margin-bottom: 20px; }
                                .message { font-size: 1.2rem; margin-bottom: 30px; opacity: 0.9; }
                                .back-link { margin-top: 20px; }
                                .back-link a {
                                    color: #4ecdc4;
                                    text-decoration: none;
                                    font-size: 1.1rem;
                                    padding: 12px 24px;
                                    border: 2px solid #4ecdc4;
                                    border-radius: 25px;
                                    transition: all 0.3s ease;
                                }
                                .back-link a:hover {
                                    background: #4ecdc4;
                                    color: white;
                                }
                                .available-pages {
                                    margin-top: 30px;
                                    text-align: left;
                                }
                                .available-pages h3 {
                                    color: #4ecdc4;
                                    margin-bottom: 15px;
                                }
                                .page-list {
                                    list-style: none;
                                    padding: 0;
                                }
                                .page-list li {
                                    margin: 8px 0;
                                }
                                .page-list a {
                                    color: #a8e6cf;
                                    text-decoration: none;
                                    padding: 5px 10px;
                                    border-radius: 5px;
                                    transition: background 0.3s ease;
                                }
                                .page-list a:hover {
                                    background: rgba(255, 255, 255, 0.1);
                                }
                            </style>
                        </head>
                        <body>
                            <div class="error-container">
                                <h1 class="error">404</h1>
                                <p class="message">The requested page could not be found.</p>
                                <div class="back-link">
                                    <a href="/">← Back to Home</a>
                                </div>
                                <div class="available-pages">
                                    <h3>Available Pages:</h3>
                                    <ul class="page-list">
                                        <li><a href="/doctor-login.html">Doctor Login</a></li>
                                        <li><a href="/doctor-dashboard.html">Doctor Dashboard</a></li>
                                        <li><a href="/admin-login.html">Admin Login</a></li>
                                        <li><a href="/admin-dashboard.html">Admin Dashboard</a></li>
                                        <li><a href="/nurse-login.html">Nurse Login</a></li>
                                        <li><a href="/nurse-dashboard.html">Nurse Dashboard</a></li>
                                        <li><a href="/patient-login.html">Patient Login</a></li>
                                        <li><a href="/patient-dashboard.html">Patient Dashboard</a></li>
                                        <li><a href="/receptionist-login.html">Receptionist Login</a></li>
                                        <li><a href="/receptionist-dashboard.html">Receptionist Dashboard</a></li>
                                        <li><a href="/pharmacist-login.html">Pharmacist Login</a></li>
                                        <li><a href="/pharmacist-dashboard.html">Pharmacist Dashboard</a></li>
                                    </ul>
                                </div>
                            </div>
                        </body>
                        </html>
                    `);
                } else {
                    const mimeType = getMimeType(htmlPath);
                    serveFile(res, htmlPath, mimeType);
                }
            });
        } else {
            const mimeType = getMimeType(filePath);
            serveFile(res, filePath, mimeType);
        }
    });
}

// Create server
const server = http.createServer(handleRequest);

// Start server
server.listen(PORT, () => {
    console.log('🚀 HMIS Frontend Server Started!');
    console.log('=====================================');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${FRONTEND_DIR}`);
    console.log('=====================================');
    console.log('🔗 Available Pages:');
    console.log('   • Home: http://localhost:3000/');
    console.log('   • Doctor Login: http://localhost:3000/doctor-login.html');
    console.log('   • Doctor Dashboard: http://localhost:3000/doctor-dashboard.html');
    console.log('   • Admin Login: http://localhost:3000/admin-login.html');
    console.log('   • Admin Dashboard: http://localhost:3000/admin-dashboard.html');
    console.log('   • Nurse Login: http://localhost:3000/nurse-login.html');
    console.log('   • Patient Login: http://localhost:3000/patient-login.html');
    console.log('   • Receptionist Login: http://localhost:3000/receptionist-login.html');
    console.log('   • Pharmacist Login: http://localhost:3000/pharmacist-login.html');
    console.log('=====================================');
    console.log('💡 Tip: Use Ctrl+C to stop the server');
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
    } else {
        console.error('❌ Server error:', err);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped successfully');
        process.exit(0);
    });
});
