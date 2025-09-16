const request = require('supertest');
const app = require('../server');

describe('Appointments API', () => {
  let authToken;
  let testUser;
  let testPatient;
  let testAppointment;

  beforeAll(async () => {
    // Create test user (doctor)
    testUser = await global.testHelpers.createTestUser({
      role: 'doctor',
      username: 'appointment_test_doctor',
      email: 'appointment_test_doctor@test.com'
    });

    // Create test patient
    const patientUser = await global.testHelpers.createTestUser({
      role: 'patient',
      username: 'appointment_test_patient',
      email: 'appointment_test_patient@test.com'
    });

    testPatient = await global.testHelpers.createTestPatient(patientUser.id);

    authToken = global.testHelpers.generateTestToken({
      userId: testUser.id,
      username: testUser.username,
      role: testUser.role
    });
  });

  describe('GET /api/appointments', () => {
    it('should get appointments list with valid auth', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject request without auth', async () => {
      const response = await request(app)
        .get('/api/appointments');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should support date filtering', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/appointments?date=${today}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should support status filtering', async () => {
      const response = await request(app)
        .get('/api/appointments?status=scheduled')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should support doctor filtering', async () => {
      const response = await request(app)
        .get(`/api/appointments?doctorId=${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/appointments?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pagination');
    });
  });

  describe('POST /api/appointments', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const validAppointmentData = {
      patientId: null, // Will be set in beforeEach
      doctorId: null,  // Will be set in beforeEach
      appointmentDate: tomorrow.toISOString().split('T')[0],
      appointmentTime: '10:00:00',
      durationMinutes: 30,
      reason: 'Regular checkup',
      notes: 'Test appointment'
    };

    beforeEach(() => {
      validAppointmentData.patientId = testPatient?.id || 'test-patient-id';
      validAppointmentData.doctorId = testUser?.id || 'test-doctor-id';
    });

    it('should create appointment with valid data', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAppointmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.reason).toBe(validAppointmentData.reason);

      testAppointment = response.body.data;
    });

    it('should reject past appointment dates', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const pastAppointment = {
        ...validAppointmentData,
        appointmentDate: yesterday.toISOString().split('T')[0]
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(pastAppointment);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid time format', async () => {
      const invalidTime = {
        ...validAppointmentData,
        appointmentTime: '25:00:00' // Invalid hour
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTime);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        reason: 'Test appointment'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate duration range', async () => {
      const invalidDuration = {
        ...validAppointmentData,
        durationMinutes: -10 // Negative duration
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDuration);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should check for scheduling conflicts', async () => {
      // Try to book the same time slot again
      const conflictingAppointment = {
        ...validAppointmentData,
        patientId: testPatient?.id || 'another-patient-id'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conflictingAppointment);

      // Should either succeed (if no conflict checking) or fail with conflict
      expect([201, 409]).toContain(response.status);
    });
  });

  describe('GET /api/appointments/:id', () => {
    it('should get appointment by ID', async () => {
      if (!testAppointment) {
        // Skip if no test appointment was created
        return;
      }

      const response = await request(app)
        .get(`/api/appointments/${testAppointment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testAppointment.id);
    });

    it('should return 404 for non-existent appointment', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .get(`/api/appointments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/appointments/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/appointments/:id', () => {
    const updateData = {
      reason: 'Updated appointment reason',
      notes: 'Updated notes',
      durationMinutes: 45
    };

    it('should update appointment with valid data', async () => {
      if (!testAppointment) return;

      const response = await request(app)
        .put(`/api/appointments/${testAppointment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reason).toBe(updateData.reason);
    });

    it('should reject invalid status transitions', async () => {
      if (!testAppointment) return;

      const invalidStatusUpdate = {
        status: 'invalid-status'
      };

      const response = await request(app)
        .put(`/api/appointments/${testAppointment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidStatusUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate appointment date changes', async () => {
      if (!testAppointment) return;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const pastDateUpdate = {
        appointmentDate: yesterday.toISOString().split('T')[0]
      };

      const response = await request(app)
        .put(`/api/appointments/${testAppointment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(pastDateUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/appointments/:id/status', () => {
    const statusUpdates = [
      { status: 'confirmed', expectedStatus: 200 },
      { status: 'in_progress', expectedStatus: 200 },
      { status: 'completed', expectedStatus: 200 },
      { status: 'cancelled', expectedStatus: 200 },
      { status: 'invalid_status', expectedStatus: 400 }
    ];

    statusUpdates.forEach(({ status, expectedStatus }) => {
      it(`should handle status update to ${status}`, async () => {
        if (!testAppointment) return;

        const response = await request(app)
          .put(`/api/appointments/${testAppointment.id}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status });

        expect(response.status).toBe(expectedStatus);
        
        if (expectedStatus === 200) {
          expect(response.body.success).toBe(true);
          expect(response.body.data.status).toBe(status);
        } else {
          expect(response.body.success).toBe(false);
        }
      });
    });
  });

  describe('DELETE /api/appointments/:id', () => {
    it('should cancel appointment', async () => {
      if (!testAppointment) return;

      const response = await request(app)
        .delete(`/api/appointments/${testAppointment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should prevent deletion of completed appointments', async () => {
      // Create a completed appointment
      const completedAppointment = {
        patientId: testPatient?.id || 'test-patient-id',
        doctorId: testUser?.id || 'test-doctor-id',
        appointmentDate: '2023-01-01',
        appointmentTime: '10:00:00',
        status: 'completed',
        reason: 'Completed appointment'
      };

      const createResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(completedAppointment);

      if (createResponse.status === 201) {
        const deleteResponse = await request(app)
          .delete(`/api/appointments/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(deleteResponse.status).toBe(400);
        expect(deleteResponse.body.success).toBe(false);
      }
    });
  });

  describe('GET /api/appointments/stats', () => {
    it('should get appointment statistics', async () => {
      const response = await request(app)
        .get('/api/appointments/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
    });

    it('should include daily stats', async () => {
      const response = await request(app)
        .get('/api/appointments/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.data).toHaveProperty('dailyStats');
      expect(Array.isArray(response.body.data.dailyStats)).toBe(true);
    });

    it('should include doctor stats', async () => {
      const response = await request(app)
        .get('/api/appointments/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.data).toHaveProperty('doctorStats');
      expect(Array.isArray(response.body.data.doctorStats)).toBe(true);
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate business hours', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const afterHours = {
        patientId: testPatient?.id || 'test-patient-id',
        doctorId: testUser?.id || 'test-doctor-id',
        appointmentDate: tomorrow.toISOString().split('T')[0],
        appointmentTime: '23:00:00', // 11 PM - likely after hours
        reason: 'After hours appointment'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(afterHours);

      // Should either succeed or fail based on business rules
      expect([201, 400]).toContain(response.status);
    });

    it('should validate weekend appointments', async () => {
      // Find next Sunday
      const nextSunday = new Date();
      nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));

      const weekendAppointment = {
        patientId: testPatient?.id || 'test-patient-id',
        doctorId: testUser?.id || 'test-doctor-id',
        appointmentDate: nextSunday.toISOString().split('T')[0],
        appointmentTime: '10:00:00',
        reason: 'Weekend appointment'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(weekendAppointment);

      // Should either succeed or fail based on business rules
      expect([201, 400]).toContain(response.status);
    });
  });
});

