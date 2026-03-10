import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  transactionId: string;
  estimatedDelivery: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

const OrderSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();
        if (result.success) {
          setOrder(result.data.order);
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading order details...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '4rem', color: '#28a745', marginBottom: '1rem' }}>✅</div>
        <h1 style={{ color: '#28a745', marginBottom: '0.5rem' }}>Order Confirmed!</h1>
        <p style={{ color: '#666' }}>Thank you for your purchase</p>
      </div>

      {order && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Order Details</h2>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Order ID:</strong> {order.id}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Transaction ID:</strong> {order.transactionId}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Total Amount:</strong> ${order.totalAmount.toFixed(2)}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Status:</strong> <span style={{ color: '#28a745', textTransform: 'capitalize' }}>{order.status}</span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Estimated Delivery:</strong> {new Date(order.estimatedDelivery).toLocaleDateString()}
          </div>
          
          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Items Ordered:</h3>
          {order.items.map((item, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '0.5rem 0',
              borderBottom: '1px solid #eee'
            }}>
              <span>{item.name} (x{item.quantity})</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <Link 
          to="/dashboard" 
          style={{ 
            display: 'inline-block',
            backgroundColor: '#007bff',
            color: 'white',
            padding: '0.75rem 1.5rem',
            textDecoration: 'none',
            borderRadius: '4px',
            marginRight: '1rem'
          }}
        >
          View All Orders
        </Link>
        <Link 
          to="/" 
          style={{ 
            display: 'inline-block',
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '0.75rem 1.5rem',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccessPage;