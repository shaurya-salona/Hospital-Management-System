#!/usr/bin/env node

/**
 * Database Seeding Script for HMIS
 * Populates the database with demo data for testing and development
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'hmis_db',
  user: process.env.DB_USER || 'hmis_user',
  password: process.env.DB_PASSWORD || 'secure_password_change_me',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

const pool = new Pool(dbConfig);

// Demo data
const demoUsers = [
  {
    username: 'admin',
    email: 'admin@hospital.com',
    password: 'admin123',
    first_name: 'System',
    last_name: 'Administrator',
    role: 'admin',
    phone: '+1234567890'
  },
  {
    username: 'doctor',
    email: 'dr.smith@hospital.com',
    password: 'doctor123',
    first_name: 'Dr. John',
    last_name: 'Smith',
    role: 'doctor',
    phone: '+1234567891'
  },
  {
    username: 'nurse',
    email: 'nurse.jones@hospital.com',
    password: 'nurse123',
    first_name: 'Sarah',
    last_name: 'Jones',
    role: 'nurse',
    phone: '+1234567892'
  },
  {
    username: 'receptionist',
    email: 'reception.mike@hospital.com',
    password: 'receptionist123',
    first_name: 'Mike',
    last_name: 'Johnson',
    role: 'receptionist',
    phone: '+1234567893'
  },
  {
    username: 'pharmacist',
    email: 'pharm.wilson@hospital.com',
    password: 'pharmacist123',
    first_name: 'Emily',
    last_name: 'Wilson',
    role: 'pharmacist',
    phone: '+1234567894'
  },
  {
    username: 'patient',
    email: 'patient@hospital.com',
    password: 'patient123',
    first_name: 'Jane',
    last_name: 'Doe',
    role: 'patient',
    phone: '+1234567895'
  }
];

const demoStaff = [
  {
    employee_id: 'EMP001',
    department: 'Administration',
    specialization: 'System Administration',
    license_number: 'ADMIN001',
    hire_date: '2020-01-01',
    salary: 75000.00
  },
  {
    employee_id: 'EMP002',
    department: 'Cardiology',
    specialization: 'Cardiologist',
    license_number: 'MD123456',
    hire_date: '2018-06-15',
    salary: 120000.00
  },
  {
    employee_id: 'EMP003',
    department: 'Nursing',
    specialization: 'Registered Nurse',
    license_number: 'RN789012',
    hire_date: '2019-03-10',
    salary: 65000.00
  },
  {
    employee_id: 'EMP004',
    department: 'Reception',
    specialization: 'Front Desk',
    license_number: 'REC001',
    hire_date: '2020-09-01',
    salary: 45000.00
  },
  {
    employee_id: 'EMP005',
    department: 'Pharmacy',
    specialization: 'Pharmacist',
    license_number: 'PHARM001',
    hire_date: '2019-11-20',
    salary: 85000.00
  }
];

const demoPatients = [
  {
    patient_id: 'PAT000001',
    date_of_birth: '1985-05-15',
    gender: 'female',
    blood_type: 'O+',
    emergency_contact_name: 'John Doe',
    emergency_contact_phone: '+1234567893',
    address: '123 Main St, City, State 12345',
    allergies: 'penicillin',
    medical_history: 'No significant history'
  }
];

const demoDoctors = [
  {
    doctor_id: 'DOC000001',
    specialization: 'Cardiology',
    license_number: 'MD123456',
    experience_years: 10,
    consultation_fee: 150.00,
    is_available: true
  }
];

const demoAppointments = [
  {
    appointment_date: '2024-01-15',
    appointment_time: '10:00:00',
    duration_minutes: 30,
    reason: 'Regular checkup',
    status: 'scheduled',
    priority: 'normal'
  }
];

const demoInventory = [
  {
    item_name: 'Paracetamol 500mg',
    category: 'Pain Relief',
    description: 'Pain relief medication',
    quantity: 100,
    unit_price: 0.50,
    supplier: 'MedSupply Inc',
    expiry_date: '2025-12-31',
    status: 'available'
  },
  {
    item_name: 'Bandages',
    category: 'Medical Supplies',
    description: 'Sterile bandages',
    quantity: 50,
    unit_price: 2.00,
    supplier: 'MedSupply Inc',
    expiry_date: '2026-06-30',
    status: 'available'
  },
  {
    item_name: 'Syringes 5ml',
    category: 'Medical Equipment',
    description: 'Disposable syringes',
    quantity: 200,
    unit_price: 0.25,
    supplier: 'MedSupply Inc',
    expiry_date: '2025-08-15',
    status: 'available'
  }
];

// Helper function to hash passwords
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Helper function to execute queries
async function executeQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error('Query execution error:', error.message);
    throw error;
  }
}

// Check if data already exists
async function checkExistingData() {
  try {
    const userCount = await executeQuery('SELECT COUNT(*) FROM users');
    return parseInt(userCount.rows[0].count) > 0;
  } catch (error) {
    console.error('Error checking existing data:', error.message);
    return false;
  }
}

// Seed users
async function seedUsers() {
  console.log('🌱 Seeding users...');

  for (const user of demoUsers) {
    try {
      const hashedPassword = await hashPassword(user.password);

      const query = `
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (username) DO NOTHING
        RETURNING id
      `;

      const result = await executeQuery(query, [
        user.username,
        user.email,
        hashedPassword,
        user.first_name,
        user.last_name,
        user.role,
        user.phone
      ]);

      if (result.rows.length > 0) {
        console.log(`✅ User created: ${user.username}`);
      } else {
        console.log(`⚠️ User already exists: ${user.username}`);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${user.username}:`, error.message);
    }
  }
}

// Seed staff
async function seedStaff() {
  console.log('🌱 Seeding staff...');

  // Get user IDs for staff roles
  const staffRoles = ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist'];
  const staffUsers = await executeQuery(
    'SELECT id, role FROM users WHERE role = ANY($1) ORDER BY role',
    [staffRoles]
  );

  for (let i = 0; i < staffUsers.rows.length && i < demoStaff.length; i++) {
    const user = staffUsers.rows[i];
    const staffData = demoStaff[i];

    try {
      const query = `
        INSERT INTO staff (user_id, employee_id, department, specialization, license_number, hire_date, salary)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (employee_id) DO NOTHING
      `;

      await executeQuery(query, [
        user.id,
        staffData.employee_id,
        staffData.department,
        staffData.specialization,
        staffData.license_number,
        staffData.hire_date,
        staffData.salary
      ]);

      console.log(`✅ Staff created: ${staffData.employee_id}`);
    } catch (error) {
      console.error(`❌ Error creating staff ${staffData.employee_id}:`, error.message);
    }
  }
}

// Seed patients
async function seedPatients() {
  console.log('🌱 Seeding patients...');

  // Get patient user ID
  const patientUser = await executeQuery('SELECT id FROM users WHERE role = $1', ['patient']);

  if (patientUser.rows.length > 0) {
    const patientData = demoPatients[0];

    try {
      const query = `
        INSERT INTO patients (user_id, patient_id, date_of_birth, gender, blood_type,
                            emergency_contact_name, emergency_contact_phone, address,
                            allergies, medical_history)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (patient_id) DO NOTHING
      `;

      await executeQuery(query, [
        patientUser.rows[0].id,
        patientData.patient_id,
        patientData.date_of_birth,
        patientData.gender,
        patientData.blood_type,
        patientData.emergency_contact_name,
        patientData.emergency_contact_phone,
        patientData.address,
        patientData.allergies,
        patientData.medical_history
      ]);

      console.log(`✅ Patient created: ${patientData.patient_id}`);
    } catch (error) {
      console.error(`❌ Error creating patient:`, error.message);
    }
  }
}

// Seed doctors
async function seedDoctors() {
  console.log('🌱 Seeding doctors...');

  // Get doctor user ID
  const doctorUser = await executeQuery('SELECT id FROM users WHERE role = $1', ['doctor']);

  if (doctorUser.rows.length > 0) {
    const doctorData = demoDoctors[0];

    try {
      const query = `
        INSERT INTO doctors (user_id, doctor_id, specialization, license_number,
                           experience_years, consultation_fee, is_available)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (doctor_id) DO NOTHING
      `;

      await executeQuery(query, [
        doctorUser.rows[0].id,
        doctorData.doctor_id,
        doctorData.specialization,
        doctorData.license_number,
        doctorData.experience_years,
        doctorData.consultation_fee,
        doctorData.is_available
      ]);

      console.log(`✅ Doctor created: ${doctorData.doctor_id}`);
    } catch (error) {
      console.error(`❌ Error creating doctor:`, error.message);
    }
  }
}

// Seed appointments
async function seedAppointments() {
  console.log('🌱 Seeding appointments...');

  // Get patient and doctor IDs
  const patient = await executeQuery('SELECT id FROM patients LIMIT 1');
  const doctor = await executeQuery('SELECT id FROM doctors LIMIT 1');

  if (patient.rows.length > 0 && doctor.rows.length > 0) {
    const appointmentData = demoAppointments[0];

    try {
      const query = `
        INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time,
                                duration_minutes, reason, status, priority)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await executeQuery(query, [
        patient.rows[0].id,
        doctor.rows[0].id,
        appointmentData.appointment_date,
        appointmentData.appointment_time,
        appointmentData.duration_minutes,
        appointmentData.reason,
        appointmentData.status,
        appointmentData.priority
      ]);

      console.log(`✅ Appointment created`);
    } catch (error) {
      console.error(`❌ Error creating appointment:`, error.message);
    }
  }
}

// Seed inventory
async function seedInventory() {
  console.log('🌱 Seeding inventory...');

  for (const item of demoInventory) {
    try {
      const query = `
        INSERT INTO inventory (item_name, category, description, quantity, unit_price,
                             supplier, expiry_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      `;

      await executeQuery(query, [
        item.item_name,
        item.category,
        item.description,
        item.quantity,
        item.unit_price,
        item.supplier,
        item.expiry_date,
        item.status
      ]);

      console.log(`✅ Inventory item created: ${item.item_name}`);
    } catch (error) {
      console.error(`❌ Error creating inventory item ${item.item_name}:`, error.message);
    }
  }
}

// Main seeding function
async function seedDatabase() {
  console.log('🚀 Starting database seeding...');

  try {
    // Check if data already exists
    const hasData = await checkExistingData();
    if (hasData) {
      console.log('⚠️ Database already contains data. Skipping seeding.');
      return;
    }

    // Seed data in order
    await seedUsers();
    await seedStaff();
    await seedPatients();
    await seedDoctors();
    await seedAppointments();
    await seedInventory();

    console.log('✅ Database seeding completed successfully!');

    // Display login credentials
    console.log('\n📋 Demo Login Credentials:');
    console.log('========================');
    demoUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.username} / ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };

