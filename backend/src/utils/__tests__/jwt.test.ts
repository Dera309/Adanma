import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateTokenPair,
  JWTPayload
} from '../jwt';

// Mock environment variables
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    JWT_ACCESS_SECRET: 'test-access-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_ACCESS_EXPIRATION: '15m',
    JWT_REFRESH_EXPIRATION: '30d'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('JWT Utility', () => {
  const mockPayload: Omit<JWTPayload, 'type'> = {
    userId: 'user-123',
    email: 'test@example.com',
    roles: ['buyer'],
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct payload in token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.roles).toEqual(mockPayload.roles);
      expect(decoded.type).toBe('access');
    });

    it('should include issuer and audience', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.iss).toBe('african-ecommerce');
      expect(decoded.aud).toBe('african-ecommerce-users');
    });

    it('should throw error if JWT_ACCESS_SECRET is not configured', () => {
      const originalSecret = process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_ACCESS_SECRET;
      
      expect(() => generateAccessToken(mockPayload)).toThrow('JWT_ACCESS_SECRET is not configured');
      
      process.env.JWT_ACCESS_SECRET = originalSecret;
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload in token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.roles).toEqual(mockPayload.roles);
      expect(decoded.type).toBe('refresh');
    });

    it('should throw error if JWT_REFRESH_SECRET is not configured', () => {
      const originalSecret = process.env.JWT_REFRESH_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      
      expect(() => generateRefreshToken(mockPayload)).toThrow('JWT_REFRESH_SECRET is not configured');
      
      process.env.JWT_REFRESH_SECRET = originalSecret;
    });
  });

  describe('verifyToken', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyToken(token, 'access');
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.type).toBe('access');
    });

    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyToken(token, 'refresh');
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.type).toBe('refresh');
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token', 'access')).toThrow('Invalid token');
    });

    it('should throw error for wrong token type', () => {
      const accessToken = generateAccessToken(mockPayload);
      
      expect(() => verifyToken(accessToken, 'refresh')).toThrow('Invalid token type');
    });

    it('should throw error for expired token', () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        { ...mockPayload, type: 'access' },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: '0s', issuer: 'african-ecommerce', audience: 'african-ecommerce-users' }
      );
      
      // Wait a bit to ensure expiration
      setTimeout(() => {
        expect(() => verifyToken(expiredToken, 'access')).toThrow('Token expired');
      }, 100);
    });

    it('should throw error if secret is not configured', () => {
      const originalSecret = process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_ACCESS_SECRET;
      
      expect(() => verifyToken('some-token', 'access')).toThrow('JWT_ACCESS_SECRET is not configured');
      
      process.env.JWT_ACCESS_SECRET = originalSecret;
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokenPair(mockPayload);
      
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it('should generate valid tokens', () => {
      const tokens = generateTokenPair(mockPayload);
      
      const accessDecoded = verifyToken(tokens.accessToken, 'access');
      const refreshDecoded = verifyToken(tokens.refreshToken, 'refresh');
      
      expect(accessDecoded.userId).toBe(mockPayload.userId);
      expect(refreshDecoded.userId).toBe(mockPayload.userId);
    });

    it('should generate tokens with correct types', () => {
      const tokens = generateTokenPair(mockPayload);
      
      const accessDecoded = jwt.decode(tokens.accessToken) as any;
      const refreshDecoded = jwt.decode(tokens.refreshToken) as any;
      
      expect(accessDecoded.type).toBe('access');
      expect(refreshDecoded.type).toBe('refresh');
    });
  });

  describe('Token Expiration', () => {
    it('should respect custom expiration times', () => {
      process.env.JWT_ACCESS_EXPIRATION = '1h';
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.decode(token) as any;
      
      const expirationTime = decoded.exp - decoded.iat;
      expect(expirationTime).toBe(3600); // 1 hour in seconds
      
      process.env.JWT_ACCESS_EXPIRATION = '15m';
    });
  });

  describe('Token Security', () => {
    it('should not be able to verify token with wrong secret', () => {
      const token = generateAccessToken(mockPayload);
      
      // Try to verify with wrong secret
      const wrongSecret = 'wrong-secret';
      expect(() => {
        jwt.verify(token, wrongSecret);
      }).toThrow();
    });

    it('should generate different tokens for same payload', () => {
      const token1 = generateAccessToken(mockPayload);
      const token2 = generateAccessToken(mockPayload);
      
      // Tokens should be different due to different iat (issued at) timestamps
      expect(token1).not.toBe(token2);
    });
  });
});
