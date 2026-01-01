import request from 'supertest';

const baseURL = 'http://localhost:5000';

describe('Authentication Integration Tests', () => {
  describe('POST /api/auth/register/email', () => {
    it('should register a user with valid email and password', async () => {
      const response = await request(baseURL)
        .post('/api/auth/register/email')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          roles: ['BUYER']
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(baseURL)
        .post('/api/auth/register/email')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
          roles: ['BUYER']
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(baseURL)
        .post('/api/auth/register/email')
        .send({
          email: 'test@example.com',
          password: 'weak',
          roles: ['BUYER']
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 for existing email', async () => {
      // First registration
      await request(baseURL)
        .post('/api/auth/register/email')
        .send({
          email: 'existing@example.com',
          password: 'TestPassword123!',
          roles: ['BUYER']
        })
        .expect(201);

      // Second registration with same email
      const response = await request(baseURL)
        .post('/api/auth/register/email')
        .send({
          email: 'existing@example.com',
          password: 'TestPassword123!',
          roles: ['BUYER']
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/register/phone', () => {
    it('should register a user with valid phone and password', async () => {
      const response = await request(baseURL)
        .post('/api/auth/register/phone')
        .send({
          phoneNumber: '+2348012345678',
          password: 'TestPassword123!',
          roles: ['BUYER']
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('phoneNumber', '+2348012345678');
    });

    it('should return 400 for invalid phone format', async () => {
      const response = await request(baseURL)
        .post('/api/auth/register/phone')
        .send({
          phoneNumber: 'invalid-phone',
          password: 'TestPassword123!',
          roles: ['BUYER']
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Register a user for login tests
      await request(baseURL)
        .post('/api/auth/register/email')
        .send({
          email: 'login-test@example.com',
          password: 'TestPassword123!',
          roles: ['BUYER']
        });
    });

    it('should login with correct email and password', async () => {
      const response = await request(baseURL)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(baseURL)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(baseURL)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Register and login a user
      await request(baseURL)
        .post('/api/auth/register/email')
        .send({
          email: 'logout-test@example.com',
          password: 'TestPassword123!',
          roles: ['BUYER']
        });

      const loginResponse = await request(baseURL)
        .post('/api/auth/login')
        .send({
          email: 'logout-test@example.com',
          password: 'TestPassword123!'
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(baseURL)
        .post('/api/auth/logout')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/password/reset-request', () => {
    beforeAll(async () => {
      // Register a user for password reset tests
      await request(baseURL)
        .post('/api/auth/register/email')
        .send({
          email: 'reset-test@example.com',
          password: 'TestPassword123!',
          roles: ['BUYER']
        });
    });

    it('should request password reset for valid email', async () => {
      const response = await request(baseURL)
        .post('/api/auth/password/reset-request')
        .send({
          email: 'reset-test@example.com'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(baseURL)
        .post('/api/auth/password/reset-request')
        .send({
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/sessions', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Register and login a user
      await request(baseURL)
        .post('/api/auth/register/email')
        .send({
          email: 'sessions-test@example.com',
          password: 'TestPassword123!',
          roles: ['BUYER']
        });

      const loginResponse = await request(baseURL)
        .post('/api/auth/login')
        .send({
          email: 'sessions-test@example.com',
          password: 'TestPassword123!'
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should get user sessions when authenticated', async () => {
      const response = await request(baseURL)
        .get('/api/auth/sessions')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(baseURL)
        .get('/api/auth/sessions')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/auth/sessions/:sessionId', () => {
    let accessToken: string;
    let sessionId: string;

    beforeAll(async () => {
      // Register and login a user
      await request(baseURL)
        .post('/api/auth/register/email')
        .send({
          email: 'terminate-session-test@example.com',
          password: 'TestPassword123!',
          roles: ['BUYER']
        });

      const loginResponse = await request(baseURL)
        .post('/api/auth/login')
        .send({
          email: 'terminate-session-test@example.com',
          password: 'TestPassword123!'
        });

      accessToken = loginResponse.body.data.accessToken;

      // Get sessions to find a session ID
      const sessionsResponse = await request(baseURL)
        .get('/api/auth/sessions')
        .set('Cookie', [`accessToken=${accessToken}`]);

      sessionId = sessionsResponse.body.data[0].id;
    });

    it('should terminate a session when authenticated', async () => {
      const response = await request(baseURL)
        .delete(`/api/auth/sessions/${sessionId}`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(baseURL)
        .delete(`/api/auth/sessions/${sessionId}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
});