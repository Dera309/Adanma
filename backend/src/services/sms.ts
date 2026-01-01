import twilio from 'twilio';

export interface SMSProvider {
  sendSMS(to: string, message: string): Promise<SMSResult>;
  sendVerificationCode(to: string, code: string): Promise<SMSResult>;
  sendPasswordResetCode(to: string, code: string): Promise<SMSResult>;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

/**
 * Twilio SMS Provider
 */
export class TwilioSMSProvider implements SMSProvider {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!accountSid || !authToken || !this.fromNumber) {
      throw new Error('Twilio configuration missing: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are required');
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendSMS(to: string, message: string): Promise<SMSResult> {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to
      });

      return {
        success: true,
        messageId: result.sid,
        provider: 'twilio'
      };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS sending failed',
        provider: 'twilio'
      };
    }
  }

  async sendVerificationCode(to: string, code: string): Promise<SMSResult> {
    const message = `Your African E-commerce verification code is: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`;
    return this.sendSMS(to, message);
  }

  async sendPasswordResetCode(to: string, code: string): Promise<SMSResult> {
    const message = `Your African E-commerce password reset code is: ${code}. This code expires in 15 minutes. Do not share this code with anyone.`;
    return this.sendSMS(to, message);
  }
}

/**
 * Africa's Talking SMS Provider (Alternative for African markets)
 */
export class AfricasTalkingSMSProvider implements SMSProvider {
  private apiKey: string;
  private username: string;
  private baseUrl: string = 'https://api.africastalking.com/version1/messaging';

  constructor() {
    this.apiKey = process.env.AFRICAS_TALKING_API_KEY || '';
    this.username = process.env.AFRICAS_TALKING_USERNAME || '';

    if (!this.apiKey || !this.username) {
      throw new Error('Africa\'s Talking configuration missing: AFRICAS_TALKING_API_KEY and AFRICAS_TALKING_USERNAME are required');
    }
  }

  async sendSMS(to: string, message: string): Promise<SMSResult> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': this.apiKey
        },
        body: new URLSearchParams({
          username: this.username,
          to: to,
          message: message
        })
      });

      const result = await response.json() as any;

      if (result.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
        return {
          success: true,
          messageId: result.SMSMessageData.Recipients[0].messageId,
          provider: 'africas-talking'
        };
      } else {
        return {
          success: false,
          error: result.SMSMessageData?.Recipients?.[0]?.status || 'SMS sending failed',
          provider: 'africas-talking'
        };
      }
    } catch (error) {
      console.error('Africa\'s Talking SMS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS sending failed',
        provider: 'africas-talking'
      };
    }
  }

  async sendVerificationCode(to: string, code: string): Promise<SMSResult> {
    const message = `Your African E-commerce verification code is: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`;
    return this.sendSMS(to, message);
  }

  async sendPasswordResetCode(to: string, code: string): Promise<SMSResult> {
    const message = `Your African E-commerce password reset code is: ${code}. This code expires in 15 minutes. Do not share this code with anyone.`;
    return this.sendSMS(to, message);
  }
}

/**
 * Mock SMS Provider for development/testing
 */
export class MockSMSProvider implements SMSProvider {
  async sendSMS(to: string, message: string): Promise<SMSResult> {
    console.log(`[MOCK SMS] To: ${to}, Message: ${message}`);
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: 'mock'
    };
  }

  async sendVerificationCode(to: string, code: string): Promise<SMSResult> {
    console.log(`[MOCK SMS] Verification code ${code} sent to ${to}`);
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: 'mock'
    };
  }

  async sendPasswordResetCode(to: string, code: string): Promise<SMSResult> {
    console.log(`[MOCK SMS] Password reset code ${code} sent to ${to}`);
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: 'mock'
    };
  }
}

/**
 * SMS Service Factory
 */
export class SMSService {
  private static instance: SMSService;
  private provider: SMSProvider;

  private constructor() {
    const smsProvider = process.env.SMS_PROVIDER || 'mock'; // Default to mock instead of twilio
    console.log(`🔧 Initializing SMS service with provider: ${smsProvider}`);
    
    try {
      switch (smsProvider.toLowerCase()) {
        case 'twilio':
          this.provider = new TwilioSMSProvider();
          break;
        case 'africas-talking':
          this.provider = new AfricasTalkingSMSProvider();
          break;
        case 'mock':
          this.provider = new MockSMSProvider();
          break;
        default:
          console.warn(`Unknown SMS provider: ${smsProvider}. Falling back to mock provider.`);
          this.provider = new MockSMSProvider();
      }
      console.log(`✅ SMS service initialized successfully with ${smsProvider} provider`);
    } catch (error) {
      console.error(`❌ Failed to initialize SMS provider ${smsProvider}:`, error);
      console.log('🔧 Falling back to mock SMS provider');
      this.provider = new MockSMSProvider();
    }
  }

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  async sendSMS(to: string, message: string): Promise<SMSResult> {
    return this.provider.sendSMS(to, message);
  }

  async sendVerificationCode(to: string, code: string): Promise<SMSResult> {
    return this.provider.sendVerificationCode(to, code);
  }

  async sendPasswordResetCode(to: string, code: string): Promise<SMSResult> {
    return this.provider.sendPasswordResetCode(to, code);
  }
}

/**
 * Generate 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate phone number format for supported African countries
 */
export function validatePhoneNumber(phoneNumber: string): {
  isValid: boolean;
  country?: string;
  formattedNumber?: string;
  error?: string;
} {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Country code patterns for supported countries
  const countryPatterns = {
    'Nigeria': /^234[789]\d{9}$/,
    'Ghana': /^233[2459]\d{8}$/,
    'Kenya': /^254[17]\d{8}$/,
    'South Africa': /^27[1-8]\d{8}$/,
    'Cameroon': /^237[26]\d{8}$/,
    'Egypt': /^20[1-5]\d{8}$/
  };

  // Check if number starts with country code
  for (const [country, pattern] of Object.entries(countryPatterns)) {
    if (pattern.test(cleaned)) {
      return {
        isValid: true,
        country,
        formattedNumber: `+${cleaned}`
      };
    }
  }

  // If no country code, try to infer from length and add default country codes
  if (cleaned.length === 10 || cleaned.length === 11) {
    // Could be a local number, but we need country context
    return {
      isValid: false,
      error: 'Phone number must include country code. Supported countries: Nigeria (+234), Ghana (+233), Kenya (+254), South Africa (+27), Cameroon (+237), Egypt (+20)'
    };
  }

  return {
    isValid: false,
    error: 'Invalid phone number format for supported countries'
  };
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on country code
  if (cleaned.startsWith('234')) {
    // Nigeria: +234 XXX XXX XXXX
    return `+234 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  } else if (cleaned.startsWith('233')) {
    // Ghana: +233 XX XXX XXXX
    return `+233 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  } else if (cleaned.startsWith('254')) {
    // Kenya: +254 XXX XXX XXX
    return `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  } else if (cleaned.startsWith('27')) {
    // South Africa: +27 XX XXX XXXX
    return `+27 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.startsWith('237')) {
    // Cameroon: +237 X XXX XX XX
    return `+237 ${cleaned.slice(3, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  } else if (cleaned.startsWith('20')) {
    // Egypt: +20 XX XXX XXXX
    return `+20 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phoneNumber; // Return as-is if no pattern matches
}