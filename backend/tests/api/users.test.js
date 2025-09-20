const request = require('supertest');
const app = require('../../server');
const { setupTestDatabase, cleanupTestDatabase } = require('../setup');
const jwt = require('jsonwebtoken');

describe('Users API', () => {
  let testDb;
  let adminToken;
  let doctorToken;
  let testUser;

  beforeAll(async () => {
    testDb = await setupTestDatabase();

    // Create test admin user
    const adminUser = await testDb.query(`
      INSERT INTO users (username, email, password_hash, role, first_name, last_name, is_active)
      VALUES ('admin_test', 'admin@test.com', '$2a$12$test', 'admin', 'Admin', 'Test', true)
      RETURNING *
    `);

    // Create test doctor user
    const doctorUser = await testDb.query(`
      INSERT INTO users (username, email, password_hash, role, first_name, last_name, is_active)
      VALUES ('doctor_test', 'doctor@test.com', '$2a$12$test', 'doctor', 'Doctor', 'Test', true)
      RETURNING *
    `);

    // Generate JWT tokens
    adminToken = jwt.sign(
      { id: adminUser.rows[0].id, role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    doctorToken = jwt.sign(
      { id: doctorUser.rows[0].id, role: 'doctor' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await cleanupTestDatabase(testDb);
  });

  beforeEach(async () => {
    // Create a test user for each test
    const result = await testDb.query(`
      INSERT INTO users (username, email, password_hash, role, first_name, last_name, is_active)
      VALUES ('test_user', 'test@example.com', '$2a$12$test', 'nurse', 'Test', 'User', true)
      RETURNING *
    `);
    testUser = result.rows[0];
  });

  afterEach(async () => {
    // Clean up test user
    if (testUser) {
      await testDb.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    }
  });

  describe('GET /api/users', () => {
    it('should get all users for admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(user => user.role === 'admin')).toBe(true);
    });

    it('should filter users by active status', async () => {
      const response = await request(app)
        .get('/api/users?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(user => user.is_active === true)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });

    it('should require admin role', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(testUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/users/${testUser.id}`)
        .expect(401);
    });
  });

  describe('POST /api/users', () => {
    const validUserData = {
      firstName: 'New',
      lastName: 'User',
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      role: 'nurse',
      phone: '+1234567890'
    };

    it('should create new user with valid data', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(validUserData.email);
      expect(response.body.data.role).toBe(validUserData.role);
      expect(response.body.data.password_hash).toBeUndefined(); // Should not return password
    });

    it('should validate required fields', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.email;

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate email format', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate role', async () => {
      const invalidData = { ...validUserData, role: 'invalid-role' };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent duplicate emails', async () => {
      const duplicateData = { ...validUserData, email: 'admin@test.com' };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should require admin role', async () => {
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(validUserData)
        .expect(403);
    });
  });

  describe('PUT /api/users/:id', () => {
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      phone: '+9876543210'
    };

    it('should update user with valid data', async () => {
      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.first_name).toBe(updateData.firstName);
      expect(response.body.data.last_name).toBe(updateData.lastName);
    });

    it('should validate email format on update', async () => {
      const invalidData = { email: 'invalid-email' };

      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .put(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should soft delete user', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user is soft deleted
      const deletedUser = await testDb.query(
        'SELECT is_active FROM users WHERE id = $1',
        [testUser.id]
      );
      expect(deletedUser.rows[0].is_active).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should require admin role', async () => {
      await request(app)
        .delete(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(403);
    });
  });

  describe('Pagination', () => {
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(0);
      expect(response.body.pagination.pages).toBeGreaterThanOrEqual(0);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users?page=0&limit=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // This test would require mocking the database to simulate errors
      // For now, we'll test with invalid UUID format
      const response = await request(app)
        .get('/api/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
