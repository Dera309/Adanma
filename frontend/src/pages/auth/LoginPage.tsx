import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input, Button, FormError } from '../../components/Form';
import './LoginPage.css';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by AuthContext
      console.error('Login error:', err);
    }
  };

  const handleSocialLogin = (provider: 'whatsapp' | 'facebook') => {
    // Redirect to OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/${provider}`;
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Login to your African E-commerce account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <FormError message={error} onClose={clearError} />}

          <Input
            label="Email or Phone Number"
            type="text"
            name="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            placeholder="Enter your email or phone number"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />

          <div className="forgot-password-link">
            <Link to="/forgot-password">Forgot your password?</Link>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
            size="large"
          >
            Login
          </Button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="social-login-section">
          <h3>Login with Social Account</h3>
          
          <div className="social-login-buttons">
            <button
              type="button"
              className="social-login-button whatsapp-login"
              onClick={() => handleSocialLogin('whatsapp')}
            >
              <span className="social-icon">💬</span>
              <span>Continue with WhatsApp</span>
            </button>

            <button
              type="button"
              className="social-login-button facebook-login"
              onClick={() => handleSocialLogin('facebook')}
            >
              <span className="social-icon">👤</span>
              <span>Continue with Facebook</span>
            </button>
          </div>
        </div>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register">Create one here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
