import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CheckoutPage.css';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    country: 'Nigeria',
    phoneNumber: '',
    paymentMethod: 'card'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Please log in to place an order');
        navigate('/login');
        return;
      }

      // Get cart items from localStorage or API
      const cartData = localStorage.getItem('cart');
      const items = cartData ? JSON.parse(cartData) : [];
      
      if (items.length === 0) {
        alert('Your cart is empty');
        navigate('/cart');
        return;
      }

      const orderData = {
        items,
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          email: formData.email
        },
        paymentMethod: formData.paymentMethod,
        totalAmount: 71.49, // Calculate from cart items
        customerEmail: formData.email,
        phoneNumber: formData.phoneNumber || '+234000000000'
      };

      const response = await fetch('http://localhost:5002/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        // Clear cart after successful order
        localStorage.removeItem('cart');
        navigate(`/order-success?orderId=${result.data.order.id}`);
      } else {
        alert(result.error?.message || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Order error:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Checkout</h1>
          <button onClick={() => navigate('/cart')} className="back-btn">
            ← Back to Cart
          </button>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="form-section">
            <h2>Contact Information</h2>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            {formData.paymentMethod === 'mobile' && (
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Phone number (for mobile money)"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
              />
            )}
          </div>

          <div className="form-section">
            <h2>Shipping Address</h2>
            <div className="form-row">
              <input
                type="text"
                name="firstName"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleInputChange}
              required
            />
            <div className="form-row">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleInputChange}
                required
              />
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
              >
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
                <option value="Kenya">Kenya</option>
                <option value="South Africa">South Africa</option>
                <option value="Cameroon">Cameroon</option>
                <option value="Egypt">Egypt</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h2>Payment Method</h2>
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === 'card'}
                  onChange={handleInputChange}
                />
                <span>Credit/Debit Card</span>
              </label>
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mobile"
                  checked={formData.paymentMethod === 'mobile'}
                  onChange={handleInputChange}
                />
                <span>Mobile Money (MTN, Airtel, Vodafone)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="place-order-btn"
            disabled={loading}
          >
            {loading ? 'Processing Order...' : 'Place Order - $71.49'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;