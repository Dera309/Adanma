import { Request, Response } from 'express';
import { createPaymentIntent } from '../services/paymentService';
import { verifyPaystackPayment } from '../services/paymentVerification';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; id: string };
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reference } = req.body;
    
    if (!reference) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REFERENCE', message: 'Payment reference is required' }
      });
    }

    const result = await verifyPaystackPayment(reference);
    
    res.json({
      success: result.success,
      data: {
        verified: result.success,
        reference,
        status: result.success ? 'success' : 'failed',
        ...(result.data && { paymentData: result.data })
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'VERIFICATION_ERROR', message: 'Failed to verify payment' }
    });
  }
};

export const createPaymentIntentEndpoint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, currency = 'NGN', email } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_AMOUNT', message: 'Valid amount is required' }
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Valid customer email is required' }
      });
    }

    const result = await createPaymentIntent(amount, currency, email);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          authorizationUrl: result.authorizationUrl,
          accessCode: result.accessCode,
          reference: result.reference
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: { code: 'PAYMENT_INTENT_FAILED', message: result.message }
      });
    }
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PAYMENT_ERROR', message: 'Failed to create payment intent' }
    });
  }
};