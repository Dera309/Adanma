import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import prisma from './database';
import { JWTPayload } from '../utils/jwt';

/**
 * Configure Facebook OAuth Strategy
 */
export function configureFacebookStrategy(): void {
  const facebookAppId = process.env.FACEBOOK_APP_ID;
  const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
  const facebookCallbackUrl = process.env.FACEBOOK_CALLBACK_URL;

  if (!facebookAppId || !facebookAppSecret || !facebookCallbackUrl) {
    console.warn('Facebook OAuth not configured - missing environment variables');
    return;
  }

  passport.use(new FacebookStrategy({
    clientID: facebookAppId,
    clientSecret: facebookAppSecret,
    callbackURL: facebookCallbackUrl,
    profileFields: ['id', 'emails', 'name', 'picture'],
    state: true // Enable state parameter for CSRF protection
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;

      // Check if user already exists by Facebook ID or email
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email },
            { 
              AND: [
                { authProvider: 'FACEBOOK' },
                // Note: We'd need to add facebookId field to store this
                // For now, we'll use email as the primary identifier
              ]
            }
          ]
        }
      });

      if (user) {
        // Update last login
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: email,
            authProvider: 'FACEBOOK',
            emailVerified: true, // Facebook emails are pre-verified
            roles: ['BUYER'], // Default role
            isActive: true
          }
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

/**
 * Configure JWT Strategy for API authentication
 */
export function configureJwtStrategy(): void {
  const jwtSecret = process.env.JWT_ACCESS_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_ACCESS_SECRET is required for JWT strategy');
  }

  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret,
    issuer: 'african-ecommerce',
    audience: 'african-ecommerce-users'
  },
  async (payload: JWTPayload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          roles: true,
          emailVerified: true,
          phoneVerified: true,
          verificationStatus: true,
          isActive: true
        }
      });

      if (user && user.isActive) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (error) {
      return done(error, false);
    }
  }));
}

/**
 * Initialize Passport configuration
 */
export function initializePassport(): void {
  // Configure strategies
  configureFacebookStrategy();
  configureJwtStrategy();

  // Serialize user for session (if using sessions)
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session (if using sessions)
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          roles: true,
          emailVerified: true,
          phoneVerified: true,
          verificationStatus: true,
          isActive: true
        }
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}