/**
 * Security Configuration
 * Centralized security settings for the application
 */

export const securityConfig = {
  // Rate limiting
  rateLimit: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 5
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3
    },
    registration: {
      windowMs: 60 * 60 * 1000,
      max: 3
    }
  },

  // CORS settings
  cors: {
    allowedOrigins: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.ALLOWED_ORIGIN_1,
      process.env.ALLOWED_ORIGIN_2
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
  },

  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 10 * 60 * 1000, // 10 minutes
      sameSite: 'strict' as const
    }
  },

  // JWT configuration
  jwt: {
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '30d',
    issuer: 'african-ecommerce',
    audience: 'african-ecommerce-users'
  },

  // Password policy
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '@$!%*?&',
    maxLength: 128,
    preventReuse: 5, // Prevent reusing last 5 passwords
    expiryDays: 90 // Password expires after 90 days
  },

  // File upload limits
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ],
    maxFiles: 5
  },

  // Request limits
  request: {
    maxBodySize: '10mb',
    maxUrlLength: 2048,
    maxHeaderSize: 8192
  },

  // Security headers
  headers: {
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    csp: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },

  // Account lockout policy
  accountLockout: {
    maxFailedAttempts: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    resetAfter: 24 * 60 * 60 * 1000 // Reset counter after 24 hours
  },

  // Session management
  sessionManagement: {
    maxConcurrentSessions: 5,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    absoluteTimeout: 12 * 60 * 60 * 1000 // 12 hours
  },

  // IP filtering
  ipFiltering: {
    enabled: true,
    blacklist: process.env.BLACKLISTED_IPS?.split(',') || [],
    whitelist: process.env.WHITELISTED_IPS?.split(',') || []
  },

  // Audit logging
  audit: {
    enabled: true,
    logFailedLogins: true,
    logPasswordChanges: true,
    logAccountChanges: true,
    logSensitiveOperations: true
  }
};

/**
 * Validate security configuration
 */
export function validateSecurityConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables
  if (!process.env.JWT_ACCESS_SECRET) {
    errors.push('JWT_ACCESS_SECRET is not configured');
  }

  if (!process.env.JWT_REFRESH_SECRET) {
    errors.push('JWT_REFRESH_SECRET is not configured');
  }

  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'change-this-in-production') {
    errors.push('SESSION_SECRET must be changed in production');
  }

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.FRONTEND_URL) {
      errors.push('FRONTEND_URL must be configured in production');
    }

    if (securityConfig.session.cookie.secure === false) {
      errors.push('Secure cookies must be enabled in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get security recommendations based on current configuration
 */
export function getSecurityRecommendations(): string[] {
  const recommendations: string[] = [];

  if (process.env.NODE_ENV !== 'production') {
    recommendations.push('Enable production mode for enhanced security');
  }

  if (!process.env.BLACKLISTED_IPS) {
    recommendations.push('Consider configuring IP blacklist for known malicious IPs');
  }

  if (securityConfig.password.expiryDays > 90) {
    recommendations.push('Consider reducing password expiry to 90 days or less');
  }

  if (securityConfig.accountLockout.maxFailedAttempts > 5) {
    recommendations.push('Consider reducing max failed login attempts to 5 or less');
  }

  return recommendations;
}

export default securityConfig;
