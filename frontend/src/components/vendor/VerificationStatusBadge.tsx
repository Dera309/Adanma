import './VerificationStatusBadge.css';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({
  status,
  size = 'medium',
  showText = true
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: '✓',
          text: 'Verified Vendor',
          className: 'verified'
        };
      case 'pending':
        return {
          icon: '⏳',
          text: 'Verification Pending',
          className: 'pending'
        };
      case 'rejected':
        return {
          icon: '✗',
          text: 'Verification Rejected',
          className: 'rejected'
        };
      case 'unverified':
      default:
        return {
          icon: '○',
          text: 'Unverified',
          className: 'unverified'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`verification-badge verification-badge-${size} verification-badge-${config.className}`}>
      <span className="verification-icon">{config.icon}</span>
      {showText && <span className="verification-text">{config.text}</span>}
    </span>
  );
};

export default VerificationStatusBadge;