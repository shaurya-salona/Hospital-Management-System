const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Demo data
const demoUsers = [
  {
    id: '1',
    email: 'admin@hospital.com',
    password: 'admin123', // In real app, this would be hashed
    first_name: 'System',
    last_name: 'Administrator',
    role: 'admin',
    phone: '+1234567890',
    is_active: true
  },
  {
    id: '2',
    email: 'dr.smith@hospital.com',
    password: 'doctor123',
    first_name: 'Dr. John',
    last_name: 'Smith',
    role: 'doctor',
    phone: '+1234567891',
    is_active: true
  },
  {
    id: '3',
    email: 'patient@hospital.com',
    password: 'patient123',
    first_name: 'Jane',
    last_name: 'Doe',
    role: 'patient',
    phone: '+1234567892',
    is_active: true
  }
];

const demoPatients = [
  {
    id: '1',
    patient_id: 'PAT000001',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'patient@hospital.com',
    phone: '+1234567892',
    blood_type: 'O+',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    patient_id: 'PAT000002',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@email.com',
    phone: '+1234567893',
    blood_type: 'A+',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    patient_id: 'PAT000003',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.j@email.com',
    phone: '+1234567894',
    blood_type: 'B+',
    is_active: true,
    created_at: new Date().toISOString()
  }
];

const demoAppointments = [
  {
    id: '1',
    patient_id: '1',
    doctor_id: '1',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:00:00',
    reason: 'Regular checkup',
    status: 'scheduled',
    patient_name: 'Jane Doe',
    doctor_name: 'Dr. John Smith'
  },
  {
    id: '2',
    patient_id: '2',
    doctor_id: '1',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '14:00:00',
    reason: 'Follow-up consultation',
    status: 'completed',
    patient_name: 'John Smith',
    doctor_name: 'Dr. John Smith'
  },
  {
    id: '3',
    patient_id: '3',
    doctor_id: '1',
    appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    appointment_time: '09:30:00',
    reason: 'Annual physical',
    status: 'confirmed',
    patient_name: 'Sarah Johnson',
    doctor_name: 'Dr. John Smith'
  }
];

const demoMedicalRecords = [
  {
    id: '1',
    patient_id: '1',
    doctor_id: '1',
    diagnosis: 'Hypertension',
    treatment: 'Lifestyle modifications and medication',
    notes: 'Patient shows improvement with current treatment',
    created_at: new Date().toISOString()
  }
];

const demoPrescriptions = [
  {
    id: '1',
    patient_id: '1',
    doctor_id: '1',
    medication: 'Lisinopril 10mg',
    dosage: 'Once daily',
    instructions: 'Take with food',
    status: 'active',
    created_at: new Date().toISOString()
  }
];

const demoBilling = [
  {
    id: '1',
    bill_number: 'BILL-001',
    patient_id: '1',
    patient_name: 'Jane Doe',
    amount: 150.00,
    status: 'paid',
    due_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    bill_number: 'BILL-002',
    patient_id: '2',
    patient_name: 'John Smith',
    amount: 200.00,
    status: 'pending',
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    created_at: new Date().toISOString()
  }
];

// Demo messages
const demoMessages = [
  {
    id: '1',
    recipient_id: '3',
    sender_id: '2',
    message: 'Please remember to take your medication daily.',
    created_at: new Date().toISOString(),
    sender_role: 'doctor',
    sender_first_name: 'Dr. John',
    sender_last_name: 'Smith'
  }
];

const demoNotifications = [
  {
    id: '1',
    user_id: '1',
    title: 'Welcome to HMIS',
    message: 'Your account has been set up successfully',
    type: 'info',
    is_read: false,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: '1',
    title: 'New Appointment',
    message: 'You have a new appointment scheduled for tomorrow',
    type: 'appointment',
    is_read: false,
    created_at: new Date().toISOString()
  }
];

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Demo server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'demo',
    database: 'in-memory'
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = demoUsers.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }
  
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    'demo-secret-key',
    { expiresIn: '24h' }
  );
  
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      accessToken: token
    }
  });
});

app.get('/api/auth/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }
  
  try {
    const decoded = jwt.verify(token, 'demo-secret-key');
    const user = demoUsers.find(u => u.id === decoded.userId);
    
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
        phone: user.phone,
        is_active: user.is_active
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Patients routes
app.get('/api/patients', (req, res) => {
  res.json({
    success: true,
    data: demoPatients,
    pagination: {
      page: 1,
      limit: 10,
      total: demoPatients.length,
      pages: 1
    },
    message: 'Patients retrieved successfully'
  });
});

app.get('/api/patients/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      overview: {
        total_patients: demoPatients.length,
        active_patients: demoPatients.filter(p => p.is_active).length,
        new_patients_today: 0
      },
      bloodTypeDistribution: [
        { blood_type: 'O+', count: 1 },
        { blood_type: 'A+', count: 0 },
        { blood_type: 'B+', count: 0 },
        { blood_type: 'AB+', count: 0 }
      ],
      ageGroupDistribution: [
        { age_group: '0-18', count: 0 },
        { age_group: '19-35', count: 1 },
        { age_group: '36-55', count: 0 },
        { age_group: '55+', count: 0 }
      ]
    },
    message: 'Patient statistics retrieved successfully'
  });
});

// Appointments routes
app.get('/api/appointments', (req, res) => {
  res.json({
    success: true,
    data: demoAppointments,
    pagination: {
      page: 1,
      limit: 10,
      total: demoAppointments.length,
      pages: 1
    },
    message: 'Appointments retrieved successfully'
  });
});

app.get('/api/appointments/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      overview: {
        total_appointments: demoAppointments.length,
        today_appointments: 1,
        completed_today: 0,
        pending_appointments: 1
      },
      dailyStats: [
        { date: '2024-01-15', appointments: 1, completed: 0 }
      ],
      doctorStats: [
        { doctor_id: '1', doctor_name: 'Dr. John Smith', appointments: 1 }
      ]
    },
    message: 'Appointment statistics retrieved successfully'
  });
});

// Analytics routes
app.get('/api/analytics/hospital', (req, res) => {
  res.json({
    success: true,
    data: {
      overview: {
        total_patients: demoPatients.length,
        total_doctors: 1,
        total_appointments: demoAppointments.length,
        total_revenue: 150.00
      },
      trends: {
        patientAdmissions: [
          { date: '2024-01-15', count: 1 }
        ],
        appointments: [
          { date: '2024-01-15', count: 1 }
        ]
      },
      departmentWorkload: [
        { department: 'General Medicine', workload: 100 }
      ],
      resourceUtilization: {
        bed_occupancy: 75,
        staff_utilization: 80
      },
      financialAnalytics: {
        daily_revenue: 150.00,
        monthly_revenue: 4500.00
      }
    },
    message: 'Hospital analytics retrieved successfully'
  });
});

app.get('/api/analytics/realtime', (req, res) => {
  res.json({
    success: true,
    data: {
      today_appointments: 1,
      completed_today: 0,
      in_progress: 0,
      bed_occupancy_rate: '75%'
    },
    message: 'Real-time analytics retrieved successfully'
  });
});

// AI routes
app.post('/api/ai/analyze-symptoms', (req, res) => {
  const { symptoms, patientAge, patientWeight, allergies } = req.body;
  
  res.json({
    success: true,
    data: {
      diagnoses: [
        {
          disease: 'common_cold',
          confidence: 0.75,
          description: 'Viral infection of upper respiratory tract',
          recommendations: ['Rest', 'Hydration', 'Symptomatic treatment']
        }
      ],
      treatmentPlans: [
        {
          diagnosis: 'common_cold',
          medications: ['Acetaminophen', 'Ibuprofen'],
          lifestyle: ['Rest', 'Hydration', 'Warm liquids']
        }
      ],
      drugInteractions: [],
      riskFactors: ['Age', 'Immune system status']
    },
    message: 'Symptoms analyzed successfully'
  });
});

// Medical Records routes
app.get('/api/medical/records', (req, res) => {
  res.json({
    success: true,
    data: demoMedicalRecords,
    message: 'Medical records retrieved successfully'
  });
});

app.get('/api/medical/prescriptions', (req, res) => {
  res.json({
    success: true,
    data: demoPrescriptions,
    message: 'Prescriptions retrieved successfully'
  });
});

// Billing routes
app.get('/api/billing', (req, res) => {
  res.json({
    success: true,
    data: demoBilling,
    message: 'Billing records retrieved successfully'
  });
});

// Patient portal demo endpoints
app.get('/api/patient-portal/dashboard', (req, res) => {
  const patient = demoPatients.find(p => p.email === 'patient@hospital.com');
  const upcomingAppointments = demoAppointments.filter(a => a.patient_id === patient.id);
  const activePrescriptions = demoPrescriptions.filter(p => p.patient_id === patient.id && p.status === 'active');
  const recentRecords = demoMedicalRecords.filter(r => r.patient_id === patient.id);
  const bills = demoBilling.filter(b => b.patient_id === patient.id);
  res.json({
    success: true,
    data: {
      patient: {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: null,
        bloodType: patient.blood_type
      },
      upcomingAppointments,
      activePrescriptions,
      recentRecords,
      billingSummary: {
        total_bills: bills.length,
        pending_amount: bills.filter(b => b.status === 'pending').reduce((s,b)=>s+b.amount,0),
        paid_amount: bills.filter(b => b.status === 'paid').reduce((s,b)=>s+b.amount,0)
      }
    }
  });
});

app.get('/api/patient-portal/appointments', (req, res) => {
  const { status } = req.query;
  let list = demoAppointments.filter(a => a.patient_id === '1');
  if (status) list = list.filter(a => a.status === status);
  res.json({ success: true, data: list });
});

app.post('/api/patient-portal/appointments/:id/cancel', (req, res) => {
  const { id } = req.params;
  const idx = demoAppointments.findIndex(a => a.id === id && a.patient_id === '1');
  if (idx === -1) return res.status(404).json({ success: false, message: 'Appointment not found' });
  demoAppointments[idx].status = 'cancelled';
  res.json({ success: true, message: 'Appointment cancelled successfully' });
});

app.get('/api/patient-portal/prescriptions', (req, res) => {
  const { status = 'active' } = req.query;
  const list = demoPrescriptions.filter(p => p.patient_id === '1' && (!status || p.status === status));
  res.json({ success: true, data: list });
});

app.post('/api/patient-portal/prescriptions/:id/refill', (req, res) => {
  const { id } = req.params;
  const exists = demoPrescriptions.find(p => p.id === id && p.patient_id === '1');
  if (!exists) return res.status(404).json({ success: false, message: 'Prescription not found' });
  res.json({ success: true, message: 'Refill request submitted successfully' });
});

app.get('/api/patient-portal/medical-records', (req, res) => {
  const list = demoMedicalRecords.filter(r => r.patient_id === '1');
  res.json({ success: true, data: list });
});

app.get('/api/patient-portal/billing', (req, res) => {
  const { status } = req.query;
  let list = demoBilling.filter(b => b.patient_id === '1');
  if (status) list = list.filter(b => b.status === status);
  res.json({ success: true, data: list });
});

app.get('/api/patient-portal/messages', (req, res) => {
  const list = demoMessages.filter(m => m.recipient_id === '3');
  res.json({ success: true, data: list });
});

// Notifications routes
app.get('/api/notifications/user/:userId', (req, res) => {
  const userId = req.params.userId;
  const userNotifications = demoNotifications.filter(n => n.user_id === userId);
  
  res.json({
    success: true,
    data: userNotifications,
    message: 'Notifications retrieved successfully'
  });
});

// Additional API endpoints for role-based dashboards
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: demoUsers,
    message: 'Users retrieved successfully'
  });
});

app.get('/api/inventory', (req, res) => {
  const inventory = [
    {
      id: '1',
      name: 'Lisinopril 10mg',
      category: 'medication',
      quantity: 50,
      unit_price: 15.99,
      expiry_date: '2025-12-31',
      min_stock: 10
    },
    {
      id: '2',
      name: 'Metformin 500mg',
      category: 'medication',
      quantity: 5,
      unit_price: 12.50,
      expiry_date: '2025-10-15',
      min_stock: 20
    }
  ];
  
  res.json({
    success: true,
    data: inventory,
    message: 'Inventory retrieved successfully'
  });
});

app.get('/api/checkin', (req, res) => {
  const checkIns = [
    {
      id: '1',
      patient_id: '1',
      patient_name: 'Jane Doe',
      appointment_time: '10:00:00',
      doctor_name: 'Dr. John Smith',
      checkin_time: new Date().toISOString(),
      status: 'waiting'
    }
  ];
  
  res.json({
    success: true,
    data: checkIns,
    message: 'Check-in records retrieved successfully'
  });
});

app.get('/api/doctors/availability', (req, res) => {
  const doctors = [
    {
      id: '1',
      name: 'Dr. John Smith',
      specialization: 'General Medicine',
      status: 'available',
      current_patients: 2,
      next_available: '11:00 AM'
    },
    {
      id: '2',
      name: 'Dr. Sarah Johnson',
      specialization: 'Cardiology',
      status: 'busy',
      current_patients: 4,
      next_available: '2:00 PM'
    }
  ];
  
  res.json({
    success: true,
    data: doctors,
    message: 'Doctor availability retrieved successfully'
  });
});

app.get('/api/lab/tests', (req, res) => {
  const labTests = [
    {
      id: '1',
      patient_name: 'Jane Doe',
      test_type: 'Blood Test',
      ordered_date: new Date().toISOString(),
      status: 'pending',
      results: null,
      abnormal: false
    }
  ];
  
  res.json({
    success: true,
    data: labTests,
    message: 'Lab tests retrieved successfully'
  });
});

app.get('/api/drug-interactions', (req, res) => {
  const interactions = [
    {
      medication1: 'Lisinopril',
      medication2: 'Ibuprofen',
      severity: 'moderate',
      description: 'May reduce effectiveness of blood pressure medication',
      recommendation: 'Monitor blood pressure closely',
      checked_date: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: interactions,
    message: 'Drug interactions retrieved successfully'
  });
});

app.get('/api/counseling', (req, res) => {
  const counseling = [
    {
      id: '1',
      patient_id: '1',
      patient_name: 'Jane Doe',
      medication: 'Lisinopril',
      date: new Date().toISOString(),
      duration: 15,
      status: 'completed'
    }
  ];
  
  res.json({
    success: true,
    data: counseling,
    message: 'Counseling sessions retrieved successfully'
  });
});

app.get('/api/pharmacy/billing', (req, res) => {
  const pharmacyBilling = [
    {
      id: '1',
      bill_number: 'PHARM-001',
      patient_name: 'Jane Doe',
      medications: 'Lisinopril 10mg x 30',
      amount: 15.99,
      created_at: new Date().toISOString(),
      payment_method: 'cash',
      status: 'paid'
    }
  ];
  
  res.json({
    success: true,
    data: pharmacyBilling,
    message: 'Pharmacy billing retrieved successfully'
  });
});

// Analytics endpoints for different roles
app.get('/api/analytics/doctor', (req, res) => {
  res.json({
    success: true,
    data: {
      patientVisits: [8, 12, 6, 15, 10, 4, 2],
      diagnosisDistribution: [
        { name: 'Hypertension', count: 25 },
        { name: 'Diabetes', count: 20 },
        { name: 'Common Cold', count: 30 }
      ],
      prescriptionTrends: [45, 52, 38, 61, 47, 55],
      efficiency: [25, 12, 85, 92]
    },
    message: 'Doctor analytics retrieved successfully'
  });
});

app.get('/api/analytics/receptionist', (req, res) => {
  res.json({
    success: true,
    data: {
      patientFlow: [5, 12, 8, 15, 10, 6],
      appointmentTrends: [25, 30, 22, 35, 28, 15, 8],
      revenueAnalysis: [
        { method: 'Cash', amount: 40 },
        { method: 'Insurance', amount: 35 },
        { method: 'Credit Card', amount: 20 }
      ],
      doctorUtilization: [85, 92, 78, 88]
    },
    message: 'Receptionist analytics retrieved successfully'
  });
});

app.get('/api/analytics/pharmacy', (req, res) => {
  res.json({
    success: true,
    data: {
      prescriptionTrends: [120, 150, 180, 160, 200, 220],
      medicationSales: [45, 60, 35, 25, 40],
      inventoryLevels: [60, 25, 10, 5],
      revenue: [15000, 18000, 16000, 20000, 22000, 25000]
    },
    message: 'Pharmacy analytics retrieved successfully'
  });
});

// Analytics API endpoints
app.get('/api/analytics/dashboard', (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Calculate date range
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  // Patient statistics
  const patientStats = {
    total_patients: demoPatients.length,
    new_patients_week: Math.floor(demoPatients.length * 0.1),
    new_patients_month: Math.floor(demoPatients.length * 0.3)
  };

  // Appointment statistics
  const appointmentStats = {
    total_appointments: demoAppointments.length,
    scheduled: demoAppointments.filter(a => a.status === 'scheduled').length,
    completed: demoAppointments.filter(a => a.status === 'completed').length,
    cancelled: demoAppointments.filter(a => a.status === 'cancelled').length,
    upcoming: demoAppointments.filter(a => new Date(a.appointment_date) > now).length
  };

  // Revenue analytics
  const revenueStats = {
    total_revenue: demoBilling.reduce((sum, bill) => sum + bill.amount, 0),
    revenue_week: Math.floor(demoBilling.reduce((sum, bill) => sum + bill.amount, 0) * 0.1),
    revenue_month: Math.floor(demoBilling.reduce((sum, bill) => sum + bill.amount, 0) * 0.3),
    total_bills: demoBilling.length
  };

  // Doctor performance
  const doctorStats = demoUsers
    .filter(user => user.role === 'doctor')
    .map(doctor => {
      const doctorAppointments = demoAppointments.filter(apt => apt.doctor_id === doctor.id);
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

  // Patient demographics
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
});

app.get('/api/analytics/patients', (req, res) => {
  const { startDate, endDate, groupBy = 'month' } = req.query;
  
  // Patient registration trends
  const registrationTrends = [
    { period: '2024-01', new_patients: 25 },
    { period: '2024-02', new_patients: 30 },
    { period: '2024-03', new_patients: 28 },
    { period: '2024-04', new_patients: 35 },
    { period: '2024-05', new_patients: 32 },
    { period: '2024-06', new_patients: 40 }
  ];

  // Patient visits by department
  const visitsByDepartment = [
    { department: 'Cardiology', total_visits: 45, unique_patients: 30 },
    { department: 'Neurology', total_visits: 35, unique_patients: 25 },
    { department: 'Orthopedics', total_visits: 50, unique_patients: 35 },
    { department: 'General Medicine', total_visits: 60, unique_patients: 40 }
  ];

  // Patient satisfaction scores
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
});

app.get('/api/analytics/financial', (req, res) => {
  const { startDate, endDate, groupBy = 'month' } = req.query;
  
  // Revenue trends
  const revenueTrends = [
    { period: '2024-01', revenue: 45000, total_bills: 120, average_bill_amount: 375 },
    { period: '2024-02', revenue: 52000, total_bills: 135, average_bill_amount: 385 },
    { period: '2024-03', revenue: 48000, total_bills: 125, average_bill_amount: 384 },
    { period: '2024-04', revenue: 55000, total_bills: 140, average_bill_amount: 393 },
    { period: '2024-05', revenue: 58000, total_bills: 145, average_bill_amount: 400 },
    { period: '2024-06', revenue: 62000, total_bills: 155, average_bill_amount: 400 }
  ];

  // Revenue by service type
  const revenueByService = [
    { service_type: 'Consultation', total_revenue: 25000, total_bills: 80, average_amount: 312.5 },
    { service_type: 'Laboratory', total_revenue: 15000, total_bills: 60, average_amount: 250 },
    { service_type: 'Imaging', total_revenue: 20000, total_bills: 40, average_amount: 500 },
    { service_type: 'Pharmacy', total_revenue: 8000, total_bills: 100, average_amount: 80 }
  ];

  // Payment status analysis
  const paymentStatus = [
    { payment_status: 'paid', count: 120, total_amount: 45000, percentage: 75.0 },
    { payment_status: 'pending', count: 30, total_amount: 12000, percentage: 18.75 },
    { payment_status: 'overdue', count: 10, total_amount: 5000, percentage: 6.25 }
  ];

  // Outstanding payments
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
});

app.get('/api/analytics/operational', (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Appointment efficiency
  const appointmentEfficiency = {
    average_duration_minutes: 45,
    total_appointments: demoAppointments.length,
    completed_appointments: demoAppointments.filter(a => a.status === 'completed').length,
    no_show_count: demoAppointments.filter(a => a.status === 'no_show').length,
    no_show_rate: Math.round((demoAppointments.filter(a => a.status === 'no_show').length / demoAppointments.length) * 100)
  };

  // Resource utilization
  const resourceUtilization = [
    { resource_name: 'Operating Room 1', resource_type: 'room', total_bookings: 25, total_hours_booked: 200, utilization_percentage: 85 },
    { resource_name: 'MRI Machine', resource_type: 'equipment', total_bookings: 30, total_hours_booked: 150, utilization_percentage: 75 },
    { resource_name: 'X-Ray Room', resource_type: 'room', total_bookings: 40, total_hours_booked: 120, utilization_percentage: 60 },
    { resource_name: 'Consultation Room 1', resource_type: 'room', total_bookings: 50, total_hours_booked: 180, utilization_percentage: 90 }
  ];

  // Staff workload
  const staffWorkload = demoUsers
    .filter(user => user.role === 'doctor' || user.role === 'nurse')
    .map(staff => {
      const staffAppointments = demoAppointments.filter(apt => apt.doctor_id === staff.id);
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
});

app.post('/api/analytics/reports/custom', (req, res) => {
  const { reportType, startDate, endDate, filters = {} } = req.body;
  
  let reportData = {};
  
  switch (reportType) {
    case 'patient_summary':
      reportData = {
        patients: demoPatients.map(patient => ({
          patient_id: patient.patient_id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          registration_date: patient.created_at,
          total_appointments: demoAppointments.filter(apt => apt.patient_id === patient.id).length,
          completed_appointments: demoAppointments.filter(apt => apt.patient_id === patient.id && apt.status === 'completed').length
        }))
      };
      break;
      
    case 'financial_summary':
      reportData = {
        summary: {
          total_revenue: demoBilling.reduce((sum, bill) => sum + bill.amount, 0),
          total_bills: demoBilling.length,
          average_bill_amount: Math.round(demoBilling.reduce((sum, bill) => sum + bill.amount, 0) / demoBilling.length),
          paid_amount: demoBilling.filter(bill => bill.payment_status === 'paid').reduce((sum, bill) => sum + bill.amount, 0),
          pending_amount: demoBilling.filter(bill => bill.payment_status === 'pending').reduce((sum, bill) => sum + bill.amount, 0),
          overdue_amount: demoBilling.filter(bill => bill.payment_status === 'overdue').reduce((sum, bill) => sum + bill.amount, 0)
        }
      };
      break;
      
    case 'appointment_analysis':
      reportData = {
        analysis: {
          total_appointments: demoAppointments.length,
          scheduled: demoAppointments.filter(a => a.status === 'scheduled').length,
          completed: demoAppointments.filter(a => a.status === 'completed').length,
          cancelled: demoAppointments.filter(a => a.status === 'cancelled').length,
          no_show: demoAppointments.filter(a => a.status === 'no_show').length,
          average_duration_minutes: 45
        }
      };
      break;
      
    case 'staff_performance':
      reportData = {
        performance: demoUsers
          .filter(user => user.role === 'doctor' || user.role === 'nurse')
          .map(staff => {
            const staffAppointments = demoAppointments.filter(apt => apt.doctor_id === staff.id);
            const completedAppointments = staffAppointments.filter(apt => apt.status === 'completed');
            return {
              first_name: staff.first_name,
              last_name: staff.last_name,
              role: staff.role,
              total_appointments: staffAppointments.length,
              completed_appointments: completedAppointments.length,
              completion_rate: staffAppointments.length > 0 
                ? Math.round((completedAppointments.length / staffAppointments.length) * 100) 
                : 0,
              average_duration_minutes: 45
            };
          })
      };
      break;
      
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid report type'
      });
  }

  res.json({
    success: true,
    data: reportData
  });
});

app.get('/api/analytics/export/:type', (req, res) => {
  const { type } = req.params;
  const { startDate, endDate, format = 'json' } = req.query;
  
  // Mock export data
  const exportData = {
    dashboard: { message: 'Dashboard analytics export data' },
    patients: { message: 'Patient analytics export data' },
    financial: { message: 'Financial analytics export data' },
    operational: { message: 'Operational analytics export data' }
  };
  
  const data = exportData[type] || { message: 'Unknown export type' };
  
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="hmis_${type}_analytics.csv"`);
    res.send('Period,Value\n2024-01,100\n2024-02,120\n2024-03,110');
  } else if (format === 'xlsx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="hmis_${type}_analytics.xlsx"`);
    res.json(data);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="hmis_${type}_analytics.json"`);
    res.json(data);
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
  console.log(`🚀 HMIS Demo Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`🌍 Environment: demo`);
  console.log(`🔌 WebSocket server initialized`);
  console.log(`\n📋 Demo Login Credentials:`);
  console.log(`   Admin: admin@hospital.com / admin123`);
  console.log(`   Doctor: dr.smith@hospital.com / doctor123`);
  console.log(`   Patient: patient@hospital.com / patient123`);
});

module.exports = app;
