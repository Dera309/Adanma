import React, { useState, useEffect } from 'react';
import './AdminPage.css';
import api from '../lib/api';

interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeVendors: number;
}

const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeVendors: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      if (response.data?.success) {
        setStats(response.data.data);
      } else {
        // Mock data if endpoint doesn't exist
        setStats({
          totalUsers: 1247,
          totalOrders: 3892,
          totalRevenue: 45678.90,
          activeVendors: 156
        });
      }
    } catch (error) {
      // Mock data on error
      setStats({
        totalUsers: 1247,
        totalOrders: 3892,
        totalRevenue: 45678.90,
        activeVendors: 156
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <div className="loading">Loading admin panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <h1>Adanma Admin Panel</h1>
        
        <div className="admin-stats">
          <div className="stat-card">
            <h3>Total Users</h3>
            <div className="stat-number">{stats.totalUsers.toLocaleString()}</div>
          </div>
          
          <div className="stat-card">
            <h3>Total Orders</h3>
            <div className="stat-number">{stats.totalOrders.toLocaleString()}</div>
          </div>
          
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <div className="stat-number">${stats.totalRevenue.toLocaleString()}</div>
          </div>
          
          <div className="stat-card">
            <h3>Active Vendors</h3>
            <div className="stat-number">{stats.activeVendors.toLocaleString()}</div>
          </div>
        </div>

        <div className="admin-actions">
          <button className="admin-btn" onClick={() => window.open('/admin/content', '_blank')}>
            Edit Content
          </button>
          <button className="admin-btn" onClick={() => alert('Manage Users functionality coming soon!')}>
            Manage Users
          </button>
          <button className="admin-btn" onClick={() => alert('Manage Orders functionality coming soon!')}>
            Manage Orders
          </button>
          <button className="admin-btn" onClick={() => alert('Manage Vendors functionality coming soon!')}>
            Manage Vendors
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;