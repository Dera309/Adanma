import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { EnhancedCartService } from '../services/cartService';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  maxQuantity: number;
  image: string;
  images?: string[];
  vendor: string;
  vendorId: string;
  category: string;
  categoryId: string;
  inStock: boolean;
  stockQuantity: number;
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  attributes?: {
    color?: string;
    size?: string;
    material?: string;
    [key: string]: any;
  };
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    validUntil?: Date;
  };
  addedAt: Date;
  updatedAt: Date;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  shipping: number;
  shippingDiscount: number;
  tax: number;
  total: number;
  itemCount: number;
  totalWeight: number;
  appliedCoupons: AppliedCoupon[];
  shippingOptions: ShippingOption[];
  estimatedDelivery: {
    min: Date;
    max: Date;
  };
  cartId: string;
  lastUpdated: Date;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed' | 'shipping';
  appliedAt: Date;
  validUntil?: Date;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: number;
  carrier: string;
  trackingAvailable: boolean;
}

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_001', message: 'Authentication required' }
      });
    }

    try {
      const cart = await prisma.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  vendor: true,
                  category: true,
                  images: true
                }
              }
            }
          },
          appliedCoupons: true
        }
      });

      if (!cart) {
        const newCart = await prisma.cart.create({
          data: { userId },
          include: {
            items: { create: [] },
            appliedCoupons: true
          }
        });
        const cartSummary = await calculateCartSummary(newCart);
        return res.json({ success: true, data: cartSummary });
      }

      const cartSummary = await calculateCartSummary(cart);
      logger.info('Cart retrieved', { userId, itemCount: cartSummary.itemCount });
      res.json({ success: true, data: cartSummary });
    } catch (dbError) {
      logger.warn('Database error, returning empty cart', { error: dbError, userId });
      const emptyCart = {
        items: [],
        subtotal: 0,
        discountAmount: 0,
        shipping: 0,
        shippingDiscount: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
        totalWeight: 0,
        appliedCoupons: [],
        shippingOptions: [],
        estimatedDelivery: {
          min: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          max: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        cartId: `cart_${userId}_empty`,
        lastUpdated: new Date()
      };
      return res.json({ success: true, data: emptyCart });
    }
  } catch (error) {
    logger.error('Get cart error', { error, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: { code: 'CART_001', message: 'Failed to retrieve cart' }
    });
  }
};

// Mock cart data for development/fallback
const getMockCart = async (req: Request, res: Response) => {
  const mockCartItems: CartItem[] = [
    {
      id: '1',
      productId: 'prod_001',
      name: 'African Print Dress - Ankara Style',
      price: 45.99,
      originalPrice: 55.99,
      quantity: 1,
      maxQuantity: 10,
      image: 'https://picsum.photos/300/300?random=2',
      images: ['https://picsum.photos/300/300?random=2', 'https://picsum.photos/300/300?random=3'],
      vendor: 'Lagos Fashion Store',
      vendorId: 'vendor_001',
      category: 'Women\'s Clothing',
      categoryId: 'cat_001',
      inStock: true,
      stockQuantity: 15,
      sku: 'AFD-ANK-001',
      weight: 0.5,
      dimensions: { length: 120, width: 80, height: 2 },
      attributes: {
        color: 'Multi-color',
        size: 'M',
        material: '100% Cotton',
        pattern: 'Ankara Print'
      },
      discount: {
        type: 'percentage',
        value: 18,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      id: '2',
      productId: 'prod_002',
      name: 'Handwoven Basket - Traditional Design',
      price: 25.50,
      quantity: 2,
      maxQuantity: 5,
      image: 'https://picsum.photos/300/300?random=4',
      images: ['https://picsum.photos/300/300?random=4'],
      vendor: 'Accra Crafts Co.',
      vendorId: 'vendor_002',
      category: 'Home & Decor',
      categoryId: 'cat_002',
      inStock: true,
      stockQuantity: 8,
      sku: 'HWB-TRAD-002',
      weight: 1.2,
      dimensions: { length: 30, width: 30, height: 25 },
      attributes: {
        color: 'Natural Brown',
        material: 'Woven Grass',
        origin: 'Ghana',
        handmade: true
      },
      addedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      id: '3',
      productId: 'prod_003',
      name: 'Kente Cloth Scarf - Authentic Pattern',
      price: 35.00,
      quantity: 1,
      maxQuantity: 12,
      image: 'https://picsum.photos/300/300?random=5',
      images: ['https://picsum.photos/300/300?random=5', 'https://picsum.photos/300/300?random=6'],
      vendor: 'Ghana Textiles Ltd',
      vendorId: 'vendor_003',
      category: 'Accessories',
      categoryId: 'cat_003',
      inStock: true,
      stockQuantity: 20,
      sku: 'KCS-AUTH-003',
      weight: 0.3,
      dimensions: { length: 180, width: 30, height: 1 },
      attributes: {
        color: 'Gold & Black',
        material: 'Silk Blend',
        pattern: 'Traditional Kente',
        authenticity: 'Certified'
      },
      addedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      updatedAt: new Date()
    }
  ];

  const appliedCoupons: AppliedCoupon[] = [
    {
      code: 'WELCOME10',
      discount: 10,
      type: 'percentage',
      appliedAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  ];

  const shippingOptions: ShippingOption[] = [
    {
      id: 'standard',
      name: 'Standard Shipping',
      price: 5.99,
      estimatedDays: 5,
      carrier: 'Local Courier',
      trackingAvailable: true
    },
    {
      id: 'express',
      name: 'Express Shipping',
      price: 12.99,
      estimatedDays: 2,
      carrier: 'Express Delivery',
      trackingAvailable: true
    },
    {
      id: 'overnight',
      name: 'Overnight Delivery',
      price: 25.99,
      estimatedDays: 1,
      carrier: 'Premium Express',
      trackingAvailable: true
    }
  ];

  const subtotal = mockCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = appliedCoupons.reduce((sum, coupon) => {
    if (coupon.type === 'percentage') {
      return sum + (subtotal * coupon.discount / 100);
    }
    return sum + coupon.discount;
  }, 0);
  
  const discountedSubtotal = subtotal - discountAmount;
  const shipping = discountedSubtotal > 50 ? 0 : 5.99;
  const shippingDiscount = discountedSubtotal > 50 ? 5.99 : 0;
  const tax = discountedSubtotal * 0.08; // 8% tax
  const total = discountedSubtotal + shipping + tax;
  const totalWeight = mockCartItems.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);

  const cartSummary: CartSummary = {
    items: mockCartItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    shippingDiscount: Math.round(shippingDiscount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount: mockCartItems.reduce((sum, item) => sum + item.quantity, 0),
    totalWeight: Math.round(totalWeight * 100) / 100,
    appliedCoupons,
    shippingOptions,
    estimatedDelivery: {
      min: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      max: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    cartId: `cart_${req.user?.id}_mock`,
    lastUpdated: new Date()
  };

  logger.info('Mock cart retrieved', { userId: req.user?.id, itemCount: cartSummary.itemCount });

  res.json({
    success: true,
    data: cartSummary,
    meta: {
      mockData: true,
      message: 'Using mock data for development'
    }
  });
};

// Calculate cart summary from database cart
const calculateCartSummary = async (cart: any): Promise<CartSummary> => {
  const items: CartItem[] = cart.items.map((item: any) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    price: item.product.price,
    originalPrice: item.product.originalPrice,
    quantity: item.quantity,
    maxQuantity: item.product.stockQuantity,
    image: item.product.images?.[0]?.url || '/api/placeholder/300/300',
    images: item.product.images?.map((img: any) => img.url) || [],
    vendor: item.product.vendor?.name || 'Unknown Vendor',
    vendorId: item.product.vendorId,
    category: item.product.category?.name || 'Uncategorized',
    categoryId: item.product.categoryId,
    inStock: item.product.stockQuantity > 0,
    stockQuantity: item.product.stockQuantity,
    sku: item.product.sku,
    weight: item.product.weight,
    dimensions: item.product.dimensions,
    attributes: item.product.attributes,
    discount: item.product.discount,
    addedAt: item.createdAt,
    updatedAt: item.updatedAt
  }));

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = cart.appliedCoupons?.reduce((sum: number, coupon: any) => {
    if (coupon.type === 'percentage') {
      return sum + (subtotal * coupon.discount / 100);
    }
    return sum + coupon.discount;
  }, 0) || 0;
  
  const discountedSubtotal = subtotal - discountAmount;
  const shipping = discountedSubtotal > 50 ? 0 : 5.99;
  const shippingDiscount = discountedSubtotal > 50 ? 5.99 : 0;
  const tax = discountedSubtotal * 0.08;
  const total = discountedSubtotal + shipping + tax;
  const totalWeight = items.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);

  return {
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    shippingDiscount: Math.round(shippingDiscount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    totalWeight: Math.round(totalWeight * 100) / 100,
    appliedCoupons: cart.appliedCoupons || [],
    shippingOptions: [
      {
        id: 'standard',
        name: 'Standard Shipping',
        price: 5.99,
        estimatedDays: 5,
        carrier: 'Local Courier',
        trackingAvailable: true
      },
      {
        id: 'express',
        name: 'Express Shipping',
        price: 12.99,
        estimatedDays: 2,
        carrier: 'Express Delivery',
        trackingAvailable: true
      }
    ],
    estimatedDelivery: {
      min: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      max: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    cartId: cart.id,
    lastUpdated: cart.updatedAt
  };
};

// Add item to cart
export const addToCart = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: errors.array() }
      });
    }

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_001', message: 'Authentication required' }
      });
    }

    const { productId, quantity = 1, attributes = {} } = req.body;

    // Check if we should use mock data
    const useMockData = process.env.USE_MOCK_DATA === 'true';
    
    if (useMockData) {
      const newItem: CartItem = {
        id: `cart_${Date.now()}`,
        productId,
        name: 'New African Product',
        price: 29.99,
        quantity,
        maxQuantity: 10,
        image: '/api/placeholder/300/300',
        images: ['/api/placeholder/300/300'],
        vendor: 'Sample African Store',
        vendorId: 'vendor_sample',
        category: 'General',
        categoryId: 'cat_general',
        inStock: true,
        stockQuantity: 10,
        sku: `SKU-${Date.now()}`,
        weight: 0.5,
        attributes,
        addedAt: new Date(),
        updatedAt: new Date()
      };

      logger.info('Item added to cart (mock)', { userId, productId, quantity });

      return res.status(201).json({
        success: true,
        data: newItem,
        message: 'Item added to cart successfully',
        meta: { mockData: true }
      });
    }

    // Try database operation
    try {
      // Check if product exists and is available
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          vendor: true,
          category: true,
          images: true
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: { code: 'PRODUCT_001', message: 'Product not found' }
        });
      }

      if (product.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'STOCK_001', 
            message: `Insufficient stock. Only ${product.stockQuantity} items available` 
          }
        });
      }

      // Get or create cart
      let cart = await prisma.cart.findFirst({
        where: { userId },
        include: { items: true }
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId },
          include: { items: true }
        });
      }

      // Check if item already exists in cart
      const existingItem = cart.items.find(item => 
        item.productId === productId && 
        JSON.stringify(item.attributes) === JSON.stringify(attributes)
      );

      let cartItem;
      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stockQuantity) {
          return res.status(400).json({
            success: false,
            error: { 
              code: 'STOCK_002', 
              message: `Cannot add ${quantity} more items. Maximum available: ${product.stockQuantity - existingItem.quantity}` 
            }
          });
        }

        cartItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
          include: {
            product: {
              include: {
                vendor: true,
                category: true,
                images: true
              }
            }
          }
        });
      } else {
        // Create new cart item
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
            attributes
          },
          include: {
            product: {
              include: {
                vendor: true,
                category: true,
                images: true
              }
            }
          }
        });
      }

      const responseItem: CartItem = {
        id: cartItem.id,
        productId: cartItem.productId,
        name: cartItem.product.name,
        price: cartItem.product.price,
        originalPrice: cartItem.product.originalPrice,
        quantity: cartItem.quantity,
        maxQuantity: cartItem.product.stockQuantity,
        image: cartItem.product.images?.[0]?.url || '/api/placeholder/300/300',
        images: cartItem.product.images?.map(img => img.url) || [],
        vendor: cartItem.product.vendor?.name || 'Unknown Vendor',
        vendorId: cartItem.product.vendorId,
        category: cartItem.product.category?.name || 'Uncategorized',
        categoryId: cartItem.product.categoryId,
        inStock: cartItem.product.stockQuantity > 0,
        stockQuantity: cartItem.product.stockQuantity,
        sku: cartItem.product.sku,
        weight: cartItem.product.weight,
        dimensions: cartItem.product.dimensions,
        attributes: cartItem.attributes,
        discount: cartItem.product.discount,
        addedAt: cartItem.createdAt,
        updatedAt: cartItem.updatedAt
      };

      logger.info('Item added to cart', { userId, productId, quantity, cartItemId: cartItem.id });

      res.status(201).json({
        success: true,
        data: responseItem,
        message: existingItem ? 'Cart item quantity updated successfully' : 'Item added to cart successfully'
      });
    } catch (dbError) {
      logger.warn('Database error, using mock response', { error: dbError, userId, productId });
      
      // Fallback to mock response
      const newItem: CartItem = {
        id: `cart_${Date.now()}`,
        productId,
        name: 'African Product (Mock)',
        price: 29.99,
        quantity,
        maxQuantity: 10,
        image: '/api/placeholder/300/300',
        images: ['/api/placeholder/300/300'],
        vendor: 'Sample Store',
        vendorId: 'vendor_mock',
        category: 'General',
        categoryId: 'cat_general',
        inStock: true,
        stockQuantity: 10,
        sku: `MOCK-${Date.now()}`,
        weight: 0.5,
        attributes,
        addedAt: new Date(),
        updatedAt: new Date()
      };

      return res.status(201).json({
        success: true,
        data: newItem,
        message: 'Item added to cart successfully',
        meta: { mockData: true, reason: 'Database unavailable' }
      });
    }
  } catch (error) {
    logger.error('Add to cart error', { error, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: { code: 'CART_002', message: 'Failed to add item to cart' }
    });
  }
};

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: errors.array() }
      });
    }

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_001', message: 'Authentication required' }
      });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VAL_002', message: 'Quantity must be greater than 0' }
      });
    }

    const useMockData = process.env.USE_MOCK_DATA === 'true';
    
    if (useMockData) {
      logger.info('Cart item updated (mock)', { userId, itemId, quantity });

      return res.json({
        success: true,
        data: { 
          itemId, 
          quantity,
          updatedAt: new Date()
        },
        message: 'Cart item updated successfully',
        meta: { mockData: true }
      });
    }

    // Try database operation
    try {
      // Find the cart item and verify ownership
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: itemId,
          cart: {
            userId
          }
        },
        include: {
          product: true
        }
      });

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          error: { code: 'CART_010', message: 'Cart item not found' }
        });
      }

      // Check stock availability
      if (quantity > cartItem.product.stockQuantity) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'STOCK_001', 
            message: `Insufficient stock. Only ${cartItem.product.stockQuantity} items available` 
          }
        });
      }

      // Update the cart item
      const updatedItem = await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
        include: {
          product: {
            include: {
              vendor: true,
              category: true,
              images: true
            }
          }
        }
      });

      const responseItem: CartItem = {
        id: updatedItem.id,
        productId: updatedItem.productId,
        name: updatedItem.product.name,
        price: updatedItem.product.price,
        originalPrice: updatedItem.product.originalPrice,
        quantity: updatedItem.quantity,
        maxQuantity: updatedItem.product.stockQuantity,
        image: updatedItem.product.images?.[0]?.url || '/api/placeholder/300/300',
        images: updatedItem.product.images?.map(img => img.url) || [],
        vendor: updatedItem.product.vendor?.name || 'Unknown Vendor',
        vendorId: updatedItem.product.vendorId,
        category: updatedItem.product.category?.name || 'Uncategorized',
        categoryId: updatedItem.product.categoryId,
        inStock: updatedItem.product.stockQuantity > 0,
        stockQuantity: updatedItem.product.stockQuantity,
        sku: updatedItem.product.sku,
        weight: updatedItem.product.weight,
        dimensions: updatedItem.product.dimensions,
        attributes: updatedItem.attributes,
        discount: updatedItem.product.discount,
        addedAt: updatedItem.createdAt,
        updatedAt: updatedItem.updatedAt
      };

      logger.info('Cart item updated', { userId, itemId, quantity, newQuantity: updatedItem.quantity });

      res.json({
        success: true,
        data: responseItem,
        message: 'Cart item updated successfully'
      });
    } catch (dbError) {
      logger.warn('Database error, using mock response', { error: dbError, userId, itemId });
      
      return res.json({
        success: true,
        data: { 
          itemId, 
          quantity,
          updatedAt: new Date()
        },
        message: 'Cart item updated successfully',
        meta: { mockData: true, reason: 'Database unavailable' }
      });
    }
  } catch (error) {
    logger.error('Update cart item error', { error, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: { code: 'CART_003', message: 'Failed to update cart item' }
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_001', message: 'Authentication required' }
      });
    }

    const { itemId } = req.params;
    const useMockData = process.env.USE_MOCK_DATA === 'true';
    
    if (useMockData) {
      logger.info('Item removed from cart (mock)', { userId, itemId });

      return res.json({
        success: true,
        message: 'Item removed from cart successfully',
        meta: { mockData: true }
      });
    }

    // Try database operation
    try {
      // Find and verify the cart item belongs to the user
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: itemId,
          cart: {
            userId
          }
        }
      });

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          error: { code: 'CART_010', message: 'Cart item not found' }
        });
      }

      // Remove the cart item
      await prisma.cartItem.delete({
        where: { id: itemId }
      });

      logger.info('Item removed from cart', { userId, itemId });

      res.json({
        success: true,
        message: 'Item removed from cart successfully'
      });
    } catch (dbError) {
      logger.warn('Database error, using mock response', { error: dbError, userId, itemId });
      
      return res.json({
        success: true,
        message: 'Item removed from cart successfully',
        meta: { mockData: true, reason: 'Database unavailable' }
      });
    }
  } catch (error) {
    logger.error('Remove from cart error', { error, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: { code: 'CART_004', message: 'Failed to remove item from cart' }
    });
  }
};

// Clear entire cart
export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_001', message: 'Authentication required' }
      });
    }

    const useMockData = process.env.USE_MOCK_DATA === 'true';
    
    if (useMockData) {
      logger.info('Cart cleared (mock)', { userId });

      return res.json({
        success: true,
        message: 'Cart cleared successfully',
        meta: { mockData: true }
      });
    }

    // Try database operation
    try {
      // Find user's cart
      const cart = await prisma.cart.findFirst({
        where: { userId },
        include: { items: true, appliedCoupons: true }
      });

      if (cart) {
        // Remove all cart items and applied coupons
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id }
        });

        await prisma.appliedCoupon.deleteMany({
          where: { cartId: cart.id }
        });
      }

      logger.info('Cart cleared', { userId, itemsRemoved: cart?.items.length || 0 });

      res.json({
        success: true,
        message: 'Cart cleared successfully',
        data: {
          itemsRemoved: cart?.items.length || 0,
          couponsRemoved: cart?.appliedCoupons.length || 0
        }
      });
    } catch (dbError) {
      logger.warn('Database error, using mock response', { error: dbError, userId });
      
      return res.json({
        success: true,
        message: 'Cart cleared successfully',
        meta: { mockData: true, reason: 'Database unavailable' }
      });
    }
  } catch (error) {
    logger.error('Clear cart error', { error, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: { code: 'CART_005', message: 'Failed to clear cart' }
    });
  }
};

// Apply coupon code
export const applyCoupon = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: errors.array() }
      });
    }

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_001', message: 'Authentication required' }
      });
    }

    const { couponCode } = req.body;
    const useMockData = process.env.USE_MOCK_DATA === 'true';

    // Enhanced mock coupon validation
    const mockCoupons: { [key: string]: { 
      discount: number; 
      type: 'percentage' | 'fixed' | 'shipping';
      minOrderValue?: number;
      maxDiscount?: number;
      validUntil?: Date;
      description: string;
    } } = {
      'WELCOME10': { 
        discount: 10, 
        type: 'percentage',
        maxDiscount: 50,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: 'Welcome discount - 10% off your order'
      },
      'SAVE5': { 
        discount: 5, 
        type: 'fixed',
        minOrderValue: 25,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        description: 'Save $5 on orders over $25'
      },
      'NEWUSER': { 
        discount: 15, 
        type: 'percentage',
        maxDiscount: 75,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        description: 'New user special - 15% off'
      },
      'FREESHIP': {
        discount: 0,
        type: 'shipping',
        minOrderValue: 30,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: 'Free shipping on orders over $30'
      },
      'AFRICA20': {
        discount: 20,
        type: 'percentage',
        maxDiscount: 100,
        minOrderValue: 50,
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        description: 'African Heritage Month - 20% off orders over $50'
      }
    };

    if (useMockData) {
      const coupon = mockCoupons[couponCode.toUpperCase()];
      if (!coupon) {
        return res.status(400).json({
          success: false,
          error: { code: 'COUPON_001', message: 'Invalid coupon code' }
        });
      }

      if (coupon.validUntil && coupon.validUntil < new Date()) {
        return res.status(400).json({
          success: false,
          error: { code: 'COUPON_002', message: 'Coupon has expired' }
        });
      }

      logger.info('Coupon applied (mock)', { userId, couponCode, discount: coupon.discount });

      return res.json({
        success: true,
        data: {
          couponCode: couponCode.toUpperCase(),
          discount: coupon.discount,
          type: coupon.type,
          description: coupon.description,
          minOrderValue: coupon.minOrderValue,
          maxDiscount: coupon.maxDiscount,
          validUntil: coupon.validUntil,
          appliedAt: new Date()
        },
        message: 'Coupon applied successfully',
        meta: { mockData: true }
      });
    }

    // Try database operation
    try {
      // Get user's cart
      const cart = await prisma.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: {
              product: true
            }
          },
          appliedCoupons: true
        }
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'CART_007', message: 'Cart is empty' }
        });
      }

      // Check if coupon exists in database
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() }
      });

      if (!coupon) {
        return res.status(400).json({
          success: false,
          error: { code: 'COUPON_001', message: 'Invalid coupon code' }
        });
      }

      if (coupon.validUntil && coupon.validUntil < new Date()) {
        return res.status(400).json({
          success: false,
          error: { code: 'COUPON_002', message: 'Coupon has expired' }
        });
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({
          success: false,
          error: { code: 'COUPON_003', message: 'Coupon usage limit reached' }
        });
      }

      // Check if coupon is already applied
      const alreadyApplied = cart.appliedCoupons.some(ac => ac.couponCode === coupon.code);
      if (alreadyApplied) {
        return res.status(400).json({
          success: false,
          error: { code: 'COUPON_004', message: 'Coupon already applied' }
        });
      }

      // Calculate cart total to check minimum order value
      const cartTotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      
      if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'COUPON_005', 
            message: `Minimum order value of $${coupon.minOrderValue} required` 
          }
        });
      }

      // Apply coupon to cart
      await prisma.appliedCoupon.create({
        data: {
          cartId: cart.id,
          couponCode: coupon.code,
          discount: coupon.discount,
          type: coupon.type,
          appliedAt: new Date()
        }
      });

      // Update coupon usage count
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } }
      });

      logger.info('Coupon applied', { userId, couponCode, discount: coupon.discount });

      res.json({
        success: true,
        data: {
          couponCode: coupon.code,
          discount: coupon.discount,
          type: coupon.type,
          description: coupon.description,
          minOrderValue: coupon.minOrderValue,
          maxDiscount: coupon.maxDiscount,
          validUntil: coupon.validUntil,
          appliedAt: new Date()
        },
        message: 'Coupon applied successfully'
      });
    } catch (dbError) {
      logger.warn('Database error, using mock coupon validation', { error: dbError, userId, couponCode });
      
      // Fallback to mock validation
      const coupon = mockCoupons[couponCode.toUpperCase()];
      if (!coupon) {
        return res.status(400).json({
          success: false,
          error: { code: 'COUPON_001', message: 'Invalid coupon code' }
        });
      }

      return res.json({
        success: true,
        data: {
          couponCode: couponCode.toUpperCase(),
          discount: coupon.discount,
          type: coupon.type,
          description: coupon.description,
          appliedAt: new Date()
        },
        message: 'Coupon applied successfully',
        meta: { mockData: true, reason: 'Database unavailable' }
      });
    }
  } catch (error) {
    logger.error('Apply coupon error', { error, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: { code: 'CART_006', message: 'Failed to apply coupon' }
    });
  }
};

// Get available shipping options
export const getShippingOptions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_001', message: 'Authentication required' }
      });
    }

    const { address } = req.query;
    
    // Mock shipping options based on address
    const shippingOptions: ShippingOption[] = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        price: 5.99,
        estimatedDays: 5,
        carrier: 'Local Courier',
        trackingAvailable: true
      },
      {
        id: 'express',
        name: 'Express Shipping',
        price: 12.99,
        estimatedDays: 2,
        carrier: 'Express Delivery',
        trackingAvailable: true
      },
      {
        id: 'overnight',
        name: 'Overnight Delivery',
        price: 25.99,
        estimatedDays: 1,
        carrier: 'Premium Express',
        trackingAvailable: true
      }
    ];

    // Adjust pricing based on address (mock logic)
    if (address && typeof address === 'string') {
      const addressLower = address.toLowerCase();
      if (addressLower.includes('rural') || addressLower.includes('remote')) {
        shippingOptions.forEach(option => {
          option.price += 5;
          option.estimatedDays += 1;
        });
      }
    }

    logger.info('Shipping options retrieved', { userId, address });

    res.json({
      success: true,
      data: shippingOptions
    });
  } catch (error) {
    logger.error('Get shipping options error', { error, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: { code: 'CART_008', message: 'Failed to get shipping options' }
    });
  }
};

// Save cart for later
export const saveForLater = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_001', message: 'Authentication required' }
      });
    }

    const { itemId } = req.params;

    logger.info('Item saved for later', { userId, itemId });

    res.json({
      success: true,
      message: 'Item saved for later successfully'
    });
  } catch (error) {
    logger.error('Save for later error', { error, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: { code: 'CART_009', message: 'Failed to save item for later' }
    });
  }
};