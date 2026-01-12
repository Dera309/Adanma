import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get user's cart
router.get('/', authenticateToken, (req: any, res: express.Response) => {
  const mockCart = {
    items: [
      {
        id: '1',
        productId: 'prod_001',
        name: 'African Print Dress',
        price: 45.99,
        quantity: 1,
        image: '/api/placeholder/300/300',
        vendor: 'Lagos Fashion Store'
      }
    ],
    subtotal: 45.99,
    shipping: 5.99,
    total: 51.98
  };

  res.json({
    success: true,
    data: mockCart
  });
});

// Add item to cart
router.post('/items', authenticateToken, (req: any, res: express.Response) => {
  const { productId, quantity = 1 } = req.body;

  res.status(201).json({
    success: true,
    data: {
      id: `cart_${Date.now()}`,
      productId,
      quantity,
      addedAt: new Date()
    },
    message: 'Item added to cart successfully'
  });
});

// Update cart item
router.put('/items/:itemId', authenticateToken, (req: any, res: express.Response) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  res.json({
    success: true,
    data: { itemId, quantity, updatedAt: new Date() },
    message: 'Cart item updated successfully'
  });
});

// Remove item from cart
router.delete('/items/:itemId', authenticateToken, (req: any, res: express.Response) => {
  res.json({
    success: true,
    message: 'Item removed from cart successfully'
  });
});

// Clear cart
router.delete('/', authenticateToken, (req: any, res: express.Response) => {
  res.json({
    success: true,
    message: 'Cart cleared successfully'
  });
});

export default router;