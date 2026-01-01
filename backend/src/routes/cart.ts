import express from 'express';
import { body, param } from 'express-validator';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  getShippingOptions,
  saveForLater
} from '../controllers/cart';
import { authenticateFromCookie } from '../utils/jwt';

const router = express.Router();

// Get user's cart
router.get('/', authenticateFromCookie, getCart);

// Add item to cart
router.post('/items', 
  authenticateFromCookie,
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
  ],
  addToCart
);

// Update cart item quantity
router.put('/items/:itemId',
  authenticateFromCookie,
  [
    param('itemId').notEmpty().withMessage('Item ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
  ],
  updateCartItem
);

// Remove item from cart
router.delete('/items/:itemId',
  authenticateFromCookie,
  [
    param('itemId').notEmpty().withMessage('Item ID is required')
  ],
  removeFromCart
);

// Clear entire cart
router.delete('/', authenticateFromCookie, clearCart);

// Apply coupon code
router.post('/coupon',
  authenticateFromCookie,
  [
    body('couponCode').notEmpty().withMessage('Coupon code is required')
  ],
  applyCoupon
);

// Get shipping options
router.get('/shipping-options', authenticateFromCookie, getShippingOptions);

// Save item for later
router.post('/items/:itemId/save-later',
  authenticateFromCookie,
  [
    param('itemId').notEmpty().withMessage('Item ID is required')
  ],
  saveForLater
);

export default router;