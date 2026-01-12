import { useState, useEffect } from 'react';
import { FormError, FormSuccess } from '../components/Form';
import SkeletonLoader from '../components/Loading/SkeletonLoader';
import api from '../lib/api';
import './KYCPage.css';

interface KYCData {
  status: 'pending' | 'verified' | 'rejected' | 'not_submitted';
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

const KYCPage = () => {
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    idType: 'national_id',
    idNumber: '',
    idDocument: null as File | null
  });

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const response = await api.get('/users/kyc-status');
      if (response.data.success) {
        setKycData(response.data.data);
        if (response.data.data && response.data.data.status !== 'not_submitted') {
          setFormData({
            firstName: response.data.data.firstName || '',
            lastName: response.data.data.lastName || '',
            dateOfBirth: response.data.data.dateOfBirth || '',
            nationality: response.data.data.nationality || '',
            idType: response.data.data.idType || 'national_id',
            idNumber: response.data.data.idNumber || '',
            idDocument: null
          });
        }
      }
    } catch (err: any) {
      setError('Failed to load KYC status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Basic input sanitization on frontend
    const sanitizedValue = value.replace(/[<>"'&]/g, '');
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Client-side file validation
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, and PDF files are allowed.');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        return;
      }
      
      setError('');
    }
    
    setFormData(prev => ({ ...prev, idDocument: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Additional client-side validation for file uploads
          if (key === 'idDocument' && value instanceof File) {
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(value.type)) {
              throw new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.');
            }
            if (value.size > 5 * 1024 * 1024) {
              throw new Error('File size must be less than 5MB.');
            }
          }
          submitData.append(key, value);
        }
      });

      const response = await api.post('/users/kyc-submit', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setSuccess('KYC documents submitted successfully. We will review your information within 2-3 business days.');
        fetchKYCStatus();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit KYC documents');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="kyc-page">
        <SkeletonLoader variant="text" width="300px" height="32px" />
        <SkeletonLoader variant="card" height="400px" />
      </div>
    );
  }

  const canEdit = !kycData || kycData.status === 'not_submitted' || kycData.status === 'rejected';

  return (
    <div className="kyc-page">
      <div className="kyc-header">
        <h1>Identity Verification (KYC)</h1>
        <p>Complete your identity verification to unlock all platform features</p>
      </div>

      {error && <FormError message={error} onClose={() => setError('')} />}
      {success && <FormSuccess message={success} onClose={() => setSuccess('')} />}

      <div className="kyc-container">
        {kycData?.status === 'verified' && (
          <div className="kyc-status verified">
            <div className="status-icon">✅</div>
            <h2>Identity Verified</h2>
            <p>Your identity has been successfully verified on {new Date(kycData.verifiedAt!).toLocaleDateString()}</p>
          </div>
        )}

        {kycData?.status === 'pending' && (
          <div className="kyc-status pending">
            <div className="status-icon">⏳</div>
            <h2>Verification Pending</h2>
            <p>Your documents are being reviewed. This usually takes 2-3 business days.</p>
            <p className="submitted-date">Submitted: {new Date(kycData.submittedAt!).toLocaleDateString()}</p>
          </div>
        )}

        {kycData?.status === 'rejected' && (
          <div className="kyc-status rejected">
            <div className="status-icon">❌</div>
            <h2>Verification Rejected</h2>
            <p>Your submission was rejected: {kycData.rejectionReason}</p>
            <p>Please update your information and resubmit.</p>
          </div>
        )}

        {canEdit && (
          <form onSubmit={handleSubmit} className="kyc-form">
            <div className="form-section">
              <h3>Personal Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    pattern="[A-Za-z\s]{2,50}"
                    title="First name must be 2-50 characters and contain only letters"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    pattern="[A-Za-z\s]{2,50}"
                    title="Last name must be 2-50 characters and contain only letters"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth *</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="nationality">Nationality *</label>
                  <select
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Country</option>
                    <option value="NG">Nigeria</option>
                    <option value="GH">Ghana</option>
                    <option value="KE">Kenya</option>
                    <option value="ZA">South Africa</option>
                    <option value="CM">Cameroon</option>
                    <option value="EG">Egypt</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Identity Document</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="idType">Document Type *</label>
                  <select
                    id="idType"
                    name="idType"
                    value={formData.idType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="national_id">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="idNumber">Document Number *</label>
                  <input
                    type="text"
                    id="idNumber"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    pattern="[A-Za-z0-9]{6,20}"
                    title="ID number must be 6-20 alphanumeric characters"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="idDocument">Upload Document *</label>
                <input
                  type="file"
                  id="idDocument"
                  name="idDocument"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  required={kycData?.status === 'not_submitted'}
                />
                <p className="file-help">Upload a clear photo or scan of your ID document (JPG, PNG, or PDF, max 5MB)</p>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default KYCPage;