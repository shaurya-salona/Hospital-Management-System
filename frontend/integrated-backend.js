const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'hmis-secret-key-2024';

// Demo Database (in-memory for now, can be replaced with PostgreSQL)
const demoDatabase = {
    users: [
        {
            id: '1',
            username: 'admin',
            email: 'admin@hospital.com',
            password: 'admin123', // Plain text for demo
            role: 'admin',
            first_name: 'System',
            last_name: 'Administrator',
            phone: '+1-555-0001',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: '2',
            username: 'doctor',
            email: 'doctor@hospital.com',
            password: 'doctor123', // Plain text for demo
            role: 'doctor',
            first_name: 'Dr. John',
            last_name: 'Smith',
            phone: '+1-555-0002',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: '3',
            username: 'nurse',
            email: 'nurse@hospital.com',
            password: 'nurse123', // Plain text for demo
            role: 'nurse',
            first_name: 'Jane',
            last_name: 'Doe',
            phone: '+1-555-0003',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: '4',
            username: 'receptionist',
            email: 'receptionist@hospital.com',
            password: 'receptionist123', // Plain text for demo
            role: 'receptionist',
            first_name: 'Alice',
            last_name: 'Brown',
            phone: '+1-555-0004',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: '5',
            username: 'pharmacist',
            email: 'pharmacist@hospital.com',
            password: 'pharmacist123', // Plain text for demo
            role: 'pharmacist',
            first_name: 'Charlie',
            last_name: 'Green',
            phone: '+1-555-0005',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: '6',
            username: 'patient',
            email: 'patient@hospital.com',
            password: 'patient123', // Plain text for demo
            role: 'patient',
            first_name: 'Bob',
            last_name: 'Wilson',
            phone: '+1-555-0006',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ],
    patients: [
        {
            id: '1',
            user_id: '6',
            patient_id: 'P001',
            date_of_birth: '1990-01-01',
            gender: 'male',
            address: '123 Main St, City, State 12345',
            emergency_contact_name: 'Jane Wilson',
            emergency_contact_phone: '+1-555-0007',
            blood_type: 'A+',
            allergies: 'Penicillin',
            medical_history: 'Hypertension',
            insurance_provider: 'HealthPlus',
            insurance_number: 'HP123456789',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: '2',
            user_id: null,
            patient_id: 'P002',
            date_of_birth: '1985-05-15',
            gender: 'female',
            address: '456 Oak Ave, City, State 12345',
            emergency_contact_name: 'John Smith',
            emergency_contact_phone: '+1-555-0008',
            blood_type: 'B-',
            allergies: 'None',
            medical_history: 'Diabetes Type 2',
            insurance_provider: 'MediCare',
            insurance_number: 'MC987654321',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ],
    appointments: [
        {
            id: '1',
            patient_id: '1',
            doctor_id: '2',
            appointment_date: '2024-12-25',
            appointment_time: '10:00',
            reason: 'Regular checkup',
            status: 'scheduled',
            notes: 'Annual physical examination',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: '2',
            patient_id: '2',
            doctor_id: '2',
            appointment_date: '2024-12-26',
            appointment_time: '14:00',
            reason: 'Follow-up visit',
            status: 'confirmed',
            notes: 'Diabetes management follow-up',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ],
    labTests: [
        {
            id: '1',
            patient_id: '1',
            doctor_id: '2',
            test_name: 'Complete Blood Count',
            test_code: 'CBC',
            status: 'ordered',
            priority: 'routine',
            ordered_date: '2024-12-19',
            results: null,
            notes: 'Routine checkup',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: '2',
            patient_id: '2',
            doctor_id: '2',
            test_name: 'Blood Glucose',
            test_code: 'GLU',
            status: 'completed',
            priority: 'routine',
            ordered_date: '2024-12-18',
            results: 'Normal (85 mg/dL)',
            notes: 'Diabetes monitoring',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ],
    prescriptions: [
        {
            id: '1',
            patient_id: '1',
            doctor_id: '2',
            medication: 'Lisinopril 10mg',
            dosage: '1 tablet daily',
            instructions: 'Take with food',
            status: 'active',
            prescribed_date: '2024-12-19',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: '2',
            patient_id: '2',
            doctor_id: '2',
            medication: 'Metformin 500mg',
            dosage: '1 tablet twice daily',
            instructions: 'Take with meals',
            status: 'active',
            prescribed_date: '2024-12-18',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ],
    medicalRecords: [
        {
            id: '1',
            patient_id: '1',
            doctor_id: '2',
            diagnosis: 'Hypertension',
            symptoms: 'High blood pressure',
            treatment: 'Medication and lifestyle changes',
            notes: 'Patient responding well to treatment',
            date: '2024-12-19',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: '2',
            patient_id: '2',
            doctor_id: '2',
            diagnosis: 'Type 2 Diabetes',
            symptoms: 'Elevated blood sugar',
            treatment: 'Diet control and medication',
            notes: 'Blood sugar levels improving',
            date: '2024-12-18',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ],
    billing: [
        {
            id: '1',
            patient_id: '1',
            bill_number: 'B001',
            amount: 150.00,
            status: 'paid',
            due_date: '2024-12-15',
            services: ['Consultation', 'Lab Test'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: '2',
            patient_id: '2',
            bill_number: 'B002',
            amount: 275.50,
            status: 'pending',
            due_date: '2024-12-25',
            services: ['Consultation', 'Prescription'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ],
    inventory: [
        {
            id: '1',
            name: 'Lisinopril 10mg',
            category: 'medication',
            quantity: 500,
            unit_price: 2.50,
            min_stock: 50,
            expiry_date: '2025-12-31',
            supplier: 'PharmaCorp',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: '2',
            name: 'Blood Glucose Test Strips',
            category: 'lab_supplies',
            quantity: 1000,
            unit_price: 0.50,
            min_stock: 100,
            expiry_date: '2025-06-30',
            supplier: 'LabSupply Inc',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ]
};

// Helper functions
const generateId = () => uuidv4();
const hashPassword = async (password) => await bcrypt.hash(password, 10);
const comparePassword = async (password, hash) => await bcrypt.compare(password, hash);

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Response helpers
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

const sendError = (res, message = 'Error', statusCode = 400) => {
    res.status(statusCode).json({
        success: false,
        message
    });
};

// Routes

// Health check
app.get('/health', (req, res) => {
    sendSuccess(res, { status: 'healthy', timestamp: new Date().toISOString() });
});

// Admin Dashboard Endpoints
app.get('/api/users', authenticateToken, (req, res) => {
    try {
        const users = demoDatabase.users.map(user => ({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
            last_login: user.last_login || 'Never',
            created_at: user.created_at
        }));

        sendSuccess(res, { users }, 'Users retrieved successfully');
    } catch (error) {
        sendError(res, 'Failed to retrieve users', 500);
    }
});

app.post('/api/users', authenticateToken, (req, res) => {
    try {
        const { first_name, last_name, email, role, password } = req.body;

        // Check if user already exists
        const existingUser = demoDatabase.users.find(u => u.email === email);
        if (existingUser) {
            return sendError(res, 'User with this email already exists', 400);
        }

        const newUser = {
            id: (demoDatabase.users.length + 1).toString(),
            username: email.split('@')[0],
            email,
            password: password || 'default123',
            role,
            first_name,
            last_name,
            phone: '',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        demoDatabase.users.push(newUser);

        sendSuccess(res, { user: newUser }, 'User created successfully');
    } catch (error) {
        sendError(res, 'Failed to create user', 500);
    }
});

app.put('/api/users/:id', authenticateToken, (req, res) => {
    try {
        const userId = req.params.id;
        const { first_name, last_name, email, role, is_active } = req.body;

        const userIndex = demoDatabase.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return sendError(res, 'User not found', 404);
        }

        demoDatabase.users[userIndex] = {
            ...demoDatabase.users[userIndex],
            first_name,
            last_name,
            email,
            role,
            is_active,
            updated_at: new Date().toISOString()
        };

        sendSuccess(res, { user: demoDatabase.users[userIndex] }, 'User updated successfully');
    } catch (error) {
        sendError(res, 'Failed to update user', 500);
    }
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
    try {
        const userId = req.params.id;

        const userIndex = demoDatabase.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return sendError(res, 'User not found', 404);
        }

        demoDatabase.users.splice(userIndex, 1);

        sendSuccess(res, {}, 'User deleted successfully');
    } catch (error) {
        sendError(res, 'Failed to delete user', 500);
    }
});

app.get('/api/admin/dashboard', authenticateToken, (req, res) => {
    try {
        const stats = {
            totalUsers: demoDatabase.users.length,
            activeUsers: demoDatabase.users.filter(u => u.is_active).length,
            totalPatients: demoDatabase.patients.length,
            activePatients: demoDatabase.patients.filter(p => p.is_active).length,
            totalAppointments: demoDatabase.appointments.length,
            pendingAppointments: demoDatabase.appointments.filter(a => a.status === 'pending').length,
            systemUptime: '99.9%',
            storageUsed: '45%'
        };

        sendSuccess(res, { stats }, 'Dashboard stats retrieved successfully');
    } catch (error) {
        sendError(res, 'Failed to retrieve dashboard stats', 500);
    }
});

app.get('/api/admin/system-health', authenticateToken, (req, res) => {
    try {
        const health = {
            cpuUsage: Math.floor(Math.random() * 30) + 30,
            memoryUsage: Math.floor(Math.random() * 20) + 50,
            diskUsage: Math.floor(Math.random() * 15) + 30,
            networkStatus: 'Online',
            uptime: '99.9%',
            lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        };

        sendSuccess(res, { health }, 'System health retrieved successfully');
    } catch (error) {
        sendError(res, 'Failed to retrieve system health', 500);
    }
});

app.get('/api/admin/security-events', authenticateToken, (req, res) => {
    try {
        const events = [
            {
                id: 1,
                time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                event: 'Failed Login Attempt',
                user: 'unknown',
                ip: '192.168.1.100',
                status: 'Blocked'
            },
            {
                id: 2,
                time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                event: 'Successful Login',
                user: 'admin',
                ip: '192.168.1.50',
                status: 'Success'
            }
        ];

        sendSuccess(res, { events }, 'Security events retrieved successfully');
    } catch (error) {
        sendError(res, 'Failed to retrieve security events', 500);
    }
});

app.post('/api/admin/backup', authenticateToken, (req, res) => {
    try {
        const backup = {
            id: Date.now(),
            date: new Date().toISOString(),
            type: 'Full Backup',
            size: '2.3 GB',
            status: 'Success'
        };

        sendSuccess(res, { backup }, 'Backup created successfully');
    } catch (error) {
        sendError(res, 'Failed to create backup', 500);
    }
});

app.get('/api/admin/backup-history', authenticateToken, (req, res) => {
    try {
        const history = [
            {
                id: 1,
                date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                type: 'Full Backup',
                size: '2.3 GB',
                status: 'Success'
            },
            {
                id: 2,
                date: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
                type: 'Incremental',
                size: '150 MB',
                status: 'Success'
            }
        ];

        sendSuccess(res, { history }, 'Backup history retrieved successfully');
    } catch (error) {
        sendError(res, 'Failed to retrieve backup history', 500);
    }
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return sendError(res, 'Username and password are required', 400);
        }

        const user = demoDatabase.users.find(u => u.username === username && u.is_active);
        if (!user) {
            return sendError(res, 'Invalid credentials', 401);
        }

        const isValidPassword = (password === user.password);
        if (!isValidPassword) {
            return sendError(res, 'Invalid credentials', 401);
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone
        };

        sendSuccess(res, { token, user: userData }, 'Login successful');
    } catch (error) {
        console.error('Login error:', error);
        sendError(res, 'Internal server error', 500);
    }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
    const user = demoDatabase.users.find(u => u.id === req.user.id);
    if (!user) {
        return sendError(res, 'User not found', 404);
    }

    const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        is_active: user.is_active
    };

    sendSuccess(res, userData);
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
    sendSuccess(res, null, 'Logout successful');
});

// Patients routes
app.get('/api/patients', authenticateToken, (req, res) => {
    const { page = 1, limit = 10, search, status } = req.query;
    let patients = [...demoDatabase.patients];

    // Apply filters
    if (search) {
        patients = patients.filter(p =>
            p.patient_id.toLowerCase().includes(search.toLowerCase()) ||
            demoDatabase.users.find(u => u.id === p.user_id)?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
            demoDatabase.users.find(u => u.id === p.user_id)?.last_name?.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPatients = patients.slice(startIndex, endIndex);

    // Add user data to patients
    const patientsWithUserData = paginatedPatients.map(patient => {
        const user = demoDatabase.users.find(u => u.id === patient.user_id);
        return {
            ...patient,
            first_name: user?.first_name || 'N/A',
            last_name: user?.last_name || 'N/A',
            email: user?.email || 'N/A',
            phone: user?.phone || patient.emergency_contact_phone
        };
    });

    sendSuccess(res, {
        patients: patientsWithUserData,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: patients.length,
            pages: Math.ceil(patients.length / limit)
        }
    });
});

app.get('/api/patients/:id', authenticateToken, (req, res) => {
    const patient = demoDatabase.patients.find(p => p.id === req.params.id);
    if (!patient) {
        return sendError(res, 'Patient not found', 404);
    }

    const user = demoDatabase.users.find(u => u.id === patient.user_id);
    const patientData = {
        ...patient,
        first_name: user?.first_name || 'N/A',
        last_name: user?.last_name || 'N/A',
        email: user?.email || 'N/A',
        phone: user?.phone || patient.emergency_contact_phone
    };

    sendSuccess(res, patientData);
});

app.post('/api/patients', authenticateToken, (req, res) => {
    const patientData = {
        id: generateId(),
        ...req.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    demoDatabase.patients.push(patientData);
    sendSuccess(res, patientData, 'Patient created successfully', 201);
});

app.put('/api/patients/:id', authenticateToken, (req, res) => {
    const patientIndex = demoDatabase.patients.findIndex(p => p.id === req.params.id);
    if (patientIndex === -1) {
        return sendError(res, 'Patient not found', 404);
    }

    demoDatabase.patients[patientIndex] = {
        ...demoDatabase.patients[patientIndex],
        ...req.body,
        updated_at: new Date().toISOString()
    };

    sendSuccess(res, demoDatabase.patients[patientIndex], 'Patient updated successfully');
});

app.delete('/api/patients/:id', authenticateToken, (req, res) => {
    const patientIndex = demoDatabase.patients.findIndex(p => p.id === req.params.id);
    if (patientIndex === -1) {
        return sendError(res, 'Patient not found', 404);
    }

    demoDatabase.patients.splice(patientIndex, 1);
    sendSuccess(res, null, 'Patient deleted successfully');
});

app.get('/api/patients/stats', authenticateToken, (req, res) => {
    const stats = {
        total: demoDatabase.patients.length,
        active: demoDatabase.patients.length, // All are active in demo
        new_this_month: 2,
        gender_distribution: {
            male: demoDatabase.patients.filter(p => p.gender === 'male').length,
            female: demoDatabase.patients.filter(p => p.gender === 'female').length,
            other: demoDatabase.patients.filter(p => p.gender === 'other').length
        }
    };

    sendSuccess(res, stats);
});

app.get('/api/patients/search', authenticateToken, (req, res) => {
    const { q } = req.query;
    if (!q) {
        return sendError(res, 'Search query is required', 400);
    }

    const patients = demoDatabase.patients.filter(p =>
        p.patient_id.toLowerCase().includes(q.toLowerCase()) ||
        demoDatabase.users.find(u => u.id === p.user_id)?.first_name?.toLowerCase().includes(q.toLowerCase()) ||
        demoDatabase.users.find(u => u.id === p.user_id)?.last_name?.toLowerCase().includes(q.toLowerCase())
    );

    const patientsWithUserData = patients.map(patient => {
        const user = demoDatabase.users.find(u => u.id === patient.user_id);
        return {
            ...patient,
            first_name: user?.first_name || 'N/A',
            last_name: user?.last_name || 'N/A',
            email: user?.email || 'N/A'
        };
    });

    sendSuccess(res, { patients: patientsWithUserData });
});

// Appointments routes
app.get('/api/appointments', authenticateToken, (req, res) => {
    const { page = 1, limit = 10, patient_id, doctor_id, status, date } = req.query;
    let appointments = [...demoDatabase.appointments];

    // Apply filters
    if (patient_id) appointments = appointments.filter(a => a.patient_id === patient_id);
    if (doctor_id) appointments = appointments.filter(a => a.doctor_id === doctor_id);
    if (status) appointments = appointments.filter(a => a.status === status);
    if (date) appointments = appointments.filter(a => a.appointment_date === date);

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedAppointments = appointments.slice(startIndex, endIndex);

    // Add patient and doctor names
    const appointmentsWithNames = paginatedAppointments.map(appointment => {
        const patient = demoDatabase.patients.find(p => p.id === appointment.patient_id);
        const doctor = demoDatabase.users.find(u => u.id === appointment.doctor_id);
        const patientUser = demoDatabase.users.find(u => u.id === patient?.user_id);

        return {
            ...appointment,
            patient_name: patientUser ? `${patientUser.first_name} ${patientUser.last_name}` : 'Unknown Patient',
            doctor_name: doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor',
            patient_id_display: patient?.patient_id || 'N/A'
        };
    });

    sendSuccess(res, {
        appointments: appointmentsWithNames,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: appointments.length,
            pages: Math.ceil(appointments.length / limit)
        }
    });
});

app.get('/api/appointments/:id', authenticateToken, (req, res) => {
    const appointment = demoDatabase.appointments.find(a => a.id === req.params.id);
    if (!appointment) {
        return sendError(res, 'Appointment not found', 404);
    }

    const patient = demoDatabase.patients.find(p => p.id === appointment.patient_id);
    const doctor = demoDatabase.users.find(u => u.id === appointment.doctor_id);
    const patientUser = demoDatabase.users.find(u => u.id === patient?.user_id);

    const appointmentData = {
        ...appointment,
        patient_name: patientUser ? `${patientUser.first_name} ${patientUser.last_name}` : 'Unknown Patient',
        doctor_name: doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor',
        patient_id_display: patient?.patient_id || 'N/A'
    };

    sendSuccess(res, appointmentData);
});

app.post('/api/appointments', authenticateToken, (req, res) => {
    const appointmentData = {
        id: generateId(),
        ...req.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    demoDatabase.appointments.push(appointmentData);
    sendSuccess(res, appointmentData, 'Appointment created successfully', 201);
});

app.put('/api/appointments/:id', authenticateToken, (req, res) => {
    const appointmentIndex = demoDatabase.appointments.findIndex(a => a.id === req.params.id);
    if (appointmentIndex === -1) {
        return sendError(res, 'Appointment not found', 404);
    }

    demoDatabase.appointments[appointmentIndex] = {
        ...demoDatabase.appointments[appointmentIndex],
        ...req.body,
        updated_at: new Date().toISOString()
    };

    sendSuccess(res, demoDatabase.appointments[appointmentIndex], 'Appointment updated successfully');
});

app.delete('/api/appointments/:id', authenticateToken, (req, res) => {
    const appointmentIndex = demoDatabase.appointments.findIndex(a => a.id === req.params.id);
    if (appointmentIndex === -1) {
        return sendError(res, 'Appointment not found', 404);
    }

    demoDatabase.appointments.splice(appointmentIndex, 1);
    sendSuccess(res, null, 'Appointment deleted successfully');
});

// Doctors routes
app.get('/api/doctors/availability', authenticateToken, (req, res) => {
    const doctors = demoDatabase.users.filter(u => u.role === 'doctor' && u.is_active);
    const doctorsWithAvailability = doctors.map(doctor => ({
        id: doctor.id,
        first_name: doctor.first_name,
        last_name: doctor.last_name,
        email: doctor.email,
        phone: doctor.phone,
        specialization: 'General Medicine', // Mock data
        availability: {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '17:00' },
            saturday: { start: '10:00', end: '14:00' },
            sunday: 'closed'
        }
    }));

    sendSuccess(res, { doctors: doctorsWithAvailability });
});

app.get('/api/doctors/availability/:id', authenticateToken, (req, res) => {
    const doctor = demoDatabase.users.find(u => u.id === req.params.id && u.role === 'doctor');
    if (!doctor) {
        return sendError(res, 'Doctor not found', 404);
    }

    const doctorData = {
        id: doctor.id,
        first_name: doctor.first_name,
        last_name: doctor.last_name,
        email: doctor.email,
        phone: doctor.phone,
        specialization: 'General Medicine',
        availability: {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '17:00' },
            saturday: { start: '10:00', end: '14:00' },
            sunday: 'closed'
        }
    };

    sendSuccess(res, doctorData);
});

app.put('/api/doctors/availability/:id', authenticateToken, (req, res) => {
    const doctor = demoDatabase.users.find(u => u.id === req.params.id && u.role === 'doctor');
    if (!doctor) {
        return sendError(res, 'Doctor not found', 404);
    }

    // In a real app, you'd update the doctor's availability
    sendSuccess(res, { message: 'Availability updated successfully' });
});

app.get('/api/doctors/schedule/:id', authenticateToken, (req, res) => {
    const { date } = req.query;
    const doctor = demoDatabase.users.find(u => u.id === req.params.id && u.role === 'doctor');
    if (!doctor) {
        return sendError(res, 'Doctor not found', 404);
    }

    // Get appointments for this doctor on the specified date
    const appointments = demoDatabase.appointments.filter(a =>
        a.doctor_id === req.params.id &&
        (!date || a.appointment_date === date)
    );

    const schedule = appointments.map(appointment => {
        const patient = demoDatabase.patients.find(p => p.id === appointment.patient_id);
        const patientUser = demoDatabase.users.find(u => u.id === patient?.user_id);

        return {
            id: appointment.id,
            time: appointment.appointment_time,
            patient_name: patientUser ? `${patientUser.first_name} ${patientUser.last_name}` : 'Unknown Patient',
            reason: appointment.reason,
            status: appointment.status
        };
    });

    sendSuccess(res, { schedule });
});

// Medical Records routes
app.get('/api/medical/records', authenticateToken, (req, res) => {
    const { page = 1, limit = 10, patient_id } = req.query;
    let records = [...demoDatabase.medicalRecords];

    if (patient_id) {
        records = records.filter(r => r.patient_id === patient_id);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRecords = records.slice(startIndex, endIndex);

    const recordsWithNames = paginatedRecords.map(record => {
        const patient = demoDatabase.patients.find(p => p.id === record.patient_id);
        const doctor = demoDatabase.users.find(u => u.id === record.doctor_id);
        const patientUser = demoDatabase.users.find(u => u.id === patient?.user_id);

        return {
            ...record,
            patient_name: patientUser ? `${patientUser.first_name} ${patientUser.last_name}` : 'Unknown Patient',
            doctor_name: doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor'
        };
    });

    sendSuccess(res, {
        records: recordsWithNames,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: records.length,
            pages: Math.ceil(records.length / limit)
        }
    });
});

app.post('/api/medical/records', authenticateToken, (req, res) => {
    const recordData = {
        id: generateId(),
        ...req.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    demoDatabase.medicalRecords.push(recordData);
    sendSuccess(res, recordData, 'Medical record created successfully', 201);
});

app.put('/api/medical/records/:id', authenticateToken, (req, res) => {
    const recordIndex = demoDatabase.medicalRecords.findIndex(r => r.id === req.params.id);
    if (recordIndex === -1) {
        return sendError(res, 'Medical record not found', 404);
    }

    demoDatabase.medicalRecords[recordIndex] = {
        ...demoDatabase.medicalRecords[recordIndex],
        ...req.body,
        updated_at: new Date().toISOString()
    };

    sendSuccess(res, demoDatabase.medicalRecords[recordIndex], 'Medical record updated successfully');
});

// Prescriptions routes
app.get('/api/medical/prescriptions', authenticateToken, (req, res) => {
    const { page = 1, limit = 10, patient_id, status } = req.query;
    let prescriptions = [...demoDatabase.prescriptions];

    if (patient_id) prescriptions = prescriptions.filter(p => p.patient_id === patient_id);
    if (status) prescriptions = prescriptions.filter(p => p.status === status);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPrescriptions = prescriptions.slice(startIndex, endIndex);

    const prescriptionsWithNames = paginatedPrescriptions.map(prescription => {
        const patient = demoDatabase.patients.find(p => p.id === prescription.patient_id);
        const doctor = demoDatabase.users.find(u => u.id === prescription.doctor_id);
        const patientUser = demoDatabase.users.find(u => u.id === patient?.user_id);

        return {
            ...prescription,
            patient_name: patientUser ? `${patientUser.first_name} ${patientUser.last_name}` : 'Unknown Patient',
            doctor_name: doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor'
        };
    });

    sendSuccess(res, {
        prescriptions: prescriptionsWithNames,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: prescriptions.length,
            pages: Math.ceil(prescriptions.length / limit)
        }
    });
});

app.post('/api/medical/prescriptions', authenticateToken, (req, res) => {
    const prescriptionData = {
        id: generateId(),
        ...req.body,
        status: 'active',
        prescribed_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    demoDatabase.prescriptions.push(prescriptionData);
    sendSuccess(res, prescriptionData, 'Prescription created successfully', 201);
});

app.put('/api/medical/prescriptions/:id', authenticateToken, (req, res) => {
    const prescriptionIndex = demoDatabase.prescriptions.findIndex(p => p.id === req.params.id);
    if (prescriptionIndex === -1) {
        return sendError(res, 'Prescription not found', 404);
    }

    demoDatabase.prescriptions[prescriptionIndex] = {
        ...demoDatabase.prescriptions[prescriptionIndex],
        ...req.body,
        updated_at: new Date().toISOString()
    };

    sendSuccess(res, demoDatabase.prescriptions[prescriptionIndex], 'Prescription updated successfully');
});

// Lab Tests routes (matching frontend expectations)
app.get('/api/lab/tests', authenticateToken, (req, res) => {
    const { page = 1, limit = 10, patient_id, status } = req.query;
    let labTests = [...demoDatabase.labTests];

    if (patient_id) labTests = labTests.filter(lt => lt.patient_id === patient_id);
    if (status) labTests = labTests.filter(lt => lt.status === status);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTests = labTests.slice(startIndex, endIndex);

    const testsWithNames = paginatedTests.map(test => {
        const patient = demoDatabase.patients.find(p => p.id === test.patient_id);
        const doctor = demoDatabase.users.find(u => u.id === test.doctor_id);
        const patientUser = demoDatabase.users.find(u => u.id === patient?.user_id);

        return {
            ...test,
            patient_name: patientUser ? `${patientUser.first_name} ${patientUser.last_name}` : 'Unknown Patient',
            doctor_name: doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor'
        };
    });

    sendSuccess(res, {
        labTests: testsWithNames,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: labTests.length,
            pages: Math.ceil(labTests.length / limit)
        }
    });
});

app.post('/api/lab/tests', authenticateToken, (req, res) => {
    const testData = {
        id: generateId(),
        ...req.body,
        status: 'ordered',
        ordered_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    demoDatabase.labTests.push(testData);
    sendSuccess(res, testData, 'Lab test ordered successfully', 201);
});

app.put('/api/lab/tests/:id', authenticateToken, (req, res) => {
    const testIndex = demoDatabase.labTests.findIndex(lt => lt.id === req.params.id);
    if (testIndex === -1) {
        return sendError(res, 'Lab test not found', 404);
    }

    demoDatabase.labTests[testIndex] = {
        ...demoDatabase.labTests[testIndex],
        ...req.body,
        updated_at: new Date().toISOString()
    };

    sendSuccess(res, demoDatabase.labTests[testIndex], 'Lab test updated successfully');
});

// Billing routes
app.get('/api/billing', authenticateToken, (req, res) => {
    const { page = 1, limit = 10, patient_id, status } = req.query;
    let billing = [...demoDatabase.billing];

    if (patient_id) billing = billing.filter(b => b.patient_id === patient_id);
    if (status) billing = billing.filter(b => b.status === status);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedBilling = billing.slice(startIndex, endIndex);

    const billingWithNames = paginatedBilling.map(bill => {
        const patient = demoDatabase.patients.find(p => p.id === bill.patient_id);
        const patientUser = demoDatabase.users.find(u => u.id === patient?.user_id);

        return {
            ...bill,
            patient_name: patientUser ? `${patientUser.first_name} ${patientUser.last_name}` : 'Unknown Patient'
        };
    });

    sendSuccess(res, {
        billing: billingWithNames,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: billing.length,
            pages: Math.ceil(billing.length / limit)
        }
    });
});

app.post('/api/billing', authenticateToken, (req, res) => {
    const billData = {
        id: generateId(),
        ...req.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    demoDatabase.billing.push(billData);
    sendSuccess(res, billData, 'Bill created successfully', 201);
});

app.put('/api/billing/:id', authenticateToken, (req, res) => {
    const billIndex = demoDatabase.billing.findIndex(b => b.id === req.params.id);
    if (billIndex === -1) {
        return sendError(res, 'Bill not found', 404);
    }

    demoDatabase.billing[billIndex] = {
        ...demoDatabase.billing[billIndex],
        ...req.body,
        updated_at: new Date().toISOString()
    };

    sendSuccess(res, demoDatabase.billing[billIndex], 'Bill updated successfully');
});

// Notifications routes
app.get('/api/notifications', authenticateToken, (req, res) => {
    const notifications = [
        {
            id: '1',
            title: 'New Appointment',
            message: 'You have a new appointment scheduled for tomorrow',
            type: 'info',
            is_read: false,
            created_at: new Date().toISOString()
        },
        {
            id: '2',
            title: 'Lab Results Ready',
            message: 'Lab test results for Patient P001 are ready',
            type: 'success',
            is_read: false,
            created_at: new Date().toISOString()
        }
    ];

    sendSuccess(res, { notifications });
});

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
    sendSuccess(res, { message: 'Notification marked as read' });
});

// Analytics routes
app.get('/api/analytics/dashboard', authenticateToken, (req, res) => {
    const stats = {
        total_patients: demoDatabase.patients.length,
        total_appointments: demoDatabase.appointments.length,
        total_lab_tests: demoDatabase.labTests.length,
        total_prescriptions: demoDatabase.prescriptions.length,
        today_appointments: demoDatabase.appointments.filter(a => a.appointment_date === new Date().toISOString().split('T')[0]).length,
        pending_appointments: demoDatabase.appointments.filter(a => a.status === 'scheduled').length,
        pending_lab_tests: demoDatabase.labTests.filter(lt => lt.status === 'ordered').length,
        revenue_this_month: demoDatabase.billing.reduce((sum, bill) => sum + bill.amount, 0)
    };

    sendSuccess(res, { stats });
});

app.get('/api/analytics/patients', authenticateToken, (req, res) => {
    const analytics = {
        total: demoDatabase.patients.length,
        new_this_month: 2,
        gender_distribution: {
            male: demoDatabase.patients.filter(p => p.gender === 'male').length,
            female: demoDatabase.patients.filter(p => p.gender === 'female').length,
            other: demoDatabase.patients.filter(p => p.gender === 'other').length
        },
        age_groups: {
            '0-18': 0,
            '19-35': 1,
            '36-50': 1,
            '51-65': 0,
            '65+': 0
        }
    };

    sendSuccess(res, analytics);
});

app.get('/api/analytics/appointments', authenticateToken, (req, res) => {
    const analytics = {
        total: demoDatabase.appointments.length,
        by_status: {
            scheduled: demoDatabase.appointments.filter(a => a.status === 'scheduled').length,
            confirmed: demoDatabase.appointments.filter(a => a.status === 'confirmed').length,
            completed: demoDatabase.appointments.filter(a => a.status === 'completed').length,
            cancelled: demoDatabase.appointments.filter(a => a.status === 'cancelled').length
        },
        by_month: {
            '2024-12': demoDatabase.appointments.length
        }
    };

    sendSuccess(res, analytics);
});

// Default route
app.get('/', (req, res) => {
    sendSuccess(res, {
        message: 'HMIS Integrated Backend Server',
        version: '1.0.0',
        endpoints: [
            'POST /api/auth/login - User login',
            'GET /api/auth/profile - Get user profile',
            'POST /api/auth/logout - User logout',
            'GET /api/patients - Get patients list',
            'GET /api/patients/:id - Get patient by ID',
            'POST /api/patients - Create patient',
            'PUT /api/patients/:id - Update patient',
            'DELETE /api/patients/:id - Delete patient',
            'GET /api/patients/stats - Get patient statistics',
            'GET /api/patients/search - Search patients',
            'GET /api/appointments - Get appointments list',
            'GET /api/appointments/:id - Get appointment by ID',
            'POST /api/appointments - Create appointment',
            'PUT /api/appointments/:id - Update appointment',
            'DELETE /api/appointments/:id - Delete appointment',
            'GET /api/doctors/availability - Get doctors availability',
            'GET /api/doctors/availability/:id - Get doctor availability',
            'PUT /api/doctors/availability/:id - Update doctor availability',
            'GET /api/doctors/schedule/:id - Get doctor schedule',
            'GET /api/medical/records - Get medical records',
            'POST /api/medical/records - Create medical record',
            'PUT /api/medical/records/:id - Update medical record',
            'GET /api/medical/prescriptions - Get prescriptions',
            'POST /api/medical/prescriptions - Create prescription',
            'PUT /api/medical/prescriptions/:id - Update prescription',
            'GET /api/lab/tests - Get lab tests',
            'POST /api/lab/tests - Order lab test',
            'PUT /api/lab/tests/:id - Update lab test',
            'GET /api/billing - Get billing records',
            'POST /api/billing - Create bill',
            'PUT /api/billing/:id - Update bill',
            'GET /api/notifications - Get notifications',
            'PUT /api/notifications/:id/read - Mark notification as read',
            'GET /api/analytics/dashboard - Get dashboard analytics',
            'GET /api/analytics/patients - Get patient analytics',
            'GET /api/analytics/appointments - Get appointment analytics'
        ]
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    sendError(res, 'Internal server error', 500);
});

// 404 handler
app.use((req, res) => {
    sendError(res, 'API endpoint not found', 404);
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 HMIS Integrated Backend Server Started!`);
    console.log(`=====================================`);
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`=====================================`);
    console.log(`🔑 Test Credentials:`);
    console.log(`   • Admin: admin / admin123`);
    console.log(`   • Doctor: doctor / doctor123`);
    console.log(`   • Nurse: nurse / nurse123`);
    console.log(`   • Receptionist: receptionist / receptionist123`);
    console.log(`   • Pharmacist: pharmacist / pharmacist123`);
    console.log(`   • Patient: patient / patient123`);
    console.log(`=====================================`);
    console.log(`💡 Tip: Use Ctrl+C to stop the server`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
    } else {
        console.error(`❌ Server error: ${err.message}`);
    }
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped successfully');
        process.exit(0);
    });
});

module.exports = app;
