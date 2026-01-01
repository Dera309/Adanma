import sgMail from '@sendgrid/mail';

export interface EmailProvider {
  sendEmail(to: string, subject: string, html: string, text?: string): Promise<EmailResult>;
  sendVerificationEmail(to: string, verificationLink: string, userName?: string): Promise<EmailResult>;
  sendPasswordResetEmail(to: string, resetLink: string, userName?: string): Promise<EmailResult>;
  sendNotificationEmail(to: string, subject: string, message: string, userName?: string): Promise<EmailResult>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * SendGrid Email Provider
 */
export class SendGridEmailProvider implements EmailProvider {
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@africancommerce.com';

    if (!apiKey) {
      throw new Error('SendGrid configuration missing: SENDGRID_API_KEY is required');
    }

    sgMail.setApiKey(apiKey);
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<EmailResult> {
    try {
      const msg = {
        to,
        from: this.fromEmail,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const result = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: result[0].headers['x-message-id'] as string,
        provider: 'sendgrid'
      };
    } catch (error) {
      console.error('SendGrid email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email sending failed',
        provider: 'sendgrid'
      };
    }
  }

  async sendVerificationEmail(to: string, verificationLink: string, userName?: string): Promise<EmailResult> {
    const template = this.getVerificationEmailTemplate(verificationLink, userName);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  async sendPasswordResetEmail(to: string, resetLink: string, userName?: string): Promise<EmailResult> {
    const template = this.getPasswordResetEmailTemplate(resetLink, userName);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  async sendNotificationEmail(to: string, subject: string, message: string, userName?: string): Promise<EmailResult> {
    const template = this.getNotificationEmailTemplate(subject, message, userName);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private getVerificationEmailTemplate(verificationLink: string, userName?: string): EmailTemplate {
    const name = userName || 'User';
    
    return {
      subject: 'Verify Your African E-commerce Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">African E-commerce</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome ${name}!</h2>
            
            <p>Thank you for registering with African E-commerce. To complete your registration and start exploring our platform, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px;">${verificationLink}</p>
            
            <p><strong>This verification link will expire in 24 hours.</strong></p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666;">
              If you didn't create an account with African E-commerce, please ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome ${name}!
        
        Thank you for registering with African E-commerce. To complete your registration, please verify your email address by clicking the link below:
        
        ${verificationLink}
        
        This verification link will expire in 24 hours.
        
        If you didn't create an account with African E-commerce, please ignore this email.
      `
    };
  }

  private getPasswordResetEmailTemplate(resetLink: string, userName?: string): EmailTemplate {
    const name = userName || 'User';
    
    return {
      subject: 'Reset Your African E-commerce Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">African E-commerce</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            
            <p>Hello ${name},</p>
            
            <p>We received a request to reset your password for your African E-commerce account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px;">${resetLink}</p>
            
            <p><strong>This reset link will expire in 15 minutes for security reasons.</strong></p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666;">
              If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hello ${name},
        
        We received a request to reset your password for your African E-commerce account. If you made this request, use the link below to reset your password:
        
        ${resetLink}
        
        This reset link will expire in 15 minutes for security reasons.
        
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
      `
    };
  }

  private getNotificationEmailTemplate(subject: string, message: string, userName?: string): EmailTemplate {
    const name = userName || 'User';
    
    return {
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">African E-commerce</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">${subject}</h2>
            
            <p>Hello ${name},</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #667eea;">
              ${message}
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666;">
              This is an automated notification from African E-commerce. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        ${subject}
        
        Hello ${name},
        
        ${message.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()}
        
        This is an automated notification from African E-commerce.
      `
    };
  }
}

/**
 * Mock Email Provider for development/testing
 */
export class MockEmailProvider implements EmailProvider {
  async sendEmail(to: string, subject: string, html: string, _text?: string): Promise<EmailResult> {
    console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
    console.log(`[MOCK EMAIL] HTML: ${html.substring(0, 100)}...`);
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: 'mock'
    };
  }

  async sendVerificationEmail(to: string, verificationLink: string, _userName?: string): Promise<EmailResult> {
    console.log(`[MOCK EMAIL] Verification email sent to ${to} with link: ${verificationLink}`);
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: 'mock'
    };
  }

  async sendPasswordResetEmail(to: string, resetLink: string, _userName?: string): Promise<EmailResult> {
    console.log(`[MOCK EMAIL] Password reset email sent to ${to} with link: ${resetLink}`);
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: 'mock'
    };
  }

  async sendNotificationEmail(to: string, subject: string, _message: string, _userName?: string): Promise<EmailResult> {
    console.log(`[MOCK EMAIL] Notification sent to ${to}: ${subject}`);
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: 'mock'
    };
  }
}

/**
 * Email Service Factory
 */
export class EmailService {
  private static instance: EmailService;
  private provider: EmailProvider;

  private constructor() {
    const emailProvider = process.env.EMAIL_PROVIDER || 'sendgrid';
    
    switch (emailProvider.toLowerCase()) {
      case 'sendgrid':
        this.provider = new SendGridEmailProvider();
        break;
      case 'mock':
        this.provider = new MockEmailProvider();
        break;
      default:
        console.warn(`Unknown email provider: ${emailProvider}. Falling back to mock provider.`);
        this.provider = new MockEmailProvider();
    }
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<EmailResult> {
    return this.provider.sendEmail(to, subject, html, text);
  }

  async sendVerificationEmail(to: string, verificationLink: string, userName?: string): Promise<EmailResult> {
    return this.provider.sendVerificationEmail(to, verificationLink, userName);
  }

  async sendPasswordResetEmail(to: string, resetLink: string, userName?: string): Promise<EmailResult> {
    return this.provider.sendPasswordResetEmail(to, resetLink, userName);
  }

  async sendNotificationEmail(to: string, subject: string, message: string, userName?: string): Promise<EmailResult> {
    return this.provider.sendNotificationEmail(to, subject, message, userName);
  }
}

/**
 * Validate email format
 */
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate verification token for email verification
 */
export function generateVerificationToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}