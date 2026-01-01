import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
import { FormError, FormSuccess } from '../../components/Form';
import api from '../../lib/api';
import './VerificationPage.css';

const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  // const { login } = useAuth();
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get email from location state if available
    const stateEmail = location.state?.email;
    if (stateEmail) {
      setEmail(stateEmail);
    }

    // Get token from URL query parameter
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    // Auto-submit verification request
    verifyEmail(token);
  }, [searchParams, location.state]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await api.post('/auth/verify/email', { token });

      setStatus('success');
      
      setMessage('Your email has been successfully verified!');
      
      // Check if user has roles, if not redirect to role selection
      if (response.data.data?.roles && response.data.data.roles.trim().length > 0) {
        setMessage('Your email has been successfully verified! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setMessage('Your email has been successfully verified! Please select your role...');
        setTimeout(() => {
          navigate('/select-role');
        }, 2000);
      }
    } catch (err: any) {
      setStatus('error');
      if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage('Verification failed. The link may have expired or is invalid.');
      }
    }
  };

  return (
    <div className="verification-page">
      <div className="verification-container">
        <div className="verification-icon">
          {status === 'verifying' && (
            <div className="spinner-large"></div>
          )}
          {status === 'success' && (
            <div className="success-icon">✓</div>
          )}
          {status === 'error' && (
            <div className="error-icon">✗</div>
          )}
        </div>

        <h1>Email Verification</h1>

        {email && (
          <p className="verification-email">
            Verifying: <strong>{email}</strong>
          </p>
        )}

        {status === 'verifying' && (
          <p className="verification-message">
            Please wait while we verify your email address...
          </p>
        )}

        {status === 'success' && (
          <FormSuccess message={message} />
        )}

        {status === 'error' && (
          <>
            <FormError message={message} />
            <div className="verification-actions">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/register')}
              >
                Back to Registration
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
