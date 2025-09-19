/**
 * Production Database Setup Script
 * Creates all tables and initial data for HMIS production
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

// Database connection
const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// SQL Schema
const schemaSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'patient')),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    patient_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
      phone VARCHAR(20),
      date_of_birth DATE,
      gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    blood_type VARCHAR(5),
    allergies TEXT,
    medical_history TEXT,
    insurance_provider VARCHAR(100),
    insurance_number VARCHAR(50),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff table (doctors, nurses, etc.)
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    staff_id VARCHAR(20) UNIQUE NOT NULL,
    specialization VARCHAR(100),
    license_number VARCHAR(50),
    experience_years INTEGER DEFAULT 0,
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    is_available BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
      status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    reason TEXT,
      notes TEXT,
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical records table
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
      diagnosis TEXT,
      treatment TEXT,
      prescription TEXT,
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    medication_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    duration VARCHAR(50),
    instructions TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_method VARCHAR(20),
    payment_date TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_patient_id ON billing(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_updated_at BEFORE UPDATE ON billing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

// Initial data
const initialDataSQL = async () => {
    const hashedPassword = await bcrypt.hash('admin123', 12);

    return `
-- Insert initial admin user
INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone)
VALUES ('admin', 'admin@hospital.com', '${hashedPassword}', 'admin', 'System', 'Administrator', '+1234567890')
ON CONFLICT (username) DO NOTHING;

-- Insert initial doctor user
INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone)
VALUES ('doctor', 'dr.smith@hospital.com', '${hashedPassword}', 'doctor', 'Dr. John', 'Smith', '+1234567891')
ON CONFLICT (username) DO NOTHING;

-- Insert initial nurse user
INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone)
VALUES ('nurse', 'nurse.jones@hospital.com', '${hashedPassword}', 'nurse', 'Sarah', 'Jones', '+1234567892')
ON CONFLICT (username) DO NOTHING;

-- Insert initial receptionist user
INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone)
VALUES ('receptionist', 'reception.mike@hospital.com', '${hashedPassword}', 'receptionist', 'Mike', 'Johnson', '+1234567893')
ON CONFLICT (username) DO NOTHING;

-- Insert initial pharmacist user
INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone)
VALUES ('pharmacist', 'pharm.wilson@hospital.com', '${hashedPassword}', 'pharmacist', 'Emily', 'Wilson', '+1234567894')
ON CONFLICT (username) DO NOTHING;

-- Insert initial patient user
INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone)
VALUES ('patient', 'patient@hospital.com', '${hashedPassword}', 'patient', 'Jane', 'Doe', '+1234567895')
ON CONFLICT (username) DO NOTHING;

-- Insert staff records
INSERT INTO staff (user_id, staff_id, specialization, license_number, experience_years, consultation_fee)
SELECT u.id, 'DOC000001', 'General Medicine', 'MD123456', 10, 150.00
FROM users u WHERE u.username = 'doctor'
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO staff (user_id, staff_id, specialization, license_number, experience_years, consultation_fee)
SELECT u.id, 'NUR000001', 'General Nursing', 'RN123456', 5, 0.00
FROM users u WHERE u.username = 'nurse'
ON CONFLICT (staff_id) DO NOTHING;

-- Insert patient record
INSERT INTO patients (user_id, patient_id, first_name, last_name, email, phone, date_of_birth, gender, address, blood_type, allergies, medical_history, emergency_contact_name, emergency_contact_phone)
SELECT u.id, 'PAT000001', 'Jane', 'Doe', 'patient@hospital.com', '+1234567895', '1990-01-01', 'female', '123 Main St, City, State 12345', 'O+', 'None', 'No significant history', 'John Doe', '+1234567893'
FROM users u WHERE u.username = 'patient'
ON CONFLICT (patient_id) DO NOTHING;
`;
};

// Main setup function
async function setupDatabase() {
    const client = await pool.connect();

    try {
        console.log('🗄️ Setting up production database...');

        // Create schema
        console.log('📋 Creating database schema...');
        await client.query(schemaSQL);
        console.log('✅ Schema created successfully');

        // Insert initial data
        console.log('👥 Inserting initial data...');
        const initialData = await initialDataSQL();
        await client.query(initialData);
        console.log('✅ Initial data inserted successfully');

        // Verify setup
        console.log('🧪 Verifying database setup...');
        const userCount = await client.query('SELECT COUNT(*) FROM users');
        const patientCount = await client.query('SELECT COUNT(*) FROM patients');
        const staffCount = await client.query('SELECT COUNT(*) FROM staff');

        console.log(`📊 Database setup complete:`);
        console.log(`   Users: ${userCount.rows[0].count}`);
        console.log(`   Patients: ${patientCount.rows[0].count}`);
        console.log(`   Staff: ${staffCount.rows[0].count}`);

        console.log('🎉 Production database setup completed successfully!');

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run setup if called directly
if (require.main === module) {
    setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };
