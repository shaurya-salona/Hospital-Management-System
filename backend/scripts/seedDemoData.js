const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class DemoDataSeeder {
  constructor() {
    this.demoUsers = [
      {
        username: 'admin',
        email: 'admin@hospital.com',
        password: 'admin123',
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        phone: '+1-555-0001'
      },
      {
        username: 'dr.smith',
        email: 'dr.smith@hospital.com',
        password: 'doctor123',
        role: 'doctor',
        firstName: 'Dr. John',
        lastName: 'Smith',
        phone: '+1-555-0002'
      },
      {
        username: 'dr.johnson',
        email: 'dr.johnson@hospital.com',
        password: 'doctor123',
        role: 'doctor',
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        phone: '+1-555-0003'
      },
      {
        username: 'nurse.wilson',
        email: 'nurse.wilson@hospital.com',
        password: 'nurse123',
        role: 'nurse',
        firstName: 'Emily',
        lastName: 'Wilson',
        phone: '+1-555-0004'
      },
      {
        username: 'reception.brown',
        email: 'reception.brown@hospital.com',
        password: 'reception123',
        role: 'receptionist',
        firstName: 'Michael',
        lastName: 'Brown',
        phone: '+1-555-0005'
      },
      {
        username: 'pharm.davis',
        email: 'pharm.davis@hospital.com',
        password: 'pharmacist123',
        role: 'pharmacist',
        firstName: 'Lisa',
        lastName: 'Davis',
        phone: '+1-555-0006'
      }
    ];

    this.demoPatients = [
      {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@email.com',
        phone: '+1-555-1001',
        dateOfBirth: '1985-03-15',
        gender: 'female',
        bloodType: 'O+',
        address: '123 Main St, City, State 12345',
        allergies: 'Penicillin, Shellfish',
        medicalHistory: 'Hypertension, Diabetes Type 2',
        insuranceProvider: 'Blue Cross Blue Shield',
        insuranceNumber: 'BC123456789',
        emergencyContactName: 'John Doe',
        emergencyContactPhone: '+1-555-1002'
      },
      {
        firstName: 'Robert',
        lastName: 'Smith',
        email: 'robert.smith@email.com',
        phone: '+1-555-1003',
        dateOfBirth: '1978-07-22',
        gender: 'male',
        bloodType: 'A+',
        address: '456 Oak Ave, City, State 12345',
        allergies: 'None',
        medicalHistory: 'Previous appendectomy (2010)',
        insuranceProvider: 'Aetna',
        insuranceNumber: 'AE987654321',
        emergencyContactName: 'Mary Smith',
        emergencyContactPhone: '+1-555-1004'
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1-555-1005',
        dateOfBirth: '1992-11-08',
        gender: 'female',
        bloodType: 'B+',
        address: '789 Pine Rd, City, State 12345',
        allergies: 'Latex',
        medicalHistory: 'Asthma',
        insuranceProvider: 'Cigna',
        insuranceNumber: 'CI456789123',
        emergencyContactName: 'David Johnson',
        emergencyContactPhone: '+1-555-1006'
      },
      {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@email.com',
        phone: '+1-555-1007',
        dateOfBirth: '1965-12-03',
        gender: 'male',
        bloodType: 'AB-',
        address: '321 Elm St, City, State 12345',
        allergies: 'Aspirin',
        medicalHistory: 'Heart disease, High cholesterol',
        insuranceProvider: 'UnitedHealth',
        insuranceNumber: 'UH789123456',
        emergencyContactName: 'Susan Brown',
        emergencyContactPhone: '+1-555-1008'
      },
      {
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@email.com',
        phone: '+1-555-1009',
        dateOfBirth: '1995-05-18',
        gender: 'female',
        bloodType: 'O-',
        address: '654 Maple Dr, City, State 12345',
        allergies: 'Peanuts, Tree nuts',
        medicalHistory: 'None',
        insuranceProvider: 'Kaiser Permanente',
        insuranceNumber: 'KP123789456',
        emergencyContactName: 'James Davis',
        emergencyContactPhone: '+1-555-1010'
      }
    ];

    this.demoAppointments = [
      {
        patientId: 1,
        doctorId: 2,
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '09:00:00',
        durationMinutes: 30,
        reason: 'Annual physical examination',
        status: 'scheduled'
      },
      {
        patientId: 2,
        doctorId: 2,
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '10:30:00',
        durationMinutes: 45,
        reason: 'Follow-up consultation',
        status: 'confirmed'
      },
      {
        patientId: 3,
        doctorId: 3,
        appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        appointmentTime: '14:00:00',
        durationMinutes: 30,
        reason: 'Asthma management',
        status: 'scheduled'
      },
      {
        patientId: 4,
        doctorId: 2,
        appointmentDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        appointmentTime: '11:00:00',
        durationMinutes: 60,
        reason: 'Cardiology consultation',
        status: 'scheduled'
      },
      {
        patientId: 5,
        doctorId: 3,
        appointmentDate: new Date(Date.now() + 259200000).toISOString().split('T')[0],
        appointmentTime: '15:30:00',
        durationMinutes: 30,
        reason: 'General checkup',
        status: 'scheduled'
      }
    ];

    this.demoMedicalRecords = [
      {
        patientId: 1,
        doctorId: 2,
        diagnosis: 'Hypertension, Type 2 Diabetes',
        symptoms: 'Elevated blood pressure, frequent urination, increased thirst',
        treatmentPlan: 'Lifestyle modifications, medication management',
        prescription: 'Lisinopril 10mg daily, Metformin 500mg twice daily',
        vitalSigns: {
          bloodPressure: '140/90',
          heartRate: 85,
          temperature: 98.6,
          weight: 165,
          height: 65
        },
        labResults: {
          glucose: 180,
          hba1c: 7.2,
          cholesterol: 220
        }
      },
      {
        patientId: 2,
        doctorId: 2,
        diagnosis: 'Post-operative follow-up',
        symptoms: 'Healing well, no complications',
        treatmentPlan: 'Continue current medications, follow-up in 3 months',
        prescription: 'Ibuprofen 400mg as needed for pain',
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 98.4,
          weight: 180,
          height: 70
        }
      }
    ];

    this.demoPrescriptions = [
      {
        patientId: 1,
        doctorId: 2,
        medicationName: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take with food, monitor blood pressure',
        status: 'active'
      },
      {
        patientId: 1,
        doctorId: 2,
        medicationName: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '30 days',
        instructions: 'Take with meals',
        status: 'active'
      },
      {
        patientId: 2,
        doctorId: 2,
        medicationName: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'As needed',
        duration: '7 days',
        instructions: 'Take with food, maximum 3 times daily',
        status: 'active'
      }
    ];

    this.demoBilling = [
      {
        patientId: 1,
        totalAmount: 150.00,
        paidAmount: 150.00,
        balance: 0.00,
        billingDate: new Date().toISOString().split('T')[0],
        status: 'paid',
        paymentMethod: 'insurance'
      },
      {
        patientId: 2,
        totalAmount: 200.00,
        paidAmount: 50.00,
        balance: 150.00,
        billingDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 2592000000).toISOString().split('T')[0],
        status: 'partial',
        paymentMethod: 'cash'
      },
      {
        patientId: 3,
        totalAmount: 125.00,
        paidAmount: 0.00,
        balance: 125.00,
        billingDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 2592000000).toISOString().split('T')[0],
        status: 'pending',
        paymentMethod: null
      }
    ];

    this.demoInventory = [
      {
        medicationName: 'Lisinopril',
        genericName: 'Lisinopril',
        manufacturer: 'Generic',
        batchNumber: 'LIS001',
        expiryDate: '2025-12-31',
        quantityInStock: 500,
        unitPrice: 0.25,
        reorderLevel: 50
      },
      {
        medicationName: 'Metformin',
        genericName: 'Metformin HCl',
        manufacturer: 'Generic',
        batchNumber: 'MET001',
        expiryDate: '2025-10-15',
        quantityInStock: 300,
        unitPrice: 0.15,
        reorderLevel: 30
      },
      {
        medicationName: 'Ibuprofen',
        genericName: 'Ibuprofen',
        manufacturer: 'Generic',
        batchNumber: 'IBU001',
        expiryDate: '2026-03-20',
        quantityInStock: 1000,
        unitPrice: 0.10,
        reorderLevel: 100
      },
      {
        medicationName: 'Amoxicillin',
        genericName: 'Amoxicillin',
        manufacturer: 'Generic',
        batchNumber: 'AMX001',
        expiryDate: '2025-08-30',
        quantityInStock: 150,
        unitPrice: 2.50,
        reorderLevel: 25
      }
    ];
  }

  async seed() {
    try {
      console.log('🌱 Starting demo data seeding...');

      // Clear existing data
      await this.clearData();

      // Seed users
      await this.seedUsers();

      // Seed staff
      await this.seedStaff();

      // Seed patients
      await this.seedPatients();

      // Seed appointments
      await this.seedAppointments();

      // Seed medical records
      await this.seedMedicalRecords();

      // Seed prescriptions
      await this.seedPrescriptions();

      // Seed billing
      await this.seedBilling();

      // Seed inventory
      await this.seedInventory();

      // Seed notifications
      await this.seedNotifications();

      console.log('✅ Demo data seeding completed successfully!');
    } catch (error) {
      console.error('❌ Error seeding demo data:', error);
      throw error;
    }
  }

  async clearData() {
    console.log('🧹 Clearing existing data...');
    
    const tables = [
      'notifications', 'audit_logs', 'billing', 'prescriptions',
      'medical_records', 'appointments', 'inventory', 'patients', 'staff', 'users'
    ];

    for (const table of tables) {
      await pool.query(`DELETE FROM ${table}`);
    }
  }

  async seedUsers() {
    console.log('👥 Seeding users...');
    
    for (const userData of this.demoUsers) {
      const passwordHash = await bcrypt.hash(userData.password, 12);
      
      const query = `
        INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;
      
      const values = [
        userData.username, userData.email, passwordHash, userData.role,
        userData.firstName, userData.lastName, userData.phone
      ];
      
      const result = await pool.query(query, values);
      userData.id = result.rows[0].id;
    }
  }

  async seedStaff() {
    console.log('👨‍⚕️ Seeding staff...');
    
    const staffData = [
      { userId: this.demoUsers[1].id, employeeId: 'EMP001', department: 'Internal Medicine', specialization: 'General Medicine' },
      { userId: this.demoUsers[2].id, employeeId: 'EMP002', department: 'Pulmonology', specialization: 'Respiratory Medicine' },
      { userId: this.demoUsers[3].id, employeeId: 'EMP003', department: 'Nursing', specialization: 'General Nursing' },
      { userId: this.demoUsers[4].id, employeeId: 'EMP004', department: 'Administration', specialization: 'Patient Services' },
      { userId: this.demoUsers[5].id, employeeId: 'EMP005', department: 'Pharmacy', specialization: 'Clinical Pharmacy' }
    ];

    for (const staff of staffData) {
      const query = `
        INSERT INTO staff (user_id, employee_id, department, specialization, hire_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      
      const values = [staff.userId, staff.employeeId, staff.department, staff.specialization, '2023-01-01'];
      const result = await pool.query(query, values);
      staff.id = result.rows[0].id;
    }
  }

  async seedPatients() {
    console.log('🏥 Seeding patients...');
    
    for (let i = 0; i < this.demoPatients.length; i++) {
      const patientData = this.demoPatients[i];
      const patientId = `PAT${(i + 1).toString().padStart(6, '0')}`;
      
      const query = `
        INSERT INTO patients (
          patient_id, first_name, last_name, email, phone, date_of_birth,
          gender, address, blood_type, allergies, medical_history,
          insurance_provider, insurance_number, emergency_contact_name, emergency_contact_phone
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `;
      
      const values = [
        patientId, patientData.firstName, patientData.lastName, patientData.email,
        patientData.phone, patientData.dateOfBirth, patientData.gender, patientData.address,
        patientData.bloodType, patientData.allergies, patientData.medicalHistory,
        patientData.insuranceProvider, patientData.insuranceNumber,
        patientData.emergencyContactName, patientData.emergencyContactPhone
      ];
      
      const result = await pool.query(query, values);
      patientData.id = result.rows[0].id;
    }
  }

  async seedAppointments() {
    console.log('📅 Seeding appointments...');
    
    for (const appointment of this.demoAppointments) {
      const query = `
        INSERT INTO appointments (
          patient_id, doctor_id, appointment_date, appointment_time,
          duration_minutes, reason, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      const values = [
        this.demoPatients[appointment.patientId - 1].id,
        appointment.doctorId,
        appointment.appointmentDate,
        appointment.appointmentTime,
        appointment.durationMinutes,
        appointment.reason,
        appointment.status
      ];
      
      await pool.query(query, values);
    }
  }

  async seedMedicalRecords() {
    console.log('📋 Seeding medical records...');
    
    for (const record of this.demoMedicalRecords) {
      const query = `
        INSERT INTO medical_records (
          patient_id, doctor_id, diagnosis, symptoms, treatment_plan,
          prescription, vital_signs, lab_results
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      const values = [
        this.demoPatients[record.patientId - 1].id,
        record.doctorId,
        record.diagnosis,
        record.symptoms,
        record.treatmentPlan,
        record.prescription,
        JSON.stringify(record.vitalSigns),
        JSON.stringify(record.labResults)
      ];
      
      await pool.query(query, values);
    }
  }

  async seedPrescriptions() {
    console.log('💊 Seeding prescriptions...');
    
    for (const prescription of this.demoPrescriptions) {
      const query = `
        INSERT INTO prescriptions (
          patient_id, doctor_id, medication_name, dosage, frequency,
          duration, instructions, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      const values = [
        this.demoPatients[prescription.patientId - 1].id,
        prescription.doctorId,
        prescription.medicationName,
        prescription.dosage,
        prescription.frequency,
        prescription.duration,
        prescription.instructions,
        prescription.status
      ];
      
      await pool.query(query, values);
    }
  }

  async seedBilling() {
    console.log('💰 Seeding billing records...');
    
    for (const bill of this.demoBilling) {
      const query = `
        INSERT INTO billing (
          patient_id, total_amount, paid_amount, balance,
          billing_date, due_date, status, payment_method
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      const values = [
        this.demoPatients[bill.patientId - 1].id,
        bill.totalAmount,
        bill.paidAmount,
        bill.balance,
        bill.billingDate,
        bill.dueDate,
        bill.status,
        bill.paymentMethod
      ];
      
      await pool.query(query, values);
    }
  }

  async seedInventory() {
    console.log('📦 Seeding inventory...');
    
    for (const item of this.demoInventory) {
      const query = `
        INSERT INTO inventory (
          medication_name, generic_name, manufacturer, batch_number,
          expiry_date, quantity_in_stock, unit_price, reorder_level
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      const values = [
        item.medicationName, item.genericName, item.manufacturer,
        item.batchNumber, item.expiryDate, item.quantityInStock,
        item.unitPrice, item.reorderLevel
      ];
      
      await pool.query(query, values);
    }
  }

  async seedNotifications() {
    console.log('🔔 Seeding notifications...');
    
    const notifications = [
      {
        userId: this.demoUsers[0].id,
        title: 'Welcome to HMIS',
        message: 'Your admin account has been set up successfully. You can now manage the hospital system.',
        type: 'info'
      },
      {
        userId: this.demoUsers[1].id,
        title: 'New Patient Appointment',
        message: 'You have a new appointment scheduled for today at 9:00 AM with Jane Doe.',
        type: 'appointment'
      },
      {
        userId: this.demoUsers[2].id,
        title: 'Lab Results Available',
        message: 'Lab results for Sarah Johnson are now available for review.',
        type: 'info'
      },
      {
        userId: this.demoUsers[3].id,
        title: 'Patient Check-in',
        message: 'Robert Smith has checked in for his 10:30 AM appointment.',
        type: 'checkin'
      }
    ];

    for (const notification of notifications) {
      const query = `
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
      `;
      
      const values = [notification.userId, notification.title, notification.message, notification.type];
      await pool.query(query, values);
    }
  }
}

// Run seeder if called directly
if (require.main === module) {
  const seeder = new DemoDataSeeder();
  seeder.seed()
    .then(() => {
      console.log('🎉 Demo data seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Demo data seeding failed:', error);
      process.exit(1);
    });
}

module.exports = DemoDataSeeder;
