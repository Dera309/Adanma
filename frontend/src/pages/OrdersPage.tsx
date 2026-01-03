import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.data?.orders || data.data || []);
      } else {
        // Mock data
        setOrders([
          {
            id: '1',
            status: 'delivered',
            total: 75.99,
            createdAt: '2025-12-15T10:00:00Z',
            items: [
              { name: 'African Print Dress', quantity: 1, price: 45.99 },
              { name: 'Handwoven Basket', quantity: 1, price: 30.00 }
            ]
          },
          {
            id: '2',
            status: 'pending',
            total: 35.00,
            createdAt: '2025-12-20T14:30:00Z',
            items: [
              { name: 'Kente Cloth Scarf', quantity: 1, price: 35.00 }
            ]
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', background: '#0D0D0D', minHeight: '100vh' }}>
        <h1 style={{ color: '#FFFFFF' }}>My Orders</h1>
        <p style={{ color: '#B0B0B0' }}>Loading orders...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', background: '#0D0D0D', minHeight: '100vh' }}>
      <h1 style={{ color: '#FFFFFF' }}>My Orders</h1>
      
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#B0B0B0' }}>No orders found. Start shopping to see your orders here!</p>
          <button 
            onClick={() => window.location.href = '/'}
            style={{
              backgroundColor: '#2ECC71',
              color: '#0D0D0D',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div>
          {orders.map(order => (
            <div key={order.id} style={{
              border: '1px solid #2A2A2A',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              backgroundColor: '#1E1E1E'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ color: '#FFFFFF' }}>Order #{order.id}</h3>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: order.status === 'delivered' ? '#2ECC71' : '#FFD700',
                  color: order.status === 'delivered' ? '#0D0D0D' : '#0D0D0D'
                }}>
                  {order.status.toUpperCase()}
                </span>
              </div>
              
              <p style={{ color: '#B0B0B0', marginBottom: '15px' }}>
                Ordered on {new Date(order.createdAt).toLocaleDateString()}
              </p>
              
              <div style={{ marginBottom: '15px' }}>
                {(order.items || []).map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#FFFFFF' }}>{item.name || 'Unknown Item'} (x{item.quantity || 1})</span>
                    <span style={{ color: '#FFFFFF' }}>${(item.price || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#FFFFFF' }}>
                <span>Total:</span>
                <span>${(order.total || order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;