import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, FormError, FormSuccess } from '../Form';
import api from '../../lib/api';
import './AuthForms.css';

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

interface EmailRegistrationFormProps {
  agreedToTerms: boolean;
}

const EmailRegistrationForm: React.FC<EmailRegistrationFormProps> = ({ agreedToTerms }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return passwordRequirements.every(req => req.test(password));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
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
      const response = await api.post('/auth/register/email', {
        email: formData.email,
        password: formData.password,
        acceptedTerms: true // Required by backend validation
      });

      setSuccess('Registration successful! Please check your email to verify your account.');
      
      // Redirect to verification page after 2 seconds
      setTimeout(() => {
        navigate('/verify-email', { state: { email: formData.email } });
      }, 2000);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('An account with this email already exists. Please try logging in instead.');
      } else if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Register with Email</h2>
      
      {error && <FormError message={error} />}
      {success && <FormSuccess message={success} />}

      <Input
        label="Email Address"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="your.email@example.com"
        required
      />

      <div className="password-field-container">
        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onFocus={() => setShowPasswordRequirements(true)}
          placeholder="Enter your password"
          required
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
        label="Confirm Password"
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Confirm your password"
        required
      />

      <Button 
        type="submit" 
        fullWidth 
        isLoading={isLoading}
        disabled={isLoading}
      >
        Register
      </Button>
    </form>
  );
};

export default EmailRegistrationForm;
