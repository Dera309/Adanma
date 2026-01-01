import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

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
  recommendations?: ProductRecommendation[];
  analytics?: ItemAnalytics;
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

interface ItemAnalytics {
  viewCount: number;
  addedToCartCount: number;
  purchaseCount: number;
  averageRating: number;
  reviewCount: number;
  lastViewed?: Date;
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

interface CartSummary {
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
  recommendations?: ProductRecommendation[];
  analytics?: CartAnalytics;
  loyaltyPoints?: {
    earned: number;
    available: number;
    canRedeem: boolean;
  };
  savedItems?: CartItem[];
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<string>('standard');
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [showSavedItems, setShowSavedItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_URL}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      const result = await response.json();
      if (result.success) {
        setCartData(result.data);
        if (result.data.shippingOptions?.length > 0) {
          setSelectedShipping(result.data.shippingOptions[0].id);
        }
      } else {
        setError(result.error?.message || 'Failed to load cart');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Failed to load cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(itemId);
      return;
    }

    try {
      setUpdating(itemId);
      const token = localStorage.getItem('token');
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      const result = await response.json();
      if (result.success) {
        // Update local state
        setCartData(prev => {
          if (!prev) return prev;
          const updatedItems = prev.items.map(item => 
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          );
          return {
            ...prev,
            items: updatedItems,
            subtotal: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0)
          };
        });
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Failed to update quantity. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setUpdating(itemId);
      const token = localStorage.getItem('token');
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      const result = await response.json();
      if (result.success) {
        // Update local state
        setCartData(prev => {
          if (!prev) return prev;
          const updatedItems = prev.items.filter(item => item.id !== itemId);
          return {
            ...prev,
            items: updatedItems,
            subtotal: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0)
          };
        });
      }
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      setCouponLoading(true);
      const token = localStorage.getItem('token');
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_URL}/api/cart/coupon`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ couponCode: couponCode.trim() })
      });

      const result = await response.json();
      if (result.success) {
        setCouponCode('');
        fetchCart(); // Refresh cart to show updated totals
      } else {
        setError(result.error?.message || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setError('Failed to apply coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const saveForLater = async (itemId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_URL}/api/cart/items/${itemId}/save-later`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const item = cartData?.items.find(i => i.id === itemId);
        if (item) {
          setSavedItems(prev => [...prev, item]);
          removeItem(itemId);
        }
      }
    } catch (error) {
      console.error('Error saving item for later:', error);
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_URL}/api/cart`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setCartData(prev => prev ? { ...prev, items: [], itemCount: 0, subtotal: 0, total: 0 } : null);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const handleCheckout = () => {
    if (!cartData || cartData.items.length === 0) return;
    
    setLoading(true);
    // Pass cart data to checkout
    navigate('/checkout', { 
      state: { 
        cartData,
        selectedShipping: cartData.shippingOptions.find(opt => opt.id === selectedShipping)
      }
    });
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="error-message">
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <button onClick={() => { setError(null); fetchCart(); }} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <h1>Shopping Cart</h1>
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some amazing products to get started!</p>
            <button className="continue-shopping-btn" onClick={() => navigate('/')}>
              Continue Shopping
            </button>
            
            {savedItems.length > 0 && (
              <div className="saved-items-section">
                <h3>Saved for Later ({savedItems.length} items)</h3>
                <div className="saved-items-grid">
                  {savedItems.slice(0, 3).map(item => (
                    <div key={item.id} className="saved-item">
                      <img src={item.image} alt={item.name} />
                      <p>{item.name}</p>
                      <span>${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowSavedItems(true)} className="view-saved-btn">
                  View All Saved Items
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <h1>Shopping Cart ({cartData.itemCount} items)</h1>
          <div className="cart-actions">
            <button className="continue-shopping-link" onClick={() => navigate('/')}>
              ← Continue Shopping
            </button>
            <button className="clear-cart-btn" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </div>

        <div className="cart-content">
          <div className="cart-items">
            {cartData.items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  <img src={item.image} alt={item.name} />
                  {item.discount && (
                    <div className="discount-badge">
                      -{item.discount.value}{item.discount.type === 'percentage' ? '%' : '$'}
                    </div>
                  )}
                </div>
                
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p className="vendor">Sold by {item.vendor}</p>
                  <p className="sku">SKU: {item.sku}</p>
                  
                  {item.attributes && (
                    <div className="item-attributes">
                      {item.attributes.color && <span className="attribute">Color: {item.attributes.color}</span>}
                      {item.attributes.size && <span className="attribute">Size: {item.attributes.size}</span>}
                      {item.attributes.material && <span className="attribute">Material: {item.attributes.material}</span>}
                    </div>
                  )}
                  
                  <div className="price-info">
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="original-price">${item.originalPrice.toFixed(2)}</span>
                    )}
                    <span className="current-price">${item.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="stock-info">
                    {item.inStock ? (
                      <span className="in-stock">✓ In Stock ({item.stockQuantity} available)</span>
                    ) : (
                      <span className="out-of-stock">⚠️ Out of Stock</span>
                    )}
                  </div>
                </div>
                
                <div className="item-controls">
                  <div className="quantity-controls">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="qty-btn"
                      disabled={updating === item.id || item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="quantity">
                      {updating === item.id ? '...' : item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="qty-btn"
                      disabled={updating === item.id || item.quantity >= item.maxQuantity}
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="item-actions">
                    <button 
                      onClick={() => saveForLater(item.id)}
                      className="save-later-btn"
                      disabled={updating === item.id}
                    >
                      Save for Later
                    </button>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="remove-btn"
                      disabled={updating === item.id}
                    >
                      {updating === item.id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
                
                <div className="item-total">
                  <div className="item-subtotal">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  {item.weight && (
                    <div className="item-weight">
                      Weight: {(item.weight * item.quantity).toFixed(1)} kg
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-sidebar">
            {/* Coupon Section */}
            <div className="coupon-section">
              <h3>Promo Code</h3>
              <div className="coupon-input">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                />
                <button 
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="apply-coupon-btn"
                >
                  {couponLoading ? 'Applying...' : 'Apply'}
                </button>
              </div>
              
              {cartData.appliedCoupons.length > 0 && (
                <div className="applied-coupons">
                  <h4>Applied Coupons:</h4>
                  {cartData.appliedCoupons.map((coupon, index) => (
                    <div key={index} className="applied-coupon">
                      <span className="coupon-code">{coupon.code}</span>
                      <span className="coupon-discount">
                        -{coupon.discount}{coupon.type === 'percentage' ? '%' : '$'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shipping Options */}
            <div className="shipping-section">
              <h3>Shipping Options</h3>
              {cartData.shippingOptions.map(option => (
                <label key={option.id} className="shipping-option">
                  <input
                    type="radio"
                    name="shipping"
                    value={option.id}
                    checked={selectedShipping === option.id}
                    onChange={(e) => setSelectedShipping(e.target.value)}
                  />
                  <div className="shipping-info">
                    <div className="shipping-name">{option.name}</div>
                    <div className="shipping-details">
                      {option.price === 0 ? 'FREE' : `$${option.price.toFixed(2)}`} • 
                      {option.estimatedDays} {option.estimatedDays === 1 ? 'day' : 'days'}
                    </div>
                    <div className="shipping-carrier">{option.carrier}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Order Summary */}
            <div className="summary-card">
              <h3>Order Summary</h3>
              
              <div className="summary-row">
                <span>Subtotal ({cartData.itemCount} items):</span>
                <span>${cartData.subtotal.toFixed(2)}</span>
              </div>
              
              {cartData.discountAmount > 0 && (
                <div className="summary-row discount">
                  <span>Discount:</span>
                  <span>-${cartData.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="summary-row">
                <span>Shipping:</span>
                <span>
                  {cartData.shipping === 0 ? (
                    <span className="free-shipping">FREE</span>
                  ) : (
                    `$${cartData.shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              
              {cartData.shippingDiscount > 0 && (
                <div className="summary-row discount">
                  <span>Shipping Discount:</span>
                  <span>-${cartData.shippingDiscount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="summary-row">
                <span>Tax:</span>
                <span>${cartData.tax.toFixed(2)}</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total">
                <span>Total:</span>
                <span>${cartData.total.toFixed(2)}</span>
              </div>
              
              {cartData.totalWeight > 0 && (
                <div className="weight-info">
                  Total Weight: {cartData.totalWeight.toFixed(1)} kg
                </div>
              )}
              
              <div className="delivery-estimate">
                <h4>Estimated Delivery</h4>
                <p>
                  {(() => {
                    try {
                      const minDate = cartData.estimatedDelivery?.min ? new Date(cartData.estimatedDelivery.min).toLocaleDateString() : 'TBD';
                      const maxDate = cartData.estimatedDelivery?.max ? new Date(cartData.estimatedDelivery.max).toLocaleDateString() : 'TBD';
                      return `${minDate} - ${maxDate}`;
                    } catch {
                      return '2-7 business days';
                    }
                  })()} 
                </p>
              </div>
              
              <button 
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={loading || cartData.items.length === 0}
              >
                {loading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
              
              <div className="security-note">
                🔒 Secure checkout with 256-bit SSL encryption
              </div>
              
              <div className="payment-methods">
                <p>We accept:</p>
                <div className="payment-icons">
                  💳 💰 📱 🏦
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {cartData.shipping === 0 && cartData.subtotal > 50 && (
          <div className="free-shipping-banner">
            🎉 Congratulations! You qualify for free shipping!
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;