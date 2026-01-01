import request from 'supertest';
import app from '../index'; // Import the Express app

const baseURL = 'http://localhost:5000';

describe('Addresses Integration Tests', () => {
  let accessToken: string;
  let userId: string;
  let addressId: string;
  let cookie: string; // Store the actual Set-Cookie header for reuse

  beforeAll(async () => {
    // Register a new user
    const registerResponse = await request(baseURL)
      .post('/api/auth/register/email')
      .send({
        email: 'address-test@example.com',
        password: 'TestPassword123!',
        roles: ['BUYER']
      });

    expect(registerResponse.body.success).toBe(true);
    userId = registerResponse.body.data.userId;

    // Login
    const loginResponse = await request(baseURL)
      .post('/api/auth/login')
      .send({
        email: 'address-test@example.com',
        password: 'TestPassword123!'
      });

    expect(loginResponse.body.success).toBe(true);
    accessToken = loginResponse.body.data.accessToken;

    // Extract the actual cookie (recommended way)
    const setCookieHeader = loginResponse.headers['set-cookie'];
    cookie = setCookieHeader ? setCookieHeader[0] : `accessToken=${accessToken}`;
  });

  // Helper to make authenticated requests using the real cookie
  const authRequest = () => request(baseURL).set('Cookie', cookie);

  describe('GET /api/addresses', () => {
    it('should get user addresses when authenticated', async () => {
      const response = await authRequest()
        .get('/api/addresses')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(baseURL)
        .get('/api/addresses')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/addresses', () => {
    it('should create a new address when authenticated', async () => {
      const response = await authRequest()
        .post('/api/addresses')
        .send({
          country: 'NIGERIA',
          region: 'Lagos',
          subRegion: 'Lagos Mainland',
          city: 'Lagos',
          streetAddress: '123 Test Street',
          postalCode: '100001',
          isPrimary: true
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.country).toBe('NIGERIA');
      expect(response.body.data.streetAddress).toBe('123 Test Street');

      addressId = response.body.data.id;
    });

    it('should return 401 when not authenticated', async () => {
      await request(baseURL)
        .post('/api/addresses')
        .send({
          country: 'NIGERIA',
          region: 'Lagos',
          city: 'Lagos',
          streetAddress: '123 Test Street'
        })
        .expect(401);
    });

    it('should return 400 for invalid country', async () => {
      await authRequest()
        .post('/api/addresses')
        .send({
          country: 'INVALID_COUNTRY',
          region: 'Test Region',
          city: 'Test City',
          streetAddress: '123 Test Street'
        })
        .expect(400);
    });
  });

  describe('PUT /api/addresses/:id', () => {
    it('should update an address when authenticated and owner', async () => {
      const response = await authRequest()
        .put(`/api/addresses/${addressId}`)
        .send({
          streetAddress: '456 Updated Street'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.streetAddress).toBe('456 Updated Street');
    });

    it('should return 401 when not authenticated', async () => {
      await request(baseURL)
        .put(`/api/addresses/${addressId}`)
        .send({ streetAddress: '456 Updated Street' })
        .expect(401);
    });
  });

  describe('PATCH /api/addresses/:id/set-primary', () => {
    it('should set address as primary when authenticated and owner', async () => {
      const response = await authRequest()
        .patch(`/api/addresses/${addressId}/set-primary`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isPrimary).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      await request(baseURL)
        .patch(`/api/addresses/${addressId}/set-primary`)
        .expect(401);
    });
  });

  describe('DELETE /api/addresses/:id', () => {
    it('should delete an address when authenticated and owner', async () => {
      await authRequest()
        .delete(`/api/addresses/${addressId}`)
        .expect(200);
    });

    it('should return 401 when not authenticated', async () => {
      await request(baseURL)
        .delete(`/api/addresses/${addressId}`)
        .expect(401);
    });
  });

  describe('GET /api/addresses/regions/:country', () => {
    it('should get regions for a valid country', async () => {
      const response = await request(baseURL)
        .get('/api/addresses/regions/NIGERIA')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 400 for invalid country', async () => {
      await request(baseURL)
        .get('/api/addresses/regions/INVALID_COUNTRY')
        .expect(400);
    });
  });
});