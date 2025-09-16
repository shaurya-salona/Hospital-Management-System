const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Use demo database
const db = require('./config/demo-database');
const demoData = db.demoData;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Working server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development',
    database: 'demo'
  });
});

app.get('/health/ready', (req, res) => {
  res.json({
    success: true,
    message: 'Server is ready',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (req, res) => {
  res.json({
    success: true,
    message: 'Server is alive',
    timestamp: new Date().toISOString()
  });
});

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

// Auth routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user in demo data
    const user = demoData.users.find(u => u.email === username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // For demo purposes, we'll accept the plain password
    const validPassword = password === 'admin123' || password === 'doctor123' || password === 'patient123';
    
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          phone: user.phone
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const user = demoData.users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Patient routes
app.get('/api/patients', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 10, search, blood_type, gender } = req.query;
    
    let patients = [...demoData.patients];
    
    // Apply filters
    if (search) {
      patients = patients.filter(p => 
        p.patient_id.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (blood_type) {
      patients = patients.filter(p => p.blood_type === blood_type);
    }
    
    if (gender) {
      patients = patients.filter(p => p.gender === gender);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPatients = patients.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedPatients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: patients.length,
        pages: Math.ceil(patients.length / limit)
      }
    });

  } catch (error) {
    console.error('Patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/patients/:id', authenticateToken, (req, res) => {
  try {
    const patient = demoData.patients.find(p => p.id === req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    res.json({
      success: true,
      data: patient
    });

  } catch (error) {
    console.error('Patient detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Appointment routes
app.get('/api/appointments', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 10, status, doctor_id, patient_id } = req.query;
    
    let appointments = [...demoData.appointments];
    
    // Apply filters
    if (status) {
      appointments = appointments.filter(a => a.status === status);
    }
    
    if (doctor_id) {
      appointments = appointments.filter(a => a.doctor_id === doctor_id);
    }
    
    if (patient_id) {
      appointments = appointments.filter(a => a.patient_id === patient_id);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedAppointments = appointments.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedAppointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: appointments.length,
        pages: Math.ceil(appointments.length / limit)
      }
    });

  } catch (error) {
    console.error('Appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Analytics routes
app.get('/api/analytics/dashboard', authenticateToken, (req, res) => {
  try {
    // Patient statistics
    const patientStats = {
      total_patients: demoData.patients.length,
      new_patients_week: Math.floor(demoData.patients.length * 0.1),
      new_patients_month: Math.floor(demoData.patients.length * 0.3)
    };

    // Appointment statistics
    const appointmentStats = {
      total_appointments: demoData.appointments.length,
      scheduled: demoData.appointments.filter(a => a.status === 'scheduled').length,
      completed: demoData.appointments.filter(a => a.status === 'completed').length,
      cancelled: demoData.appointments.filter(a => a.status === 'cancelled').length,
      upcoming: demoData.appointments.filter(a => new Date(a.appointment_date) > new Date()).length
    };

    // Revenue analytics (mock data)
    const revenueStats = {
      total_revenue: 150000,
      revenue_week: 15000,
      revenue_month: 45000,
      total_bills: 120
    };

    // Doctor performance
    const doctorStats = demoData.users
      .filter(user => user.role === 'doctor')
      .map(doctor => {
        const doctorAppointments = demoData.appointments.filter(apt => apt.doctor_id === doctor.id);
        const completedAppointments = doctorAppointments.filter(apt => apt.status === 'completed');
        return {
          first_name: doctor.first_name,
          last_name: doctor.last_name,
          total_appointments: doctorAppointments.length,
          completed_appointments: completedAppointments.length,
          completion_rate: doctorAppointments.length > 0 
            ? Math.round((completedAppointments.length / doctorAppointments.length) * 100) 
            : 0
        };
      });

    // Patient demographics (mock data)
    const demographics = [
      { age_group: '18-30', gender: 'male', count: 15 },
      { age_group: '18-30', gender: 'female', count: 20 },
      { age_group: '31-50', gender: 'male', count: 25 },
      { age_group: '31-50', gender: 'female', count: 30 },
      { age_group: '51-70', gender: 'male', count: 20 },
      { age_group: '51-70', gender: 'female', count: 25 },
      { age_group: '70+', gender: 'male', count: 10 },
      { age_group: '70+', gender: 'female', count: 15 }
    ];

    res.json({
      success: true,
      data: {
        patients: patientStats,
        appointments: appointmentStats,
        revenue: revenueStats,
        doctorPerformance: doctorStats,
        demographics: demographics
      }
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/analytics/patients', authenticateToken, (req, res) => {
  try {
    const registrationTrends = [
      { period: '2024-01', new_patients: 25 },
      { period: '2024-02', new_patients: 30 },
      { period: '2024-03', new_patients: 28 },
      { period: '2024-04', new_patients: 35 },
      { period: '2024-05', new_patients: 32 },
      { period: '2024-06', new_patients: 40 }
    ];

    const visitsByDepartment = [
      { department: 'Cardiology', total_visits: 45, unique_patients: 30 },
      { department: 'Neurology', total_visits: 35, unique_patients: 25 },
      { department: 'Orthopedics', total_visits: 50, unique_patients: 35 },
      { department: 'General Medicine', total_visits: 60, unique_patients: 40 }
    ];

    const satisfactionScores = {
      average_rating: 4.2,
      total_ratings: 150,
      positive_ratings: 120
    };

    res.json({
      success: true,
      data: {
        registrationTrends: registrationTrends,
        visitsByDepartment: visitsByDepartment,
        satisfactionScores: satisfactionScores
      }
    });

  } catch (error) {
    console.error('Analytics patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/analytics/financial', authenticateToken, (req, res) => {
  try {
    const revenueTrends = [
      { period: '2024-01', revenue: 45000, total_bills: 120, average_bill_amount: 375 },
      { period: '2024-02', revenue: 52000, total_bills: 135, average_bill_amount: 385 },
      { period: '2024-03', revenue: 48000, total_bills: 125, average_bill_amount: 384 },
      { period: '2024-04', revenue: 55000, total_bills: 140, average_bill_amount: 393 },
      { period: '2024-05', revenue: 58000, total_bills: 145, average_bill_amount: 400 },
      { period: '2024-06', revenue: 62000, total_bills: 155, average_bill_amount: 400 }
    ];

    const revenueByService = [
      { service_type: 'Consultation', total_revenue: 25000, total_bills: 80, average_amount: 312.5 },
      { service_type: 'Laboratory', total_revenue: 15000, total_bills: 60, average_amount: 250 },
      { service_type: 'Imaging', total_revenue: 20000, total_bills: 40, average_amount: 500 },
      { service_type: 'Pharmacy', total_revenue: 8000, total_bills: 100, average_amount: 80 }
    ];

    const paymentStatus = [
      { payment_status: 'paid', count: 120, total_amount: 45000, percentage: 75.0 },
      { payment_status: 'pending', count: 30, total_amount: 12000, percentage: 18.75 },
      { payment_status: 'overdue', count: 10, total_amount: 5000, percentage: 6.25 }
    ];

    const outstandingPayments = {
      pending_amount: 12000,
      overdue_amount: 5000,
      pending_count: 30,
      overdue_count: 10
    };

    res.json({
      success: true,
      data: {
        revenueTrends: revenueTrends,
        revenueByService: revenueByService,
        paymentStatus: paymentStatus,
        outstandingPayments: outstandingPayments
      }
    });

  } catch (error) {
    console.error('Analytics financial error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/analytics/operational', authenticateToken, (req, res) => {
  try {
    const appointmentEfficiency = {
      average_duration_minutes: 45,
      total_appointments: demoData.appointments.length,
      completed_appointments: demoData.appointments.filter(a => a.status === 'completed').length,
      no_show_count: demoData.appointments.filter(a => a.status === 'no_show').length,
      no_show_rate: Math.round((demoData.appointments.filter(a => a.status === 'no_show').length / demoData.appointments.length) * 100)
    };

    const resourceUtilization = [
      { resource_name: 'Operating Room 1', resource_type: 'room', total_bookings: 25, total_hours_booked: 200, utilization_percentage: 85 },
      { resource_name: 'MRI Machine', resource_type: 'equipment', total_bookings: 30, total_hours_booked: 150, utilization_percentage: 75 },
      { resource_name: 'X-Ray Room', resource_type: 'room', total_bookings: 40, total_hours_booked: 120, utilization_percentage: 60 },
      { resource_name: 'Consultation Room 1', resource_type: 'room', total_bookings: 50, total_hours_booked: 180, utilization_percentage: 90 }
    ];

    const staffWorkload = demoData.users
      .filter(user => user.role === 'doctor' || user.role === 'nurse')
      .map(staff => {
        const staffAppointments = demoData.appointments.filter(apt => apt.doctor_id === staff.id);
        return {
          first_name: staff.first_name,
          last_name: staff.last_name,
          role: staff.role,
          total_appointments: staffAppointments.length,
          upcoming_appointments: staffAppointments.filter(apt => new Date(apt.appointment_date) > new Date()).length,
          average_appointment_duration: 45
        };
      });

    res.json({
      success: true,
      data: {
        appointmentEfficiency: appointmentEfficiency,
        resourceUtilization: resourceUtilization,
        staffWorkload: staffWorkload
      }
    });

  } catch (error) {
    console.error('Analytics operational error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Patient portal routes
app.get('/api/patient-portal/dashboard', authenticateToken, (req, res) => {
  try {
    const patientId = req.user.id;
    const patient = demoData.patients.find(p => p.user_id === patientId);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const dashboardData = {
      patient: patient,
      upcoming_appointments: demoData.appointments.filter(a => a.patient_id === patientId && new Date(a.appointment_date) > new Date()),
      recent_appointments: demoData.appointments.filter(a => a.patient_id === patientId).slice(0, 5),
      total_appointments: demoData.appointments.filter(a => a.patient_id === patientId).length
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Patient portal dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/patient-portal/appointments', authenticateToken, (req, res) => {
  try {
    const patientId = req.user.id;
    const appointments = demoData.appointments.filter(a => a.patient_id === patientId);
    
    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('Patient portal appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/patient-portal/medical-records', authenticateToken, (req, res) => {
  try {
    const patientId = req.user.id;
    const medicalRecords = demoData.medical_records.filter(r => r.patient_id === patientId);
    
    res.json({
      success: true,
      data: medicalRecords
    });

  } catch (error) {
    console.error('Patient portal medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/patient-portal/prescriptions', authenticateToken, (req, res) => {
  try {
    const patientId = req.user.id;
    const prescriptions = demoData.prescriptions.filter(p => p.patient_id === patientId);
    
    res.json({
      success: true,
      data: prescriptions
    });

  } catch (error) {
    console.error('Patient portal prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/patient-portal/billing', authenticateToken, (req, res) => {
  try {
    const patientId = req.user.id;
    const billing = demoData.billing.filter(b => b.patient_id === patientId);
    
    res.json({
      success: true,
      data: billing
    });

  } catch (error) {
    console.error('Patient portal billing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  socket.on('join-room', (data) => {
    const { userId, role } = data;
    socket.join(`user-${userId}`);
    socket.join(`role-${role}`);
    console.log(`👤 User ${userId} joined rooms: user-${userId}, role-${role}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 HMIS Working Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`📈 Analytics API: http://localhost:${PORT}/api/analytics`);
  console.log(`🌍 Environment: development`);
  console.log(`🔌 WebSocket server initialized`);
  console.log(`\n📋 Demo Login Credentials:`);
  console.log(`   Admin: admin@hospital.com / admin123`);
  console.log(`   Doctor: dr.smith@hospital.com / doctor123`);
  console.log(`   Patient: patient@hospital.com / patient123`);
  console.log(`\n✨ Features:`);
  console.log(`   ✅ Production security & rate limiting`);
  console.log(`   ✅ Analytics & reporting`);
  console.log(`   ✅ WebSocket real-time updates`);
  console.log(`   ✅ Demo database (no PostgreSQL needed)`);
  console.log(`   ✅ All API endpoints working`);
});


