import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input, Button, FormError, FormSuccess } from '../../components/Form';
import axios from 'axios';
import './ResetPasswordPage.css';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains number', test: (p) => /\d/.test(p) },
  { label: 'Contains special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) }
];

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    code: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    // Check if we have a token in URL (for email reset)
    const token = searchParams.get('token');
    if (token) {
      setHasToken(true);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validatePassword = (password: string): boolean => {
    return passwordRequirements.every(req => req.test(password));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!hasToken && !formData.code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Password does not meet requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const token = searchParams.get('token');
      
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/password/reset`,
        {
          token: token || undefined,
          code: !token ? formData.code : undefined,
          password: formData.password
        }
      );

      setSuccess('Password reset successful! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-header">
          <div className="icon">🔑</div>
          <h1>Reset Your Password</h1>
          <p>Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          {error && <FormError message={error} />}
          {success && <FormSuccess message={success} />}

          {!hasToken && (
            <Input
              label="Verification Code"
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Enter the code from your SMS"
              required
              disabled={isLoading}
            />
          )}

          <div className="password-field-container">
            <Input
              label="New Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setShowPasswordRequirements(true)}
              placeholder="Enter your new password"
              required
              disabled={isLoading}
            />
            
            {showPasswordRequirements && (
              <div className="password-requirements">
                <p className="requirements-title">Password must contain:</p>
                <ul className="requirements-list">
                  {passwordRequirements.map((req, index) => (
                    <li 
                      key={index}
                      className={req.test(formData.password) ? 'requirement-met' : 'requirement-unmet'}
                    >
                      <span className="requirement-icon">
                        {req.test(formData.password) ? '✓' : '○'}
                      </span>
                      {req.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Input
            label="Confirm New Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your new password"
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            fullWidth
            size="large"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Reset Password
          </Button>
        </form>

        <div className="reset-password-footer">
          <p>
            Remember your password?{' '}
            <a href="/login">Back to Login</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
