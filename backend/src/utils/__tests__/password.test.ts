import {
  hashPassword,
  comparePassword,
  validatePasswordFormat,
  calculatePasswordStrength,
  isPasswordValid,
  generateSecurePassword,
  PASSWORD_REGEX,
  PASSWORD_REQUIREMENTS
} from '../password';

describe('Password Utility', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'Test@1234';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'Test@1234';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow();
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'Test@1234';
      const hashed = await hashPassword(password);
      const isMatch = await comparePassword(password, hashed);
      
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'Test@1234';
      const wrongPassword = 'Wrong@1234';
      const hashed = await hashPassword(password);
      const isMatch = await comparePassword(wrongPassword, hashed);
      
      expect(isMatch).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const password = 'Test@1234';
      const hashed = await hashPassword(password);
      const isMatch = await comparePassword('', hashed);
      
      expect(isMatch).toBe(false);
    });
  });

  describe('validatePasswordFormat', () => {
    it('should validate a strong password', () => {
      const result = validatePasswordFormat('Test@1234');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password without minimum length', () => {
      const result = validatePasswordFormat('Test@1');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePasswordFormat('TEST@1234');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePasswordFormat('test@1234');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePasswordFormat('Test@test');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = validatePasswordFormat('Test1234');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`Password must contain at least one special character (${PASSWORD_REQUIREMENTS.specialChars})`);
    });

    it('should return multiple errors for weak password', () => {
      const result = validatePasswordFormat('test');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('calculatePasswordStrength', () => {
    it('should rate a strong password highly', () => {
      const result = calculatePasswordStrength('SuperStrong@Pass123!');
      
      expect(result.score).toBeGreaterThan(70);
      expect(result.feedback[0]).toContain('Strong');
    });

    it('should rate a weak password lowly', () => {
      const result = calculatePasswordStrength('weak');
      
      expect(result.score).toBeLessThan(50);
      expect(result.feedback[0]).toContain('Weak');
    });

    it('should penalize repeating characters', () => {
      const result = calculatePasswordStrength('Test@1111');
      
      expect(result.feedback).toContain('Avoid repeating characters');
    });

    it('should penalize common sequences', () => {
      const result = calculatePasswordStrength('Test@123');
      
      expect(result.feedback).toContain('Avoid common sequences');
    });

    it('should reward longer passwords', () => {
      const short = calculatePasswordStrength('Test@123');
      const long = calculatePasswordStrength('Test@123456789012345');
      
      expect(long.score).toBeGreaterThan(short.score);
    });

    it('should ensure score is between 0 and 100', () => {
      const result = calculatePasswordStrength('a');
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('isPasswordValid', () => {
    it('should return true for valid password', () => {
      expect(isPasswordValid('Test@1234')).toBe(true);
    });

    it('should return false for invalid password', () => {
      expect(isPasswordValid('weak')).toBe(false);
    });

    it('should return false for password without special char', () => {
      expect(isPasswordValid('Test1234')).toBe(false);
    });

    it('should return false for password without number', () => {
      expect(isPasswordValid('Test@test')).toBe(false);
    });

    it('should return false for short password', () => {
      expect(isPasswordValid('Te@1')).toBe(false);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password of specified length', () => {
      const password = generateSecurePassword(12);
      
      expect(password.length).toBe(12);
    });

    it('should generate password with default length', () => {
      const password = generateSecurePassword();
      
      expect(password.length).toBe(12);
    });

    it('should generate valid password', () => {
      const password = generateSecurePassword(16);
      
      expect(isPasswordValid(password)).toBe(true);
    });

    it('should generate different passwords each time', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();
      
      expect(password1).not.toBe(password2);
    });

    it('should contain at least one lowercase letter', () => {
      const password = generateSecurePassword();
      
      expect(/[a-z]/.test(password)).toBe(true);
    });

    it('should contain at least one uppercase letter', () => {
      const password = generateSecurePassword();
      
      expect(/[A-Z]/.test(password)).toBe(true);
    });

    it('should contain at least one number', () => {
      const password = generateSecurePassword();
      
      expect(/\d/.test(password)).toBe(true);
    });

    it('should contain at least one special character', () => {
      const password = generateSecurePassword();
      
      expect(/[@$!%*?&]/.test(password)).toBe(true);
    });
  });

  describe('PASSWORD_REGEX', () => {
    it('should match valid passwords', () => {
      expect(PASSWORD_REGEX.test('Test@1234')).toBe(true);
      expect(PASSWORD_REGEX.test('MyP@ssw0rd')).toBe(true);
      expect(PASSWORD_REGEX.test('Str0ng!Pass')).toBe(true);
    });

    it('should not match invalid passwords', () => {
      expect(PASSWORD_REGEX.test('weak')).toBe(false);
      expect(PASSWORD_REGEX.test('NoSpecial1')).toBe(false);
      expect(PASSWORD_REGEX.test('nonumber@')).toBe(false);
      expect(PASSWORD_REGEX.test('NOLOWER@1')).toBe(false);
      expect(PASSWORD_REGEX.test('noupper@1')).toBe(false);
    });
  });
});
