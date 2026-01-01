import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Input, Button, FormError, FormSuccess } from '../../components/Form';
import axios from 'axios';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!identifier.trim()) {
      setError('Please enter your email or phone number');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/password/reset-request`,
        { identifier: identifier.trim() }
      );

      setSuccess(
        'Password reset instructions have been sent! Please check your email or phone for further instructions.'
      );
      setIdentifier('');
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to send reset instructions. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <div className="icon">🔒</div>
          <h1>Forgot Password?</h1>
          <p>
            No worries! Enter your email or phone number and we'll send you
            instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          {error && <FormError message={error} />}
          {success && <FormSuccess message={success} />}

          <Input
            label="Email or Phone Number"
            type="text"
            name="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter your email or phone number"
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
            Send Reset Instructions
          </Button>
        </form>

        <div className="forgot-password-footer">
          <p>
            Remember your password?{' '}
            <Link to="/login">Back to Login</Link>
          </p>
          <p>
            Don't have an account?{' '}
            <Link to="/register">Create one here</Link>
          </p>
        </div>

        <div className="info-box">
          <h3>What happens next?</h3>
          <ul>
            <li>
              <strong>Email users:</strong> You'll receive an email with a link to reset your password. The link expires in 15 minutes.
            </li>
            <li>
              <strong>Phone users:</strong> You'll receive an SMS with a verification code. The code expires in 15 minutes.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
