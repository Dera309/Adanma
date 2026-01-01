import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import VerificationStatusDisplay from '../components/vendor/VerificationStatusDisplay';
import VerificationRequestForm from '../components/vendor/VerificationRequestForm';
import { FormError } from '../components/Form';
import SkeletonLoader from '../components/Loading/SkeletonLoader';
import axios from 'axios';
import './VendorVerificationPage.css';

interface VerificationData {
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
}

const VendorVerificationPage = () => {
  const { user } = useAuth();
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const userRoles = typeof user?.roles === 'string' ? user.roles : (Array.isArray(user?.roles) ? user.roles.join(',') : '');
    const isVendor = userRoles.toLowerCase().includes('vendor');
    
    if (isVendor) {
      fetchVerificationStatus();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users/verification-status`,
        { withCredentials: true }
      );

      if (response.data.success && response.data.data) {
        setVerificationData(response.data.data);
      }
    } catch (err: any) {
      setError('Failed to load verification status');
      console.error('Failed to fetch verification status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchVerificationStatus(); // Refresh status
  };

  const handleStartVerification = () => {
    setShowForm(true);
  };

  const userRoles = typeof user?.roles === 'string' ? user.roles : (Array.isArray(user?.roles) ? user.roles.join(',') : '');
  const isVendor = userRoles.toLowerCase().includes('vendor');
  
  if (!isVendor) {
    return (
      <div className="vendor-verification-page">
        <div className="not-vendor-message">
          <h1>Vendor Verification</h1>
          <p>You need to have a vendor role to access verification features.</p>
          <p>Please update your profile to include the vendor role first.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="vendor-verification-page">
        <div className="page-header">
          <SkeletonLoader variant="text" width="300px" height="32px" />
          <SkeletonLoader variant="text" width="500px" height="16px" />
        </div>
        <div className="verification-skeleton">
          <SkeletonLoader variant="card" height="200px" />
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-verification-page">
      <div className="page-header">
        <h1>Vendor Verification</h1>
        <p>Get verified to unlock premium vendor features and build customer trust</p>
      </div>

      {error && <FormError message={error} onClose={() => setError('')} />}

      {showForm ? (
        <div className="verification-form-container">
          <VerificationRequestForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : verificationData ? (
        <VerificationStatusDisplay
          status={verificationData.status}
          rejectionReason={verificationData.rejectionReason}
          submittedAt={verificationData.submittedAt}
          verifiedAt={verificationData.verifiedAt}
          showActions={true}
        />
      ) : (
        <div className="no-data-state">
          <h2>Unable to load verification status</h2>
          <p>Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      )}
    </div>
  );
};

export default VendorVerificationPage;