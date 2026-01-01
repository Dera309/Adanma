import prisma from '../config/database';
import { logger } from '../utils/logger';

export interface CartItemData {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image: string;
  vendor: string;
  category: string;
}

export interface CartCalculation {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}

export class CartService {
  // Calculate cart totals
  static calculateTotals(items: CartItemData[], couponDiscount = 0): CartCalculation {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Free shipping over $50
    const shipping = subtotal > 50 ? 0 : 5.99;
    
    // 8% tax rate
    const tax = subtotal * 0.08;
    
    // Apply discount
    const discount = couponDiscount;
    
    const total = Math.max(0, subtotal + shipping + tax - discount);
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }

  // Validate product availability and pricing
  static async validateCartItem(productId: string, quantity: number): Promise<{
    isValid: boolean;
    product?: any;
    error?: string;
  }> {
    try {
      // Mock product validation for development
      const mockProducts: { [key: string]: any } = {
        'prod_001': {
          id: 'prod_001',
          name: 'African Print Dress',
          price: 45.99,
          stock: 10,
          vendor: 'Lagos Fashion Store',
          category: 'Clothing',
          image: '/api/placeholder/150/150'
        },
        'prod_002': {
          id: 'prod_002',
          name: 'Handwoven Basket',
          price: 25.50,
          stock: 5,
          vendor: 'Accra Crafts',
          category: 'Home & Decor',
          image: '/api/placeholder/150/150'
        },
        'prod_003': {
          id: 'prod_003',
          name: 'Kente Cloth Scarf',
          price: 35.00,
          stock: 8,
          vendor: 'Ghana Textiles',
          category: 'Accessories',
          image: '/api/placeholder/150/150'
        }
      };

      const product = mockProducts[productId];
      
      if (!product) {
        return { isValid: false, error: 'Product not found' };
      }

      if (product.stock < quantity) {
        return { isValid: false, error: 'Insufficient stock' };
      }

      return { isValid: true, product };
    } catch (error) {
      logger.error('Product validation error', { error, productId });
      return { isValid: false, error: 'Validation failed' };
    }
  }

  // Check if items are still available and prices are current
  static async validateCartItems(items: CartItemData[]): Promise<{
    validItems: CartItemData[];
    invalidItems: { item: CartItemData; reason: string }[];
    priceChanges: { item: CartItemData; oldPrice: number; newPrice: number }[];
  }> {
    const validItems: CartItemData[] = [];
    const invalidItems: { item: CartItemData; reason: string }[] = [];
    const priceChanges: { item: CartItemData; oldPrice: number; newPrice: number }[] = [];

    for (const item of items) {
      const validation = await this.validateCartItem(item.productId, item.quantity);
      
      if (!validation.isValid) {
        invalidItems.push({ item, reason: validation.error || 'Unknown error' });
        continue;
      }

      if (validation.product && validation.product.price !== item.price) {
        priceChanges.push({
          item,
          oldPrice: item.price,
          newPrice: validation.product.price
        });
        // Update item with new price
        item.price = validation.product.price;
      }

      validItems.push(item);
    }

    return { validItems, invalidItems, priceChanges };
  }

  // Apply shipping rules
  static calculateShipping(subtotal: number, items: CartItemData[]): number {
    // Free shipping over $50
    if (subtotal >= 50) {
      return 0;
    }

    // Standard shipping rate
    let shipping = 5.99;

    // Additional charges for heavy items (mock logic)
    const heavyItems = items.filter(item => 
      item.category === 'Home & Decor' && item.quantity > 1
    );
    
    if (heavyItems.length > 0) {
      shipping += heavyItems.length * 2.00;
    }

    return Math.round(shipping * 100) / 100;
  }

  // Validate and apply coupon
  static validateCoupon(couponCode: string, subtotal: number): {
    isValid: boolean;
    discount: number;
    error?: string;
  } {
    // Mock coupon system
    const coupons: { [key: string]: { 
      discount: number; 
      type: 'percentage' | 'fixed';
      minOrder?: number;
      maxDiscount?: number;
    } } = {
      'WELCOME10': { discount: 10, type: 'percentage', minOrder: 25 },
      'SAVE5': { discount: 5, type: 'fixed' },
      'NEWUSER': { discount: 15, type: 'percentage', minOrder: 50, maxDiscount: 20 },
      'FREESHIP': { discount: 5.99, type: 'fixed' } // Free shipping equivalent
    };

    const coupon = coupons[couponCode.toUpperCase()];
    
    if (!coupon) {
      return { isValid: false, discount: 0, error: 'Invalid coupon code' };
    }

    if (coupon.minOrder && subtotal < coupon.minOrder) {
      return { 
        isValid: false, 
        discount: 0, 
        error: `Minimum order of $${coupon.minOrder} required` 
      };
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = subtotal * (coupon.discount / 100);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discount;
    }

    return { isValid: true, discount: Math.round(discount * 100) / 100 };
  }
}