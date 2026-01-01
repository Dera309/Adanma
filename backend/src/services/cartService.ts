import prisma from '../config/database';
import { logger } from '../utils/logger';

export interface EnhancedCartData {
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
  recommendations: ProductRecommendation[];
  analytics: CartAnalytics;
  loyaltyPoints: {
    earned: number;
    available: number;
    canRedeem: boolean;
  };
  savedItems: CartItem[];
}

interface CartItem {
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

interface AppliedCoupon {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed' | 'shipping';
  appliedAt: Date;
  validUntil?: Date;
  description?: string;
}

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: number;
  carrier: string;
  trackingAvailable: boolean;
}

interface ProductRecommendation {
  id: string;
  name: string;
  price: number;
  image: string;
  vendor: string;
  rating: number;
  reason: 'frequently_bought_together' | 'similar_products' | 'trending' | 'vendor_special';
}

interface CartAnalytics {
  totalValue: number;
  averageItemPrice: number;
  mostExpensiveItem: string;
  categoryBreakdown: { [category: string]: number };
  vendorBreakdown: { [vendor: string]: number };
  potentialSavings: number;
  abandonmentRisk: 'low' | 'medium' | 'high';
}

export class EnhancedCartService {
  async getEnhancedCart(userId: string): Promise<EnhancedCartData> {
    try {
      // Try to get cart from database
      const cart = await this.getCartFromDatabase(userId);
      if (cart) {
        return cart;
      }
    } catch (error) {
      logger.warn('Database unavailable, using enhanced mock data', { error, userId });
    }

    // Return enhanced mock data
    return this.getEnhancedMockCart(userId);
  }

  private async getCartFromDatabase(userId: string): Promise<EnhancedCartData | null> {
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
      return this.getEnhancedMockCart(userId);
    }

    const items: CartItem[] = cart.items.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      originalPrice: item.product.originalPrice,
      quantity: item.quantity,
      maxQuantity: item.product.stockQuantity,
      image: item.product.images?.[0]?.url || 'https://picsum.photos/300/300?random=1',
      images: item.product.images?.map(img => img.url) || [],
      vendor: item.product.vendor?.name || 'Unknown Vendor',
      vendorId: item.product.vendorId,
      category: item.product.category?.name || 'Uncategorized',
      categoryId: item.product.categoryId,
      inStock: item.product.stockQuantity > 0,
      stockQuantity: item.product.stockQuantity,
      sku: item.product.sku,
      weight: item.product.weight,
      dimensions: item.product.dimensions,
      attributes: item.attributes,
      discount: item.product.discount,
      addedAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = cart.appliedCoupons?.reduce((sum, coupon) => {
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
      shippingOptions: this.getShippingOptions(),
      estimatedDelivery: {
        min: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        max: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      cartId: cart.id,
      lastUpdated: cart.updatedAt,
      recommendations: await this.getRecommendations(userId, items),
      analytics: this.calculateAnalytics(items),
      loyaltyPoints: await this.getLoyaltyPoints(userId, total),
      savedItems: await this.getSavedItems(userId)
    };
  }

  private getEnhancedMockCart(userId: string): EnhancedCartData {
    const mockItems: CartItem[] = [
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
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: 'Welcome discount - 10% off your order'
      }
    ];

    const subtotal = mockItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = appliedCoupons.reduce((sum, coupon) => {
      if (coupon.type === 'percentage') {
        return sum + (subtotal * coupon.discount / 100);
      }
      return sum + coupon.discount;
    }, 0);

    const discountedSubtotal = subtotal - discountAmount;
    const shipping = discountedSubtotal > 50 ? 0 : 5.99;
    const shippingDiscount = discountedSubtotal > 50 ? 5.99 : 0;
    const tax = discountedSubtotal * 0.08;
    const total = discountedSubtotal + shipping + tax;
    const totalWeight = mockItems.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);

    return {
      items: mockItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      shippingDiscount: Math.round(shippingDiscount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount: mockItems.reduce((sum, item) => sum + item.quantity, 0),
      totalWeight: Math.round(totalWeight * 100) / 100,
      appliedCoupons,
      shippingOptions: this.getShippingOptions(),
      estimatedDelivery: {
        min: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        max: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      cartId: `cart_${userId}_enhanced`,
      lastUpdated: new Date(),
      recommendations: this.getMockRecommendations(),
      analytics: this.calculateAnalytics(mockItems),
      loyaltyPoints: {
        earned: Math.floor(total * 0.05), // 5% of total as points
        available: 150,
        canRedeem: true
      },
      savedItems: this.getMockSavedItems()
    };
  }

  private getShippingOptions(): ShippingOption[] {
    return [
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
  }

  private async getRecommendations(userId: string, cartItems: CartItem[]): Promise<ProductRecommendation[]> {
    // In a real implementation, this would use ML algorithms
    return this.getMockRecommendations();
  }

  private getMockRecommendations(): ProductRecommendation[] {
    return [
      {
        id: 'rec_001',
        name: 'Matching Ankara Headwrap',
        price: 15.99,
        image: 'https://picsum.photos/200/200?random=7',
        vendor: 'Lagos Fashion Store',
        rating: 4.8,
        reason: 'frequently_bought_together'
      },
      {
        id: 'rec_002',
        name: 'African Jewelry Set',
        price: 29.99,
        image: 'https://picsum.photos/200/200?random=8',
        vendor: 'Accra Crafts Co.',
        rating: 4.6,
        reason: 'similar_products'
      },
      {
        id: 'rec_003',
        name: 'Traditional Sandals',
        price: 39.99,
        image: 'https://picsum.photos/200/200?random=9',
        vendor: 'Kenya Leather Works',
        rating: 4.7,
        reason: 'trending'
      }
    ];
  }

  private calculateAnalytics(items: CartItem[]): CartAnalytics {
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const averageItemPrice = totalValue / items.length;
    const mostExpensiveItem = items.reduce((max, item) => 
      item.price > max.price ? item : max, items[0]
    ).name;

    const categoryBreakdown: { [category: string]: number } = {};
    const vendorBreakdown: { [vendor: string]: number } = {};

    items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + itemTotal;
      vendorBreakdown[item.vendor] = (vendorBreakdown[item.vendor] || 0) + itemTotal;
    });

    const potentialSavings = items.reduce((sum, item) => {
      if (item.originalPrice && item.originalPrice > item.price) {
        return sum + ((item.originalPrice - item.price) * item.quantity);
      }
      return sum;
    }, 0);

    // Simple abandonment risk calculation
    const abandonmentRisk: 'low' | 'medium' | 'high' = 
      totalValue > 100 ? 'low' : 
      totalValue > 50 ? 'medium' : 'high';

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      averageItemPrice: Math.round(averageItemPrice * 100) / 100,
      mostExpensiveItem,
      categoryBreakdown,
      vendorBreakdown,
      potentialSavings: Math.round(potentialSavings * 100) / 100,
      abandonmentRisk
    };
  }

  private async getLoyaltyPoints(userId: string, total: number): Promise<{
    earned: number;
    available: number;
    canRedeem: boolean;
  }> {
    try {
      // Try to get from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true }
      });

      return {
        earned: Math.floor(total * 0.05), // 5% of total as points
        available: user?.loyaltyPoints || 150,
        canRedeem: (user?.loyaltyPoints || 150) >= 100
      };
    } catch (error) {
      // Fallback to mock data
      return {
        earned: Math.floor(total * 0.05),
        available: 150,
        canRedeem: true
      };
    }
  }

  private async getSavedItems(userId: string): Promise<CartItem[]> {
    try {
      // Try to get from database
      const savedItems = await prisma.savedItem.findMany({
        where: { userId },
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

      return savedItems.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        price: item.product.price,
        originalPrice: item.product.originalPrice,
        quantity: 1,
        maxQuantity: item.product.stockQuantity,
        image: item.product.images?.[0]?.url || 'https://picsum.photos/300/300?random=10',
        images: item.product.images?.map(img => img.url) || [],
        vendor: item.product.vendor?.name || 'Unknown Vendor',
        vendorId: item.product.vendorId,
        category: item.product.category?.name || 'Uncategorized',
        categoryId: item.product.categoryId,
        inStock: item.product.stockQuantity > 0,
        stockQuantity: item.product.stockQuantity,
        sku: item.product.sku,
        weight: item.product.weight,
        dimensions: item.product.dimensions,
        attributes: {},
        addedAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    } catch (error) {
      return this.getMockSavedItems();
    }
  }

  private getMockSavedItems(): CartItem[] {
    return [
      {
        id: 'saved_001',
        productId: 'prod_saved_001',
        name: 'African Print Bag - Wax Design',
        price: 32.99,
        originalPrice: 39.99,
        quantity: 1,
        maxQuantity: 8,
        image: 'https://picsum.photos/300/300?random=11',
        images: ['https://picsum.photos/300/300?random=11'],
        vendor: 'Nairobi Accessories',
        vendorId: 'vendor_saved_001',
        category: 'Accessories',
        categoryId: 'cat_accessories',
        inStock: true,
        stockQuantity: 8,
        sku: 'APB-WAX-001',
        weight: 0.4,
        attributes: {
          color: 'Blue & Yellow',
          material: 'Wax Print Cotton',
          size: 'Medium'
        },
        addedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];
  }
}