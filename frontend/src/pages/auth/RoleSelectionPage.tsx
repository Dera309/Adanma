import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, FormError, FormSuccess } from '../../components/Form';
import axios from 'axios';
import './RoleSelectionPage.css';

type Role = 'buyer' | 'vendor';

interface RoleOption {
  value: Role;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

const roleOptions: RoleOption[] = [
  {
    value: 'buyer',
    title: 'Buyer',
    description: 'Shop from verified vendors across Africa',
    icon: '🛍️',
    features: [
      'Browse products from multiple countries',
      'Secure payment processing',
      'Order tracking and history',
      'Save favorite products',
      'Multiple delivery addresses'
    ]
  },
  {
    value: 'vendor',
    title: 'Vendor',
    description: 'Sell your products to customers across Africa',
    icon: '🏪',
    features: [
      'List and manage products',
      'Reach customers in 6 countries',
      'Vendor verification badge',
      'Order management dashboard',
      'Sales analytics and reports'
    ]
  }
];

const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleRole = (role: Role) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (selectedRoles.length === 0) {
      setError('Please select at least one role');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/users/role`,
        { roles: selectedRoles.join(',') }, // Convert array to comma-separated string
        { withCredentials: true }
      );

      setSuccess('Roles updated successfully! Redirecting to dashboard...');
      
      // Update user in auth context
      if (response.data.user) {
        updateUser(response.data.user);
      }

      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to update roles. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="role-selection-page">
      <div className="role-selection-container">
        <div className="role-selection-header">
          <h1>Choose Your Role</h1>
          <p>Select how you want to use African E-commerce. You can choose both!</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <FormError message={error} />}
          {success && <FormSuccess message={success} />}

          <div className="role-options">
            {roleOptions.map((option) => (
              <div
                key={option.value}
                className={`role-card ${selectedRoles.includes(option.value) ? 'role-card-selected' : ''}`}
                onClick={() => toggleRole(option.value)}
              >
                <div className="role-card-header">
                  <div className="role-icon">{option.icon}</div>
                  <div className="role-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(option.value)}
                      onChange={() => toggleRole(option.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                
                <h3>{option.title}</h3>
                <p className="role-description">{option.description}</p>
                
                <div className="role-features">
                  <h4>Features:</h4>
                  <ul>
                    {option.features.map((feature, index) => (
                      <li key={index}>
                        <span className="feature-icon">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="role-selection-info">
            <p>
              <strong>Note:</strong> You can select both roles if you want to buy and sell on the platform.
              You can also change your roles later in your profile settings.
            </p>
          </div>

          <Button 
            type="submit" 
            fullWidth 
            size="large"
            isLoading={isLoading}
            disabled={isLoading || selectedRoles.length === 0}
          >
            Continue to Dashboard
          </Button>

          {user && (
            <button
              type="button"
              className="skip-button"
              onClick={() => navigate('/dashboard')}
            >
              Skip for now
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
