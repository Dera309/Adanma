import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Button, FormError, FormSuccess } from '../Form';
import api from '../../lib/api';
import './AuthForms.css';

interface CountryCode {
  country: string;
  code: string;
  flag: string;
}

const countryCodes: CountryCode[] = [
  { country: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { country: 'Ghana', code: '+233', flag: '🇬🇭' },
  { country: 'Kenya', code: '+254', flag: '🇰🇪' },
  { country: 'South Africa', code: '+27', flag: '🇿🇦' },
  { country: 'Cameroon', code: '+237', flag: '🇨🇲' },
  { country: 'Egypt', code: '+20', flag: '🇪🇬' }
];

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

interface PhoneRegistrationFormProps {
  agreedToTerms: boolean;
}

const PhoneRegistrationForm: React.FC<PhoneRegistrationFormProps> = ({ agreedToTerms }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    countryCode: '+234',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    // Phone number should be between 7 and 15 digits
    return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  };

  const validatePassword = (password: string): boolean => {
    return passwordRequirements.every(req => req.test(password));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.phoneNumber || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Please enter a valid phone number');
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
      const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;
      
      const response = await api.post('/auth/register/phone', {
        phoneNumber: fullPhoneNumber,
        password: formData.password,
        acceptedTerms: true // Required by backend validation
      });

      setSuccess('Registration successful! Please check your phone for a verification code.');
      
      // Redirect to verification page after 2 seconds
      setTimeout(() => {
        navigate('/verify-phone', { 
          state: { 
            phoneNumber: fullPhoneNumber,
            userId: response.data.data?.userId 
          } 
        });
      }, 2000);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('An account with this phone number already exists. Please try logging in instead.');
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
      <h2>Register with Phone Number</h2>
      
      {error && <FormError message={error} />}
      {success && <FormSuccess message={success} />}

      <div className="phone-input-group">
        <div className="country-code-select">
          <Select
            label="Country"
            name="countryCode"
            value={formData.countryCode}
            onChange={handleChange}
            required
            options={countryCodes.map((country) => ({
              value: country.code,
              label: `${country.flag} ${country.code}`
            }))}
          />
        </div>

        <div className="phone-number-input">
          <Input
            label="Phone Number"
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="8012345678"
            required
          />
        </div>
      </div>

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

export default PhoneRegistrationForm;
