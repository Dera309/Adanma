import crypto from 'crypto';

/**
 * Generate a secure random state parameter for OAuth CSRF protection
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate OAuth state parameter
 */
export function validateOAuthState(receivedState: string, expectedState: string): boolean {
  if (!receivedState || !expectedState) {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(receivedState, 'hex'),
    Buffer.from(expectedState, 'hex')
  );
}

/**
 * Extract and normalize user profile data from Facebook OAuth response
 */
export interface FacebookProfile {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  picture?: string;
}

export function extractFacebookProfile(profile: any): FacebookProfile {
  return {
    id: profile.id,
    email: profile.emails?.[0]?.value,
    firstName: profile.name?.givenName,
    lastName: profile.name?.familyName,
    name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
    picture: profile.photos?.[0]?.value
  };
}

/**
 * Extract and normalize user profile data from WhatsApp OAuth response
 * Note: WhatsApp Business API OAuth is limited - this is a placeholder for future implementation
 */
export interface WhatsAppProfile {
  id: string;
  phoneNumber?: string;
  name?: string;
  businessName?: string;
}

export function extractWhatsAppProfile(profile: any): WhatsAppProfile {
  return {
    id: profile.id,
    phoneNumber: profile.phoneNumber,
    name: profile.displayName || profile.name,
    businessName: profile.businessName
  };
}

/**
 * Generate OAuth callback URL with state parameter
 */
export function generateOAuthCallbackUrl(baseUrl: string, state: string, _provider: 'facebook' | 'whatsapp'): string {
  const url = new URL(baseUrl);
  url.searchParams.set('state', state);
  return url.toString();
}

/**
 * Validate OAuth callback parameters
 */
export interface OAuthCallbackValidation {
  isValid: boolean;
  error?: string;
  code?: string;
  state?: string;
}

export function validateOAuthCallback(
  query: any,
  expectedState: string
): OAuthCallbackValidation {
  // Check for OAuth error
  if (query.error) {
    return {
      isValid: false,
      error: `OAuth error: ${query.error_description || query.error}`
    };
  }

  // Check for authorization code
  if (!query.code) {
    return {
      isValid: false,
      error: 'Authorization code not received'
    };
  }

  // Validate state parameter
  if (!validateOAuthState(query.state, expectedState)) {
    return {
      isValid: false,
      error: 'Invalid state parameter - possible CSRF attack'
    };
  }

  return {
    isValid: true,
    code: query.code,
    state: query.state
  };
}

/**
 * Create OAuth authorization URL for WhatsApp
 * Note: This is a placeholder implementation as WhatsApp OAuth is limited
 */
export function createWhatsAppAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const baseUrl = 'https://www.whatsapp.com/oauth/authorize';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'whatsapp_business_messaging',
    state: state
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Store OAuth state in memory (in production, use Redis or database)
 */
const oauthStates = new Map<string, { state: string; expiresAt: number }>();

export function storeOAuthState(sessionId: string, state: string, ttlMinutes: number = 10): void {
  const expiresAt = Date.now() + (ttlMinutes * 60 * 1000);
  oauthStates.set(sessionId, { state, expiresAt });
  
  // Clean up expired states
  setTimeout(() => {
    const stored = oauthStates.get(sessionId);
    if (stored && stored.expiresAt <= Date.now()) {
      oauthStates.delete(sessionId);
    }
  }, ttlMinutes * 60 * 1000);
}

export function retrieveOAuthState(sessionId: string): string | null {
  const stored = oauthStates.get(sessionId);
  
  if (!stored) {
    return null;
  }
  
  if (stored.expiresAt <= Date.now()) {
    oauthStates.delete(sessionId);
    return null;
  }
  
  return stored.state;
}

export function clearOAuthState(sessionId: string): void {
  oauthStates.delete(sessionId);
}