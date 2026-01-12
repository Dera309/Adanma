import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get user orders
router.get('/', authenticateToken, (req: any, res: express.Response) => {
  const mockOrders = [
    {
      id: 'order_001',
      status: 'delivered',
      total: 89.99,
      items: [
        {
          name: 'African Print Dress',
          quantity: 1,
          price: 45.99
        }
      ],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  ];

  res.json({
    success: true,
    data: { orders: mockOrders }
  });
});

// Create new order
router.post('/', authenticateToken, async (req: any, res: express.Response) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount, customerEmail, phoneNumber } = req.body;

    // Validate required fields
    if (!items || !shippingAddress || !paymentMethod || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_001',
          message: 'Missing required order fields'
        }
      });
    }

    // For now, simulate payment processing
    // In a real implementation, this would integrate with a payment gateway
    let paymentStatus = 'pending';

    // Mock payment success for demonstration
    if (paymentMethod === 'card' || paymentMethod === 'mobile') {
      paymentStatus = 'completed';
    }

    // Create order object
    const order = {
      id: uuidv4(),
      userId: req.user.id,
      items,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      totalAmount,
      customerEmail,
      phoneNumber,
      status: paymentStatus === 'completed' ? 'confirmed' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, save to database
    console.log('Order created:', order);

    res.status(201).json({
      success: true,
      data: { order },
      message: 'Order created successfully'
    });

  } catch (error: any) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ORDER_002',
        message: 'Failed to create order'
      }
    });
  }
});

export default router;