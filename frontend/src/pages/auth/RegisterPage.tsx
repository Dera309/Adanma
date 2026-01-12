import { useState } from 'react';
import { Link } from 'react-router-dom';
import EmailRegistrationForm from '../../components/auth/EmailRegistrationForm';
import PhoneRegistrationForm from '../../components/auth/PhoneRegistrationForm';
import SocialAuthButtons from '../../components/auth/SocialAuthButtons';
import './RegisterPage.css';

type RegistrationMethod = 'email' | 'phone' | 'whatsapp' | 'facebook' | null;

const RegisterPage = () => {
  const [selectedMethod, setSelectedMethod] = useState<RegistrationMethod>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleMethodSelect = (method: RegistrationMethod) => {
    setSelectedMethod(method);
  };

  const handleSocialAuth = (provider: 'whatsapp' | 'facebook') => {
    if (!agreedToTerms) {
      alert('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    // Redirect to OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/${provider}`;
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Create Your Account</h1>
          <p>Join Africa's leading e-commerce marketplace</p>
        </div>

        {!selectedMethod ? (
          <div className="method-selection">
            <h2>Choose how to register</h2>
            
            <div className="method-buttons">
              <button 
                className="method-button"
                onClick={() => handleMethodSelect('email')}
              >
                <span className="method-icon">📧</span>
                <div className="method-content">
                  <h3>Email</h3>
                  <p>Register with your email address</p>
                </div>
              </button>

              <button 
                className="method-button"
                onClick={() => handleMethodSelect('phone')}
              >
                <span className="method-icon">📱</span>
                <div className="method-content">
                  <h3>Phone Number</h3>
                  <p>Register with your phone number</p>
                </div>
              </button>

              <button 
                className="method-button"
                onClick={() => handleMethodSelect('whatsapp')}
              >
                <span className="method-icon">💬</span>
                <div className="method-content">
                  <h3>WhatsApp</h3>
                  <p>Quick registration via WhatsApp</p>
                </div>
              </button>

              <button 
                className="method-button"
                onClick={() => handleMethodSelect('facebook')}
              >
                <span className="method-icon">👤</span>
                <div className="method-content">
                  <h3>Facebook</h3>
                  <p>Continue with Facebook</p>
                </div>
              </button>
            </div>

            <div className="terms-section">
              <label className="terms-checkbox">
                <input 
                  type="checkbox" 
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" target="_blank">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" target="_blank">Privacy Policy</Link>
                </span>
              </label>
            </div>

            <div className="register-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login">Login here</Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="registration-form-container">
            <button 
              className="back-button"
              onClick={() => setSelectedMethod(null)}
            >
              ← Back to method selection
            </button>

            {selectedMethod === 'email' && (
              <EmailRegistrationForm agreedToTerms={agreedToTerms} />
            )}

            {selectedMethod === 'phone' && (
              <PhoneRegistrationForm agreedToTerms={agreedToTerms} />
            )}

            {(selectedMethod === 'whatsapp' || selectedMethod === 'facebook') && (
              <SocialAuthButtons
                agreedToTerms={agreedToTerms}
                onWhatsAppAuth={() => handleSocialAuth('whatsapp')}
                onFacebookAuth={() => handleSocialAuth('facebook')}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
