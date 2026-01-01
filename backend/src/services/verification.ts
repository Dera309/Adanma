/**
 * Verification Token and Code Storage Service
 * In production, this should use Redis or a database table
 */

interface VerificationToken {
  userId: string;
  expiresAt: number;
}

interface VerificationCode {
  userId: string;
  code: string;
  expiresAt: number;
}

// In-memory storage (replace with Redis in production)
const verificationTokens = new Map<string, VerificationToken>();
const verificationCodes = new Map<string, VerificationCode>();

/**
 * Email Verification Token Management
 */
export class EmailVerificationService {
  static storeToken(token: string, userId: string, expirationHours: number = 24): void {
    const expiresAt = Date.now() + (expirationHours * 60 * 60 * 1000);
    verificationTokens.set(token, { userId, expiresAt });
    
    // Clean up expired tokens
    setTimeout(() => {
      const stored = verificationTokens.get(token);
      if (stored && stored.expiresAt <= Date.now()) {
        verificationTokens.delete(token);
      }
    }, expirationHours * 60 * 60 * 1000);
  }

  static validateToken(token: string): { isValid: boolean; userId?: string; error?: string } {
    const stored = verificationTokens.get(token);
    
    if (!stored) {
      return { isValid: false, error: 'Invalid verification token' };
    }
    
    if (stored.expiresAt <= Date.now()) {
      verificationTokens.delete(token);
      return { isValid: false, error: 'Verification token has expired' };
    }
    
    return { isValid: true, userId: stored.userId };
  }

  static consumeToken(token: string): { isValid: boolean; userId?: string; error?: string } {
    const validation = this.validateToken(token);
    if (validation.isValid) {
      verificationTokens.delete(token);
    }
    return validation;
  }
}

/**
 * Phone Verification Code Management
 */
export class PhoneVerificationService {
  static storeCode(userId: string, code: string, expirationMinutes: number = 10): void {
    const expiresAt = Date.now() + (expirationMinutes * 60 * 1000);
    verificationCodes.set(userId, { userId, code, expiresAt });
    
    // Clean up expired codes
    setTimeout(() => {
      const stored = verificationCodes.get(userId);
      if (stored && stored.expiresAt <= Date.now()) {
        verificationCodes.delete(userId);
      }
    }, expirationMinutes * 60 * 1000);
  }

  static validateCode(userId: string, code: string): { isValid: boolean; error?: string } {
    const stored = verificationCodes.get(userId);
    
    if (!stored) {
      return { isValid: false, error: 'No verification code found for this user' };
    }
    
    if (stored.expiresAt <= Date.now()) {
      verificationCodes.delete(userId);
      return { isValid: false, error: 'Verification code has expired' };
    }
    
    if (stored.code !== code) {
      return { isValid: false, error: 'Invalid verification code' };
    }
    
    return { isValid: true };
  }

  static consumeCode(userId: string, code: string): { isValid: boolean; error?: string } {
    const validation = this.validateCode(userId, code);
    if (validation.isValid) {
      verificationCodes.delete(userId);
    }
    return validation;
  }

  static resendCode(userId: string): { canResend: boolean; error?: string } {
    const stored = verificationCodes.get(userId);
    
    if (!stored) {
      return { canResend: true };
    }
    
    // Allow resend if code is expired or if 1 minute has passed
    const oneMinuteAgo = Date.now() - (1 * 60 * 1000);
    const codeCreatedAt = stored.expiresAt - (10 * 60 * 1000); // Original creation time
    
    if (stored.expiresAt <= Date.now() || codeCreatedAt <= oneMinuteAgo) {
      verificationCodes.delete(userId);
      return { canResend: true };
    }
    
    return { canResend: false, error: 'Please wait before requesting a new code' };
  }
}

/**
 * Password Reset Token/Code Management
 */
export class PasswordResetService {
  // Store password reset tokens (for email-based reset)
  private static resetTokens = new Map<string, VerificationToken>();
  
  // Store password reset codes (for phone-based reset)
  private static resetCodes = new Map<string, VerificationCode>();

  static storeResetToken(token: string, userId: string, expirationMinutes: number = 15): void {
    const expiresAt = Date.now() + (expirationMinutes * 60 * 1000);
    this.resetTokens.set(token, { userId, expiresAt });
    
    // Clean up expired tokens
    setTimeout(() => {
      const stored = this.resetTokens.get(token);
      if (stored && stored.expiresAt <= Date.now()) {
        this.resetTokens.delete(token);
      }
    }, expirationMinutes * 60 * 1000);
  }

  static storeResetCode(userId: string, code: string, expirationMinutes: number = 15): void {
    const expiresAt = Date.now() + (expirationMinutes * 60 * 1000);
    this.resetCodes.set(userId, { userId, code, expiresAt });
    
    // Clean up expired codes
    setTimeout(() => {
      const stored = this.resetCodes.get(userId);
      if (stored && stored.expiresAt <= Date.now()) {
        this.resetCodes.delete(userId);
      }
    }, expirationMinutes * 60 * 1000);
  }

  static validateResetToken(token: string): { isValid: boolean; userId?: string; error?: string } {
    const stored = this.resetTokens.get(token);
    
    if (!stored) {
      return { isValid: false, error: 'Invalid reset token' };
    }
    
    if (stored.expiresAt <= Date.now()) {
      this.resetTokens.delete(token);
      return { isValid: false, error: 'Reset token has expired' };
    }
    
    return { isValid: true, userId: stored.userId };
  }

  static validateResetCode(userId: string, code: string): { isValid: boolean; error?: string } {
    const stored = this.resetCodes.get(userId);
    
    if (!stored) {
      return { isValid: false, error: 'No reset code found for this user' };
    }
    
    if (stored.expiresAt <= Date.now()) {
      this.resetCodes.delete(userId);
      return { isValid: false, error: 'Reset code has expired' };
    }
    
    if (stored.code !== code) {
      return { isValid: false, error: 'Invalid reset code' };
    }
    
    return { isValid: true };
  }

  static consumeResetToken(token: string): { isValid: boolean; userId?: string; error?: string } {
    const validation = this.validateResetToken(token);
    if (validation.isValid) {
      this.resetTokens.delete(token);
    }
    return validation;
  }

  static consumeResetCode(userId: string, code: string): { isValid: boolean; error?: string } {
    const validation = this.validateResetCode(userId, code);
    if (validation.isValid) {
      this.resetCodes.delete(userId);
    }
    return validation;
  }
}

/**
 * Get verification statistics (for monitoring)
 */
export function getVerificationStats(): {
  activeTokens: number;
  activeCodes: number;
} {
  // Clean up expired entries
  const now = Date.now();
  
  for (const [token, data] of verificationTokens.entries()) {
    if (data.expiresAt <= now) {
      verificationTokens.delete(token);
    }
  }
  
  for (const [userId, data] of verificationCodes.entries()) {
    if (data.expiresAt <= now) {
      verificationCodes.delete(userId);
    }
  }
  
  return {
    activeTokens: verificationTokens.size,
    activeCodes: verificationCodes.size
  };
}