let Paystack: any;
try {
  Paystack = require('paystack');
} catch (error) {
  console.warn('Paystack not available, using mock payments');
  Paystack = null;
}

const isPaystackConfigured = () => {
  return paystack !== null && process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_SECRET_KEY !== 'sk_test_dummy_key';
};

const paystack = Paystack ? (() => {
  if (!process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY === 'sk_test_dummy_key') {
    console.warn('PAYSTACK_SECRET_KEY not configured - payment processing disabled');
    return null;
  }
  return Paystack(process.env.PAYSTACK_SECRET_KEY);
})() : null;

export { paystack };

interface PaymentData {
  amount: number;
  currency: string;
  paymentMethod: string;
  customerEmail: string;
  description: string;
}

interface MobileMoneyData {
  amount: number;
  phoneNumber: string;
  provider: string;
  country: string;
}

export const processCardPayment = async (paymentData: PaymentData) => {
  try {
    if (!isPaystackConfigured()) {
      // Mock payment for development
      await new Promise(resolve => setTimeout(resolve, 2000));
      const success = Math.random() > 0.1;
      return {
        success,
        transactionId: success ? `mock_${Date.now()}` : null,
        message: success ? 'Payment processed successfully' : 'Payment failed - card declined'
      };
    }

    if (!paystack) {
      throw new Error('Paystack client not initialized');
    }

    const response = await paystack.transaction.initialize({
      amount: Math.round(paymentData.amount * 100), // Convert to kobo
      email: paymentData.customerEmail,
      currency: paymentData.currency.toUpperCase(),
      metadata: {
        description: paymentData.description
      }
    });

    return {
      success: true,
      transactionId: response.data.reference,
      authorizationUrl: response.data.authorization_url,
      accessCode: response.data.access_code,
      message: 'Payment initialized successfully'
    };
  } catch (error: any) {
    console.error('Card payment error:', error);
    return {
      success: false,
      transactionId: null,
      message: error.message || 'Payment processing failed'
    };
  }
};

export const processMobileMoneyPayment = async (paymentData: MobileMoneyData) => {
  try {
    // Mock mobile money processing for African countries
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const success = Math.random() > 0.15; // 85% success rate
    
    return {
      success,
      transactionId: success ? `mm_${Date.now()}_${paymentData.country}` : null,
      message: success 
        ? `Payment processed via ${paymentData.provider} Mobile Money`
        : 'Mobile money payment failed - insufficient balance'
    };
  } catch (error: any) {
    console.error('Mobile money payment error:', error);
    return {
      success: false,
      transactionId: null,
      message: 'Mobile money processing failed'
    };
  }
};

export const createPaymentIntent = async (amount: number, currency: string = 'NGN', email: string) => {
  try {
    if (!email) {
      return {
        success: false,
        message: 'Customer email is required for payment processing'
      };
    }

    if (!isPaystackConfigured()) {
      return {
        success: false,
        message: 'Paystack not configured - payment processing disabled'
      };
    }

    if (!paystack) {
      throw new Error('Paystack client not initialized');
    }

    const response = await paystack.transaction.initialize({
      amount: Math.round(amount * 100), // Convert to kobo
      email,
      currency: currency.toUpperCase()
    });

    return {
      success: true,
      authorizationUrl: response.data.authorization_url,
      accessCode: response.data.access_code,
      reference: response.data.reference
    };
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    return {
      success: false,
      message: error.message || 'Failed to create payment intent'
    };
  }
};