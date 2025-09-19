#!/usr/bin/env node

/**
 * Simple Backend Server
 * Provides basic API endpoints for HMIS frontend
 */

const http = require('http');
const url = require('url');

const PORT = 5000;

// Mock data for testing
const mockData = {
    users: [
        { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'System Administrator' },
        { id: 2, username: 'doctor', password: 'doctor123', role: 'doctor', name: 'Dr. John Smith' },
        { id: 3, username: 'nurse', password: 'nurse123', role: 'nurse', name: 'Nurse Jane Doe' },
        { id: 4, username: 'patient', password: 'patient123', role: 'patient', name: 'Patient Bob Wilson' },
        { id: 5, username: 'receptionist', password: 'receptionist123', role: 'receptionist', name: 'Receptionist Alice Brown' },
        { id: 6, username: 'pharmacist', password: 'pharmacist123', role: 'pharmacist', name: 'Pharmacist Charlie Green' }
    ],
    patients: [
        { id: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '1234567890', dateOfBirth: '1990-01-01', gender: 'male' },
        { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', phone: '0987654321', dateOfBirth: '1985-05-15', gender: 'female' }
    ],
    appointments: [
        { id: 1, patientId: 1, doctorId: 2, date: '2024-12-25', time: '10:00', status: 'scheduled', reason: 'Regular checkup' },
        { id: 2, patientId: 2, doctorId: 2, date: '2024-12-26', time: '14:00', status: 'confirmed', reason: 'Follow-up visit' }
    ],
    labTests: [
        { id: 1, patientId: 1, doctorId: 2, testName: 'Complete Blood Count', testCode: 'CBC', status: 'ordered', orderedDate: '2024-12-19', results: null },
        { id: 2, patientId: 2, doctorId: 2, testName: 'Blood Glucose', testCode: 'GLU', status: 'completed', orderedDate: '2024-12-18', results: 'Normal (85 mg/dL)' }
    ],
    prescriptions: [
        { id: 1, patientId: 1, doctorId: 2, medication: 'Lisinopril 10mg', dosage: '1 tablet daily', instructions: 'Take with food', status: 'active', prescribedDate: '2024-12-19' },
        { id: 2, patientId: 2, doctorId: 2, medication: 'Metformin 500mg', dosage: '1 tablet twice daily', instructions: 'Take with meals', status: 'active', prescribedDate: '2024-12-18' }
    ],
    medicalRecords: [
        { id: 1, patientId: 1, doctorId: 2, diagnosis: 'Hypertension', symptoms: 'High blood pressure', treatment: 'Medication and lifestyle changes', date: '2024-12-19' },
        { id: 2, patientId: 2, doctorId: 2, diagnosis: 'Type 2 Diabetes', symptoms: 'Elevated blood sugar', treatment: 'Diet control and medication', date: '2024-12-18' }
    ],
    inventory: [
        { id: 1, name: 'Lisinopril 10mg', category: 'Medication', quantity: 500, unit: 'tablets', expiryDate: '2025-12-31', supplier: 'PharmaCorp' },
        { id: 2, name: 'Blood Glucose Test Strips', category: 'Lab Supplies', quantity: 1000, unit: 'strips', expiryDate: '2025-06-30', supplier: 'LabSupply Inc' }
    ]
};

function sendJSON(res, data, statusCode = 200) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
}

function sendError(res, message, statusCode = 400) {
    sendJSON(res, { success: false, message }, statusCode);
}

function handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Handle preflight requests
    if (method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end();
        return;
    }

    // Health check
    if (pathname === '/health') {
        sendJSON(res, {
            success: true,
            message: 'HMIS Backend Server is running',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
        return;
    }

    // API routes
    if (pathname.startsWith('/api/')) {
        const apiPath = pathname.replace('/api', '');

        // Authentication routes
        if (apiPath === '/auth/login' && method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const { username, password } = JSON.parse(body);
                    const user = mockData.users.find(u => u.username === username && u.password === password);

                    if (user) {
                        const token = 'mock-token-' + Date.now();
                        sendJSON(res, {
                            success: true,
                            data: {
                                token,
                                user: {
                                    id: user.id,
                                    username: user.username,
                                    role: user.role,
                                    name: user.name
                                }
                            }
                        });
                    } else {
                        sendError(res, 'Invalid credentials', 401);
                    }
                } catch (error) {
                    sendError(res, 'Invalid request data');
                }
            });
            return;
        }

        if (apiPath === '/auth/profile' && method === 'GET') {
            // Mock authenticated user
            sendJSON(res, {
                success: true,
                data: {
                    id: 2,
                    username: 'doctor',
                    role: 'doctor',
                    name: 'Dr. John Smith',
                    email: 'doctor@hospital.com'
                }
            });
            return;
        }

        if (apiPath === '/auth/logout' && method === 'POST') {
            sendJSON(res, { success: true, message: 'Logged out successfully' });
            return;
        }

        // Patients routes
        if (apiPath === '/patients' && method === 'GET') {
            const { page = 1, limit = 10, search } = parsedUrl.query;
            let patients = [...mockData.patients];

            if (search) {
                patients = patients.filter(p =>
                    p.firstName.toLowerCase().includes(search.toLowerCase()) ||
                    p.lastName.toLowerCase().includes(search.toLowerCase()) ||
                    p.email.toLowerCase().includes(search.toLowerCase())
                );
            }

            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedPatients = patients.slice(startIndex, endIndex);

            sendJSON(res, {
                success: true,
                data: {
                    patients: paginatedPatients,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: patients.length,
                        pages: Math.ceil(patients.length / limit)
                    }
                }
            });
            return;
        }

        if (apiPath.startsWith('/patients/') && method === 'GET') {
            const patientId = parseInt(apiPath.split('/')[2]);
            const patient = mockData.patients.find(p => p.id === patientId);

            if (patient) {
                sendJSON(res, { success: true, data: patient });
            } else {
                sendError(res, 'Patient not found', 404);
            }
            return;
        }

        // Appointments routes
        if (apiPath === '/appointments' && method === 'GET') {
            const { page = 1, limit = 10, status } = parsedUrl.query;
            let appointments = [...mockData.appointments];

            if (status) {
                appointments = appointments.filter(a => a.status === status);
            }

            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedAppointments = appointments.slice(startIndex, endIndex);

            sendJSON(res, {
                success: true,
                data: {
                    appointments: paginatedAppointments,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: appointments.length,
                        pages: Math.ceil(appointments.length / limit)
                    }
                }
            });
            return;
        }

        // Lab Tests routes
        if (apiPath === '/lab-tests' && method === 'GET') {
            const { page = 1, limit = 10, patientId, status } = parsedUrl.query;
            let labTests = [...mockData.labTests];

            if (patientId) {
                labTests = labTests.filter(lt => lt.patientId == patientId);
            }
            if (status) {
                labTests = labTests.filter(lt => lt.status === status);
            }

            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedTests = labTests.slice(startIndex, endIndex);

            sendJSON(res, {
                success: true,
                data: {
                    labTests: paginatedTests,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: labTests.length,
                        pages: Math.ceil(labTests.length / limit)
                    }
                }
            });
            return;
        }

        if (apiPath === '/lab-tests' && method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const labTestData = JSON.parse(body);
                    const newLabTest = {
                        id: mockData.labTests.length + 1,
                        ...labTestData,
                        status: 'ordered',
                        orderedDate: new Date().toISOString().split('T')[0],
                        results: null
                    };
                    mockData.labTests.push(newLabTest);

                    sendJSON(res, {
                        success: true,
                        data: newLabTest,
                        message: 'Lab test ordered successfully'
                    }, 201);
                } catch (error) {
                    sendError(res, 'Invalid request data');
                }
            });
            return;
        }

        if (apiPath.startsWith('/lab-tests/') && method === 'PUT') {
            const testId = parseInt(apiPath.split('/')[2]);
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const updateData = JSON.parse(body);
                    const testIndex = mockData.labTests.findIndex(lt => lt.id === testId);

                    if (testIndex !== -1) {
                        mockData.labTests[testIndex] = { ...mockData.labTests[testIndex], ...updateData };
                        sendJSON(res, {
                            success: true,
                            data: mockData.labTests[testIndex],
                            message: 'Lab test updated successfully'
                        });
                    } else {
                        sendError(res, 'Lab test not found', 404);
                    }
                } catch (error) {
                    sendError(res, 'Invalid request data');
                }
            });
            return;
        }

        // Prescriptions routes
        if (apiPath === '/prescriptions' && method === 'GET') {
            const { page = 1, limit = 10, patientId, status } = parsedUrl.query;
            let prescriptions = [...mockData.prescriptions];

            if (patientId) {
                prescriptions = prescriptions.filter(p => p.patientId == patientId);
            }
            if (status) {
                prescriptions = prescriptions.filter(p => p.status === status);
            }

            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedPrescriptions = prescriptions.slice(startIndex, endIndex);

            sendJSON(res, {
                success: true,
                data: {
                    prescriptions: paginatedPrescriptions,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: prescriptions.length,
                        pages: Math.ceil(prescriptions.length / limit)
                    }
                }
            });
            return;
        }

        if (apiPath === '/prescriptions' && method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const prescriptionData = JSON.parse(body);
                    const newPrescription = {
                        id: mockData.prescriptions.length + 1,
                        ...prescriptionData,
                        status: 'active',
                        prescribedDate: new Date().toISOString().split('T')[0]
                    };
                    mockData.prescriptions.push(newPrescription);

                    sendJSON(res, {
                        success: true,
                        data: newPrescription,
                        message: 'Prescription created successfully'
                    }, 201);
                } catch (error) {
                    sendError(res, 'Invalid request data');
                }
            });
            return;
        }

        // Medical Records routes
        if (apiPath === '/medical/records' && method === 'GET') {
            const { page = 1, limit = 10, patientId } = parsedUrl.query;
            let records = [...mockData.medicalRecords];

            if (patientId) {
                records = records.filter(r => r.patientId == patientId);
            }

            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedRecords = records.slice(startIndex, endIndex);

            sendJSON(res, {
                success: true,
                data: {
                    records: paginatedRecords,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: records.length,
                        pages: Math.ceil(records.length / limit)
                    }
                }
            });
            return;
        }

        if (apiPath === '/medical/records' && method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const recordData = JSON.parse(body);
                    const newRecord = {
                        id: mockData.medicalRecords.length + 1,
                        ...recordData,
                        date: new Date().toISOString().split('T')[0]
                    };
                    mockData.medicalRecords.push(newRecord);

                    sendJSON(res, {
                        success: true,
                        data: newRecord,
                        message: 'Medical record created successfully'
                    }, 201);
                } catch (error) {
                    sendError(res, 'Invalid request data');
                }
            });
            return;
        }

        // Inventory routes
        if (apiPath === '/inventory' && method === 'GET') {
            const { page = 1, limit = 10, category, search } = parsedUrl.query;
            let inventory = [...mockData.inventory];

            if (category) {
                inventory = inventory.filter(item => item.category === category);
            }
            if (search) {
                inventory = inventory.filter(item =>
                    item.name.toLowerCase().includes(search.toLowerCase())
                );
            }

            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedInventory = inventory.slice(startIndex, endIndex);

            sendJSON(res, {
                success: true,
                data: {
                    items: paginatedInventory,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: inventory.length,
                        pages: Math.ceil(inventory.length / limit)
                    }
                }
            });
            return;
        }

        // Analytics routes
        if (apiPath === '/analytics/dashboard' && method === 'GET') {
            sendJSON(res, {
                success: true,
                data: {
                    stats: {
                        totalPatients: mockData.patients.length,
                        totalAppointments: mockData.appointments.length,
                        totalLabTests: mockData.labTests.length,
                        totalPrescriptions: mockData.prescriptions.length,
                        todayAppointments: 3,
                        pendingAppointments: 1,
                        pendingLabTests: mockData.labTests.filter(lt => lt.status === 'ordered').length
                    }
                }
            });
            return;
        }

        // Default API response
        sendError(res, 'API endpoint not found', 404);
        return;
    }

    // Default response
    sendJSON(res, {
        success: true,
        message: 'HMIS Backend Server',
        endpoints: [
            'GET /health - Health check',
            'POST /api/auth/login - User login',
            'GET /api/auth/profile - Get user profile',
            'POST /api/auth/logout - User logout',
            'GET /api/patients - Get patients list',
            'GET /api/patients/:id - Get patient by ID',
            'GET /api/appointments - Get appointments list',
            'GET /api/lab-tests - Get lab tests list',
            'POST /api/lab-tests - Order lab test',
            'PUT /api/lab-tests/:id - Update lab test',
            'GET /api/prescriptions - Get prescriptions list',
            'POST /api/prescriptions - Create prescription',
            'GET /api/medical/records - Get medical records',
            'POST /api/medical/records - Create medical record',
            'GET /api/inventory - Get inventory list',
            'GET /api/analytics/dashboard - Get dashboard analytics'
        ]
    });
}

// Create server
const server = http.createServer(handleRequest);

// Start server
server.listen(PORT, () => {
    console.log('🚀 HMIS Backend Server Started!');
    console.log('=====================================');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log('=====================================');
    console.log('🔑 Test Credentials:');
    console.log('   • Admin: admin / admin123');
    console.log('   • Doctor: doctor / doctor123');
    console.log('   • Nurse: nurse / nurse123');
    console.log('   • Patient: patient / patient123');
    console.log('   • Receptionist: receptionist / receptionist123');
    console.log('   • Pharmacist: pharmacist / pharmacist123');
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
