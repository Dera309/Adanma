import { Link } from 'react-router-dom';
import VerificationStatusBadge, { VerificationStatus } from './VerificationStatusBadge';
import { Button } from '../Form';
import './VerificationStatusDisplay.css';

interface VerificationStatusDisplayProps {
  status: VerificationStatus;
  rejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
  showActions?: boolean;
}

const VerificationStatusDisplay: React.FC<VerificationStatusDisplayProps> = ({
  status,
  rejectionReason,
  submittedAt,
  verifiedAt,
  showActions = true
}) => {
  const getStatusMessage = () => {
    switch (status) {
      case 'verified':
        return {
          title: 'Congratulations! You are a verified vendor',
          description: 'Your vendor account has been verified. You now have access to all premium vendor features.',
          benefits: [
            'Verified badge on your profile',
            'Increased customer trust',
            'Priority in search results',
            'Access to advanced analytics',
            'Higher visibility in marketplace'
          ]
        };
      case 'pending':
        return {
          title: 'Verification in progress',
          description: 'We are currently reviewing your submitted documents. This process usually takes 1-3 business days.',
          benefits: [
            'We will review your documents carefully',
            'You will receive an email notification once complete',
            'No action required from your side',
            'Feel free to continue using basic vendor features'
          ]
        };
      case 'rejected':
        return {
          title: 'Verification was not approved',
          description: 'Unfortunately, we could not verify your vendor account at this time. Please review the reason below and resubmit.',
          benefits: [
            'Review the rejection reason carefully',
            'Prepare new documents that meet our requirements',
            'You can resubmit your verification request',
            'Contact support if you need assistance'
          ]
        };
      case 'unverified':
      default:
        return {
          title: 'Get verified to unlock premium features',
          description: 'Verify your vendor account to gain customer trust and access advanced features.',
          benefits: [
            'Verified badge on your profile',
            'Increased customer trust',
            'Priority in search results',
            'Access to advanced analytics',
            'Higher conversion rates'
          ]
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="verification-status-display">
      <div className="status-header">
        <VerificationStatusBadge status={status} size="large" />
        <div className="status-info">
          <h2>{statusInfo.title}</h2>
          <p>{statusInfo.description}</p>
        </div>
      </div>

      {status === 'rejected' && rejectionReason && (
        <div className="rejection-reason">
          <h3>Rejection Reason:</h3>
          <p>{rejectionReason}</p>
        </div>
      )}

      {status === 'pending' && submittedAt && (
        <div className="submission-info">
          <p><strong>Submitted:</strong> {new Date(submittedAt).toLocaleDateString()}</p>
          <p><em>Expected completion: 1-3 business days</em></p>
        </div>
      )}

      {status === 'verified' && verifiedAt && (
        <div className="verification-info">
          <p><strong>Verified on:</strong> {new Date(verifiedAt).toLocaleDateString()}</p>
        </div>
      )}

      <div className="status-benefits">
        <h3>
          {status === 'verified' ? 'Your Benefits:' : 
           status === 'pending' ? 'What happens next:' :
           status === 'rejected' ? 'Next steps:' : 'Benefits of verification:'}
        </h3>
        <ul>
          {statusInfo.benefits.map((benefit, index) => (
            <li key={index}>
              <span className="benefit-icon">
                {status === 'verified' ? '✓' : 
                 status === 'pending' ? '⏳' :
                 status === 'rejected' ? '→' : '★'}
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      {showActions && (
        <div className="status-actions">
          {(status === 'unverified' || status === 'rejected') && (
            <Link to="/vendor/verify">
              <Button size="large">
                {status === 'rejected' ? 'Resubmit Verification' : 'Start Verification'}
              </Button>
            </Link>
          )}
          
          {status === 'verified' && (
            <Link to="/vendor/dashboard">
              <Button size="large">
                Go to Vendor Dashboard
              </Button>
            </Link>
          )}

          {status === 'pending' && (
            <div className="pending-actions">
              <p>No action required. We'll notify you once the review is complete.</p>
              <Link to="/vendor/verify">
                <Button variant="outline">
                  View Submitted Documents
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerificationStatusDisplay;