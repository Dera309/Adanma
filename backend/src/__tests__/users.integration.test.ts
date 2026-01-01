import request from 'supertest';

const baseURL = 'http://localhost:5000';

describe('Users Integration Tests', () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    // Register and login a user for authenticated tests
    const registerResponse = await request(baseURL)
      .post('/api/auth/register/email')
      .send({
        email: 'profile-test@example.com',
        password: 'TestPassword123!',
        roles: ['BUYER']
      });

    userId = registerResponse.body.data.userId;

    const loginResponse = await request(baseURL)
      .post('/api/auth/login')
      .send({
        email: 'profile-test@example.com',
        password: 'TestPassword123!'
      });

    accessToken = loginResponse.body.data.accessToken;
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile when authenticated', async () => {
      const response = await request(baseURL)
        .get('/api/users/profile')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', userId);
      expect(response.body.data).toHaveProperty('email', 'profile-test@example.com');
      expect(response.body.data).toHaveProperty('roles');
      expect(response.body.data).toHaveProperty('addresses');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(baseURL)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile when authenticated', async () => {
      const response = await request(baseURL)
        .put('/api/users/profile')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          email: 'updated-profile@example.com'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('email', 'updated-profile@example.com');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(baseURL)
        .put('/api/users/profile')
        .send({
          email: 'unauthorized@example.com'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/users/role', () => {
    it('should update user roles when authenticated', async () => {
      const response = await request(baseURL)
        .patch('/api/users/role')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          roles: ['BUYER', 'VENDOR']
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.roles).toContain('BUYER');
      expect(response.body.data.roles).toContain('VENDOR');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(baseURL)
        .patch('/api/users/role')
        .send({
          roles: ['BUYER']
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
});