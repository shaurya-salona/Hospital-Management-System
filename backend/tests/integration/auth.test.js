const request = require('supertest');
const app = require('../../server');
const { setupTestDatabase, cleanupTestDatabase } = require('../setup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Authentication Integration Tests', () => {
  let testDb;
  let testUser;

  beforeAll(async () => {
    testDb = await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase(testDb);
  });

  beforeEach(async () => {
    // Create a test user for each test
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    const result = await testDb.query(`
      INSERT INTO users (username, email, password_hash, role, first_name, last_name, is_active)
      VALUES ('testuser', 'test@example.com', $1, 'doctor', 'Test', 'User', true)
      RETURNING *
    `, [hashedPassword]);
    testUser = result.rows[0];
  });

  afterEach(async () => {
    // Clean up test user
    if (testUser) {
      await testDb.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    }
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject inactive user', async () => {
      // Deactivate user
      await testDb.query(
        'UPDATE users SET is_active = false WHERE id = $1',
        [testUser.id]
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Account is inactive');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Get a valid refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid refresh token');
    });

    it('should reject expired refresh token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: testUser.id, type: 'refresh' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken;

    beforeEach(async () => {
      // Get a valid access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should logout with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/auth/logout')
        .expect(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    let accessToken;

    beforeEach(async () => {
      // Get a valid access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.password_hash).toBeUndefined();
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should limit login attempts', async () => {
      const promises = [];

      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'WrongPassword123!'
            })
        );
      }

      const responses = await Promise.all(promises);

      // The last request should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer invalid-token`);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('Token Security', () => {
    it('should not expose sensitive data in tokens', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      const accessToken = loginResponse.body.data.accessToken;

      // Decode token (without verification for testing)
      const decoded = jwt.decode(accessToken);

      expect(decoded.password_hash).toBeUndefined();
      expect(decoded.password).toBeUndefined();
    });

    it('should have appropriate token expiration', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      const accessToken = loginResponse.body.data.accessToken;
      const refreshToken = loginResponse.body.data.refreshToken;

      const accessDecoded = jwt.decode(accessToken);
      const refreshDecoded = jwt.decode(refreshToken);

      // Access token should expire sooner than refresh token
      expect(accessDecoded.exp).toBeLessThan(refreshDecoded.exp);
    });
  });

  describe('Session Management', () => {
    it('should invalidate tokens after logout', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      const accessToken = loginResponse.body.data.accessToken;

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to use the token after logout
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });
});
