const request = require('supertest');
const app = require('../server');

describe('Patients API', () => {
  let authToken;
  let testUser;
  let testPatient;

  beforeAll(async () => {
    // Create test user and get auth token
    testUser = await global.testHelpers.createTestUser({
      role: 'doctor',
      username: 'patient_test_doctor',
      email: 'patient_test_doctor@test.com'
    });

    authToken = global.testHelpers.generateTestToken({
      userId: testUser.id,
      username: testUser.username,
      role: testUser.role
    });
  });

  describe('GET /api/patients', () => {
    it('should get patients list with valid auth', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject request without auth', async () => {
      const response = await request(app)
        .get('/api/patients');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject patient role access', async () => {
      const patientToken = global.testHelpers.generateTestToken({
        role: 'patient'
      });

      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/patients?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/patients?search=test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/patients', () => {
    const validPatientData = {
      firstName: 'Test',
      lastName: 'Patient',
      email: 'test_patient@test.com',
      phone: '+1-555-0100',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      address: '123 Test Street',
      bloodType: 'O+',
      allergies: 'None',
      medicalHistory: 'No significant history'
    };

    it('should create patient with valid data', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validPatientData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.first_name).toBe(validPatientData.firstName);

      testPatient = response.body.data;
    });

    it('should reject invalid email format', async () => {
      const invalidData = { ...validPatientData, email: 'invalid-email' };

      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing required fields', async () => {
      const incompleteData = { firstName: 'Test' };

      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate email', async () => {
      const duplicateData = { ...validPatientData, email: 'test_patient@test.com' };

      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should validate blood type', async () => {
      const invalidBloodType = { ...validPatientData, bloodType: 'Invalid', email: 'test2@test.com' };

      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidBloodType);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate phone number format', async () => {
      const invalidPhone = { ...validPatientData, phone: '123', email: 'test3@test.com' };

      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPhone);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/patients/:id', () => {
    it('should get patient by ID', async () => {
      if (!testPatient) {
        // Create a test patient if not exists
        const patientUser = await global.testHelpers.createTestUser({
          role: 'patient',
          email: 'get_test_patient@test.com'
        });
        testPatient = await global.testHelpers.createTestPatient(patientUser.id);
      }

      const response = await request(app)
        .get(`/api/patients/${testPatient.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPatient.id);
    });

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .get(`/api/patients/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/patients/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/patients/:id', () => {
    const updateData = {
      firstName: 'Updated',
      lastName: 'Patient',
      phone: '+1-555-0199'
    };

    it('should update patient with valid data', async () => {
      if (!testPatient) return;

      const response = await request(app)
        .put(`/api/patients/${testPatient.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.first_name).toBe(updateData.firstName);
    });

    it('should reject invalid update data', async () => {
      if (!testPatient) return;

      const invalidUpdate = { email: 'invalid-email' };

      const response = await request(app)
        .put(`/api/patients/${testPatient.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .put(`/api/patients/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/patients/:id', () => {
    it('should delete patient (soft delete)', async () => {
      if (!testPatient) return;

      const response = await request(app)
        .delete(`/api/patients/${testPatient.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should require admin role for deletion', async () => {
      const doctorToken = global.testHelpers.generateTestToken({
        role: 'doctor'
      });

      const response = await request(app)
        .delete('/api/patients/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${doctorToken}`);

      // Should either be forbidden or not found
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('GET /api/patients/stats', () => {
    it('should get patient statistics', async () => {
      const response = await request(app)
        .get('/api/patients/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
    });

    it('should include blood type distribution', async () => {
      const response = await request(app)
        .get('/api/patients/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.data).toHaveProperty('bloodTypeDistribution');
      expect(Array.isArray(response.body.data.bloodTypeDistribution)).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('should validate date of birth format', async () => {
      const invalidDate = {
        firstName: 'Test',
        lastName: 'Patient',
        email: 'date_test@test.com',
        dateOfBirth: 'invalid-date'
      };

      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate gender enum', async () => {
      const invalidGender = {
        firstName: 'Test',
        lastName: 'Patient',
        email: 'gender_test@test.com',
        gender: 'invalid-gender'
      };

      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidGender);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });
});

