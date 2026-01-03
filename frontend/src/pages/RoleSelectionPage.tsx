import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['BUYER']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = (role: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRoles.length === 0) {
      setError('Please select at least one role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.put('/users/role', { roles: selectedRoles });
      
      if (response.data.success) {
        // Update user context with new roles
        const updatedUser = {
          ...user!,
          roles: (selectedRoles as string[]).join(',')
        };
        updateUser(updatedUser);
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError(response.data.error?.message || 'Failed to update roles');
      }
    } catch (error: any) {
      setError(error.error?.message || 'Failed to update roles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Select Your Role</h1>
      <p>Choose how you want to use Adanma:</p>

      <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedRoles.includes('BUYER')}
              onChange={() => handleRoleChange('BUYER')}
              style={{ marginRight: '0.5rem' }}
            />
            <div>
              <strong>Buyer</strong>
              <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                Shop for products from African vendors
              </p>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedRoles.includes('VENDOR')}
              onChange={() => handleRoleChange('VENDOR')}
              style={{ marginRight: '0.5rem' }}
            />
            <div>
              <strong>Vendor</strong>
              <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                Sell your products to customers across Africa
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fee', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || selectedRoles.length === 0}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: selectedRoles.length > 0 ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedRoles.length > 0 ? 'pointer' : 'not-allowed',
            fontSize: '1rem'
          }}
        >
          {loading ? 'Updating...' : 'Continue'}
        </button>
      </form>
    </div>
  );
};

export default RoleSelectionPage;