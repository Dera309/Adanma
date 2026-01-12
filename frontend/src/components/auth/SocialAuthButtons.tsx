import { FacebookIcon, WhatsAppIcon } from '../icons/SocialIcons';
import './AuthForms.css';

interface SocialAuthButtonsProps {
  agreedToTerms: boolean;
  onWhatsAppAuth: () => void;
  onFacebookAuth: () => void;
}

const SocialAuthButtons = ({ 
  agreedToTerms, 
  onWhatsAppAuth, 
  onFacebookAuth 
}: SocialAuthButtonsProps) => {
  return (
    <div className="social-auth-container">
      <div className="social-auth-info">
        <h3>Quick Registration</h3>
        <p className="consent-info">
          By using social authentication, you consent to us collecting your basic profile 
          information (name, email/phone) from the selected platform. This data will be 
          used to create and manage your account in accordance with our Privacy Policy.
        </p>
      </div>

      <div className="social-buttons">
        <button
          type="button"
          className="social-button whatsapp-button"
          onClick={onWhatsAppAuth}
          disabled={!agreedToTerms}
        >
          <WhatsAppIcon size={20} className="social-icon" />
          <span className="social-text">Continue with WhatsApp</span>
        </button>

        <button
          type="button"
          className="social-button facebook-button"
          onClick={onFacebookAuth}
          disabled={!agreedToTerms}
        >
          <FacebookIcon size={20} className="social-icon" />
          <span className="social-text">Continue with Facebook</span>
        </button>
      </div>

      {!agreedToTerms && (
        <p className="terms-warning">
          Please agree to the Terms of Service and Privacy Policy to continue
        </p>
      )}

      <div className="data-collection-notice">
        <h4>Data We Collect:</h4>
        <ul>
          <li><strong>WhatsApp:</strong> Phone number, name, profile picture</li>
          <li><strong>Facebook:</strong> Email address, name, profile picture</li>
        </ul>
        <p className="notice-text">
          This information is used solely for account creation and authentication. 
          We do not access your messages or other private data.
        </p>
      </div>
    </div>
  );
};

export default SocialAuthButtons;
