const { Pool } = require('pg');
const { execSync } = require('child_process');

// Test database configuration
const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT) || 5432,
  database: process.env.TEST_DB_NAME || 'hmis_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};

let testDb;

// Setup test database
const setupTestDatabase = async () => {
  try {
    testDb = new Pool(testDbConfig);

    // Test connection
    await testDb.query('SELECT 1');

    // Run schema setup
    const schema = require('../../schema.sql');
    await testDb.query(schema);

    console.log('✅ Test database setup completed');
    return testDb;
  } catch (error) {
    console.error('❌ Test database setup failed:', error.message);
    throw error;
  }
};

// Cleanup test database
const cleanupTestDatabase = async (db) => {
  try {
    if (db) {
      // Clean up test data
      await db.query('DELETE FROM audit_logs');
      await db.query('DELETE FROM notifications');
      await db.query('DELETE FROM stock_movements');
      await db.query('DELETE FROM payments');
      await db.query('DELETE FROM prescriptions');
      await db.query('DELETE FROM medical_records');
      await db.query('DELETE FROM billing');
      await db.query('DELETE FROM appointments');
      await db.query('DELETE FROM inventory');
      await db.query('DELETE FROM patients');
      await db.query('DELETE FROM staff');
      await db.query('DELETE FROM users');

      await db.end();
    }
    console.log('✅ Test database cleanup completed');
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error.message);
    throw error;
  }
};

// Create test user
const createTestUser = async (db, userData = {}) => {
  const defaultData = {
    username: 'testuser',
    email: 'test@example.com',
    password_hash: '$2a$12$test',
    role: 'doctor',
    first_name: 'Test',
    last_name: 'User',
    is_active: true
  };

  const userData_merged = { ...defaultData, ...userData };

  const result = await db.query(`
    INSERT INTO users (username, email, password_hash, role, first_name, last_name, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    userData_merged.username,
    userData_merged.email,
    userData_merged.password_hash,
    userData_merged.role,
    userData_merged.first_name,
    userData_merged.last_name,
    userData_merged.is_active
  ]);

  return result.rows[0];
};

// Create test patient
const createTestPatient = async (db, patientData = {}) => {
  const defaultData = {
    patient_id: 'PAT001',
    date_of_birth: '1990-01-01',
    gender: 'male',
    address: '123 Test St',
    emergency_contact_name: 'Emergency Contact',
    emergency_contact_phone: '+1234567890'
  };

  const patientData_merged = { ...defaultData, ...patientData };

  const result = await db.query(`
    INSERT INTO patients (user_id, patient_id, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    patientData_merged.user_id,
    patientData_merged.patient_id,
    patientData_merged.date_of_birth,
    patientData_merged.gender,
    patientData_merged.address,
    patientData_merged.emergency_contact_name,
    patientData_merged.emergency_contact_phone
  ]);

  return result.rows[0];
};

// Generate JWT token for testing
const generateTestToken = (payload = {}) => {
  const jwt = require('jsonwebtoken');
  const defaultPayload = {
    id: '00000000-0000-0000-0000-000000000000',
    role: 'admin'
  };

  return jwt.sign(
    { ...defaultPayload, ...payload },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase,
  createTestUser,
  createTestPatient,
  generateTestToken,
  testDbConfig
};
