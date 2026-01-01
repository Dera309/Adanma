import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
import { Button, FormError, FormSuccess } from '../../components/Form';
import api from '../../lib/api';
import './VerificationPage.css';

const PhoneVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // const { login } = useAuth();
  
  const [code, setCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    // Get phone number and userId from location state
    const statePhone = location.state?.phoneNumber;
    const stateUserId = location.state?.userId;
    
    if (statePhone) {
      setPhoneNumber(statePhone);
    } else {
      // If no phone number in state, redirect to registration
      navigate('/register');
    }
    
    if (stateUserId) {
      setUserId(stateUserId);
    }
  }, [location.state, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setCode(value);
      setError('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setStatus('verifying');
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/verify/phone', 
        userId ? { userId, code } : { phoneNumber, code }
      );

      setStatus('success');

      setSuccess('Your phone number has been successfully verified!');
      
      // Check if user has roles, if not redirect to role selection
      if (response.data.data?.roles && response.data.data.roles.trim().length > 0) {
        setSuccess('Your phone number has been successfully verified! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setSuccess('Your phone number has been successfully verified! Please select your role...');
        setTimeout(() => {
          navigate('/select-role');
        }, 2000);
      }
    } catch (err: any) {
      setStatus('error');
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Verification failed. Please check your code and try again.');
      }
    }
  };

  const handleResendCode = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/auth/verify/phone/resend', 
        userId ? { userId } : { phoneNumber }
      );

      setSuccess('Verification code has been resent to your phone.');
      setCanResend(false);
      setCountdown(60);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to resend code. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="verification-page">
      <div className="verification-container">
        <div className="verification-icon">
          {status === 'success' ? (
            <div className="success-icon">✓</div>
          ) : (
            <div className="phone-icon">📱</div>
          )}
        </div>

        <h1>Phone Verification</h1>

        {phoneNumber && (
          <p className="verification-email">
            We sent a 6-digit code to: <strong>{phoneNumber}</strong>
          </p>
        )}

        {status !== 'success' && (
          <form onSubmit={handleSubmit}>
            {error && <FormError message={error} />}
            {success && <FormSuccess message={success} />}

            <div className="code-input-container">
              <label htmlFor="code">Enter Verification Code</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="code-input"
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                maxLength={6}
                autoFocus
                required
              />
            </div>

            <Button 
              type="submit" 
              fullWidth 
              isLoading={status === 'verifying'}
              disabled={status === 'verifying' || code.length !== 6}
            >
              Verify Phone Number
            </Button>

            <div className="resend-section">
              <p>Didn't receive the code?</p>
              <button
                type="button"
                className="resend-button"
                onClick={handleResendCode}
                disabled={!canResend || isResending}
              >
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
              {!canResend && (
                <p className="countdown-text">
                  You can resend the code in {countdown} seconds
                </p>
              )}
            </div>
          </form>
        )}

        {status === 'success' && (
          <FormSuccess message={success} />
        )}
      </div>
    </div>
  );
};

export default PhoneVerificationPage;
