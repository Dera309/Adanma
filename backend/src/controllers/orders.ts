import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { processCardPayment, processMobileMoneyPayment, createPaymentIntent } from '../services/paymentService';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; id: string };
}

const processPayment = async (paymentData: any) => {
  const { amount, method, customerEmail, phoneNumber, country } = paymentData;
  
  if (method === 'card') {
    return await processCardPayment({
      amount,
      currency: 'usd',
      paymentMethod: method,
      customerEmail: customerEmail || 'customer@example.com',
      description: 'Adanma E-commerce Order'
    });
  } else if (method === 'mobile') {
    return await processMobileMoneyPayment({
      amount,
      phoneNumber: phoneNumber || '+234000000000',
      provider: 'MTN', // Default provider
      country: country || 'Nigeria'
    });
  }
  
  return {
    success: false,
    transactionId: null,
    message: 'Unsupported payment method'
  };
};

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: errors.array() }
      });
    }

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      });
    }

    const { items, shippingAddress, paymentMethod, totalAmount, customerEmail, phoneNumber } = req.body;

    // Process payment
    const paymentResult = await processPayment({
      amount: totalAmount,
      method: paymentMethod,
      userId,
      customerEmail: customerEmail || shippingAddress.email,
      phoneNumber,
      country: shippingAddress.country
    });

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'PAYMENT_FAILED', message: paymentResult.message }
      });
    }

    // Create order (mock data for now)
    const order = {
      id: `order_${Date.now()}`,
      userId,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
      status: 'confirmed',
      transactionId: paymentResult.transactionId,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    res.status(201).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ORDER_ERROR', message: 'Failed to create order' }
    });
  }
};

export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      });
    }

    // Mock orders data
    const orders = [
      {
        id: 'order_1703123456789',
        status: 'delivered',
        totalAmount: 89.99,
        items: [
          { name: 'African Print Dress', quantity: 1, price: 89.99 }
        ],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'order_1703123456790',
        status: 'shipped',
        totalAmount: 156.50,
        items: [
          { name: 'Kente Cloth Bag', quantity: 2, price: 78.25 }
        ],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ORDERS_ERROR', message: 'Failed to fetch orders' }
    });
  }
};

export const getOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      });
    }

    // Mock order data
    const order = {
      id: orderId,
      userId,
      status: 'confirmed',
      totalAmount: 71.49,
      items: [
        { name: 'African Print Shirt', quantity: 1, price: 45.99, image: 'https://picsum.photos/200/200?random=1' },
        { name: 'Wooden Bracelet', quantity: 2, price: 12.75, image: 'https://picsum.photos/200/200?random=2' }
      ],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        city: 'Lagos',
        country: 'Nigeria'
      },
      paymentMethod: 'card',
      transactionId: 'txn_1703123456789_abc123',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ORDER_ERROR', message: 'Failed to fetch order' }
    });
  }
};