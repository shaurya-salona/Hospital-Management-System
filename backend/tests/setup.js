const { Pool } = require('pg');

// Test database configuration
const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'hmis_test_db',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password'
};

// Global test pool
global.testPool = new Pool(testDbConfig);

// Setup before all tests
beforeAll(async () => {
  try {
    // Test database connection
    await global.testPool.query('SELECT 1');
    console.log('✅ Test database connected successfully');
    
    // Clean up test data before running tests
    await cleanupTestData();
    
  } catch (error) {
    console.error('❌ Test database connection failed:', error.message);
    console.log('🔄 Falling back to demo mode for tests');
    
    // Use demo mode if database is not available
    process.env.USE_DEMO_MODE = 'true';
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    if (global.testPool && !process.env.USE_DEMO_MODE) {
      await cleanupTestData();
      await global.testPool.end();
    }
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
});

// Clean up test data
async function cleanupTestData() {
  if (process.env.USE_DEMO_MODE) return;
  
  try {
    // Delete test data in proper order (respecting foreign key constraints)
    const cleanupQueries = [
      "DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%')",
      "DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%')",
      "DELETE FROM billing WHERE patient_id IN (SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%'))",
      "DELETE FROM prescriptions WHERE patient_id IN (SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%'))",
      "DELETE FROM medical_records WHERE patient_id IN (SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%'))",
      "DELETE FROM appointments WHERE patient_id IN (SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%'))",
      "DELETE FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%')",
      "DELETE FROM staff WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%')",
      "DELETE FROM users WHERE email LIKE '%test%'"
    ];
    
    for (const query of cleanupQueries) {
      await global.testPool.query(query);
    }
    
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

// Test helper functions
global.testHelpers = {
  // Create test user
  createTestUser: async (userData = {}) => {
    const bcrypt = require('bcryptjs');
    const defaultUser = {
      username: 'testuser_' + Date.now(),
      email: `test_${Date.now()}@test.com`,
      password_hash: await bcrypt.hash('admin123', 10), // Hash the test password
      role: 'doctor',
      first_name: 'Test',
      last_name: 'User',
      phone: '+1-555-0199',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const user = { ...defaultUser, ...userData };
    
    if (process.env.USE_DEMO_MODE) {
      // Add to demo data for consistency
      const demoDb = require('../config/demo-database');
      const userId = 'test-user-' + Date.now();
      const newUser = { id: userId, ...user };
      demoDb.demoData.users.push(newUser);
      return newUser;
    }
    
    const query = `
      INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await global.testPool.query(query, [
      user.username, user.email, user.password_hash, user.role,
      user.first_name, user.last_name, user.phone
    ]);
    
    return result.rows[0];
  },
  
  // Create test patient
  createTestPatient: async (userId, patientData = {}) => {
    const defaultPatient = {
      patient_id: 'TEST_' + Date.now(),
      first_name: 'Test',
      last_name: 'Patient',
      email: `testpatient_${Date.now()}@test.com`,
      phone: '+1-555-0199',
      date_of_birth: '1990-01-01',
      gender: 'male',
      address: '123 Test St',
      blood_type: 'O+',
      allergies: 'None',
      medical_history: 'Test history',
      insurance_provider: 'Test Insurance',
      insurance_number: 'TEST123456',
      emergency_contact_name: 'Emergency Contact',
      emergency_contact_phone: '+1-555-0198',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const patient = { ...defaultPatient, ...patientData };
    
    if (process.env.USE_DEMO_MODE) {
      // Add to demo data for consistency
      const demoDb = require('../config/demo-database');
      const patientId = 'test-patient-' + Date.now();
      const newPatient = { id: patientId, user_id: userId, ...patient };
      demoDb.demoData.patients.push(newPatient);
      return newPatient;
    }
    
    const query = `
      INSERT INTO patients (user_id, patient_id, date_of_birth, gender, address, blood_type, allergies, medical_history)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await global.testPool.query(query, [
      userId, patient.patient_id, patient.date_of_birth, patient.gender,
      patient.address, patient.blood_type, patient.allergies, patient.medical_history
    ]);
    
    return result.rows[0];
  },
  
  // Generate JWT token for testing
  generateTestToken: (userData = {}) => {
    const jwt = require('jsonwebtoken');
    const defaultPayload = {
      userId: 'test-user-id',
      username: 'testuser',
      role: 'doctor'
    };
    
    return jwt.sign(
      { ...defaultPayload, ...userData },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  }
};

// Global test timeout
jest.setTimeout(10000);

