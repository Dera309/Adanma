import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  savedItems: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
  }>;
}

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/users/dashboard');
      if (response.data?.success) {
        setStats(response.data.data);
      } else {
        // Mock data
        setStats({
          totalOrders: 3,
          totalSpent: 156.48,
          savedItems: 5,
          recentActivity: [
            {
              id: '1',
              type: 'order',
              description: 'Order #2 placed successfully',
              date: '2025-12-20T14:30:00Z'
            },
            {
              id: '2',
              type: 'cart',
              description: 'Added Kente Cloth Scarf to cart',
              date: '2025-12-20T10:15:00Z'
            },
            {
              id: '3',
              type: 'profile',
              description: 'Profile updated',
              date: '2025-12-19T16:45:00Z'
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setStats({
        totalOrders: 0,
        totalSpent: 0,
        savedItems: 0,
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Dashboard</h1>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', background: '#0D0D0D', minHeight: '100vh' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#FFFFFF' }}>Welcome back, {user?.email || user?.phoneNumber}!</h1>
        <p style={{ color: '#B0B0B0' }}>Here's what's happening with your account</p>
      </div>
      
      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px'
      }}>
        <div style={{ backgroundColor: '#1E1E1E', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid #2A2A2A' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2ECC71' }}>Total Orders</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFFFFF' }}>{stats?.totalOrders || 0}</div>
        </div>
        
        <div style={{ backgroundColor: '#1E1E1E', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid #2A2A2A' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#00BFFF' }}>Total Spent</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFFFFF' }}>${stats?.totalSpent?.toFixed(2) || '0.00'}</div>
        </div>
        
        <div style={{ backgroundColor: '#1E1E1E', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid #2A2A2A' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>Saved Items</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFFFFF' }}>{stats?.savedItems || 0}</div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '2fr 1fr', 
        gap: '20px' 
      }}>
        {/* Account Info */}
        <div style={{ backgroundColor: '#1E1E1E', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid #2A2A2A' }}>
          <h2 style={{ marginTop: 0, color: '#FFFFFF' }}>Your Account</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#B0B0B0' }}>Roles:</span>
              <span style={{ fontWeight: 'bold', color: '#FFFFFF' }}>{user?.roles || 'Buyer'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#B0B0B0' }}>Email Verified:</span>
              <span style={{ color: user?.emailVerified ? '#2ECC71' : '#ef4444' }}>
                {user?.emailVerified ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#B0B0B0' }}>Phone Verified:</span>
              <span style={{ color: user?.phoneVerified ? '#2ECC71' : '#ef4444' }}>
                {user?.phoneVerified ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#B0B0B0' }}>Verification Status:</span>
              <span style={{ fontWeight: 'bold', color: '#FFFFFF' }}>{user?.verificationStatus || 'Unverified'}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ backgroundColor: '#1E1E1E', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid #2A2A2A' }}>
          <h2 style={{ marginTop: 0, color: '#FFFFFF' }}>Recent Activity</h2>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.recentActivity.map(activity => (
                <div key={activity.id} style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{activity.description}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(activity.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#B0B0B0' }}>No recent activity</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => window.location.href = '/cart'}
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
          View Cart
        </button>
        <button 
          onClick={() => window.location.href = '/orders'}
          style={{
            backgroundColor: '#00BFFF',
            color: '#0D0D0D',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          My Orders
        </button>
        <button 
          onClick={() => window.location.href = '/profile'}
          style={{
            backgroundColor: '#FFD700',
            color: '#0D0D0D',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;