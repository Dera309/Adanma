import express from 'express';
import { body, param } from 'express-validator';
import { createOrder, getOrders, getOrder } from '../controllers/orders';
import { authenticateFromCookie } from '../utils/jwt';

const router = express.Router();

// Create new order
router.post('/',
  authenticateFromCookie,
  [
    body('items').isArray({ min: 1 }).withMessage('Items array is required'),
    body('shippingAddress.firstName').notEmpty().withMessage('First name is required'),
    body('shippingAddress.lastName').notEmpty().withMessage('Last name is required'),
    body('shippingAddress.address').notEmpty().withMessage('Address is required'),
    body('shippingAddress.city').notEmpty().withMessage('City is required'),
    body('shippingAddress.country').notEmpty().withMessage('Country is required'),
    body('paymentMethod').isIn(['card', 'mobile']).withMessage('Invalid payment method'),
    body('totalAmount').isFloat({ min: 0.01 }).withMessage('Total amount must be greater than 0')
  ],
  createOrder
);

// Get user's orders
router.get('/', authenticateFromCookie, getOrders);

// Get specific order
router.get('/:orderId',
  authenticateFromCookie,
  [
    param('orderId').notEmpty().withMessage('Order ID is required')
  ],
  getOrder
);

export default router;