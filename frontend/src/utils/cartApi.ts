// API utility for cart operations
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

export const cartApi = {
  async getCart() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  async updateCartItem(itemId: string, quantity: number) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/cart/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quantity })
    });
    return response.json();
  },

  async removeCartItem(itemId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  async applyCoupon(couponCode: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/cart/coupon`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ couponCode })
    });
    return response.json();
  },

  async saveForLater(itemId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/cart/items/${itemId}/save-later`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  async clearCart() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};