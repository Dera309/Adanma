import { paystack } from './paymentService';

export const verifyPaystackPayment = async (reference: string) => {
  try {
    if (!paystack) {
      // Mock verification for development
      return {
        success: process.env.NODE_ENV === 'development',
        data: {
          status: 'success',
          reference,
          amount: 0,
          currency: 'NGN'
        }
      };
    }

    const response = await paystack.transaction.verify(reference);
    
    return {
      success: response.status && response.data.status === 'success',
      data: response.data
    };
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: error.message || 'Verification failed'
    };
  }
};