import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SkeletonLoader from '../components/Loading/SkeletonLoader';
import axios from 'axios';
import './ProfilePage.css';

interface Address {
  id: string;
  country: string;
  region: string;
  city: string;
  streetAddress: string;
  isPrimary: boolean;
}

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002';

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAddresses();
    } else {
      setAddresses([]);
      setIsLoadingAddresses(false);
    }
  }, [user, isAuthenticated]);

  const fetchAddresses = async () => {
    if (!user || !isAuthenticated) {
      setAddresses([]);
      setIsLoadingAddresses(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAddresses([]);
        setIsLoadingAddresses(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success && response.data.data?.addresses) {
        setAddresses(response.data.data.addresses);
      } else {
        console.warn('Unexpected response format:', response.data);
        setAddresses([]);
      }
    } catch (error: any) {
      console.warn('Failed to fetch addresses:', error?.response?.data || error.message);
      setAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const getVerificationBadge = () => {
    if (!user) return null;

    const status = user.verificationStatus;

    if (status === 'verified') {
      return <span className="badge badge-verified">✓ Verified Vendor</span>;
    }
    if (status === 'pending') {
      return <span className="badge badge-pending">⏳ Verification Pending</span>;
    }
    if (user.roles && isVendor(user.roles)) {
      return <span className="badge badge-unverified">Unverified Vendor</span>;
    }

    return null;
  };

  const isVendor = (roles: string | string[] | undefined): boolean => {
    if (!roles) return false;
    const rolesArray = Array.isArray(roles) ? roles : roles.split(',');
    return rolesArray.some((role) => role.trim().toLowerCase() === 'vendor');
  };

  const getRolesArray = (): string[] => {
    if (!user?.roles) return [];
    return Array.isArray(user.roles)
      ? user.roles
      : user.roles.split(',').map((r) => r.trim()).filter(Boolean);
  };

  const getInitial = () => {
    if (user?.email) return user.email[0].toUpperCase();
    if (user?.phoneNumber) return user.phoneNumber[0];
    return 'U';
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar">
            {user.profilePicture ? (
              <img
                src={`${API_BASE}${user.profilePicture}`}
                alt="Profile"
                className="profile-avatar-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`avatar-fallback ${user.profilePicture ? 'hidden' : ''}`}>
              {getInitial()}
            </div>
          </div>

          <div className="profile-header-info">
            <h1>{user.email || user.phoneNumber || 'User'}</h1>
            <div className="profile-badges">
              {getVerificationBadge()}
              {getRolesArray().map((role) => (
                <span key={role} className="badge badge-role">
                  {role.toLowerCase() === 'buyer' ? 'Buyer' : 'Vendor'}
                </span>
              ))}
            </div>
          </div>
        </div>
        <Link to="/profile/edit" className="btn btn-primary">
          Edit Profile
        </Link>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="card-header">
            <h2>Personal Information</h2>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">
                {user.email || 'Not provided'}
                {user.emailVerified && <span className="verified-icon">✓</span>}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone:</span>
              <span className="info-value">
                {user.phoneNumber || 'Not provided'}
                {user.phoneVerified && <span className="verified-icon">✓</span>}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Auth Provider:</span>
              <span className="info-value">{user.authProvider || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Member Since:</span>
              <span className="info-value">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Last Login:</span>
              <span className="info-value">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="card-header">
            <h2>Saved Addresses</h2>
            <Link to="/addresses" className="btn btn-secondary btn-small">
              Manage Addresses
            </Link>
          </div>
          <div className="card-body">
            {isLoadingAddresses ? (
              <div className="addresses-skeleton">
                <SkeletonLoader variant="text" width="100%" height="16px" />
                <SkeletonLoader variant="text" width="80%" height="14px" />
                <SkeletonLoader variant="text" width="90%" height="14px" />
              </div>
            ) : addresses.length > 0 ? (
              <div className="addresses-list">
                {addresses.slice(0, 3).map((address) => (
                  <div key={address.id} className="address-item">
                    {address.isPrimary && <span className="primary-badge">Primary</span>}
                    <p className="address-text">
                      {address.streetAddress}, {address.city}, {address.region}, {address.country}
                    </p>
                  </div>
                ))}
                {addresses.length > 3 && (
                  <p className="text-muted">
                    +{addresses.length - 3} more address{addresses.length - 3 !== 1 ? 'es' : ''}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted">No saved addresses yet.</p>
            )}
          </div>
        </div>

        {isVendor(user.roles) && (
          <div className="profile-card">
            <div className="card-header">
              <h2>Vendor Verification</h2>
            </div>
            <div className="card-body">
              {user.verificationStatus === 'verified' ? (
                <div className="verification-success">
                  <div className="success-icon">✓</div>
                  <p>Your vendor account is verified!</p>
                  <p className="text-muted">
                    You have access to all vendor features and your profile displays a verified badge.
                  </p>
                </div>
              ) : user.verificationStatus === 'pending' ? (
                <div className="verification-pending">
                  <div className="pending-icon">⏳</div>
                  <p>Verification in progress</p>
                  <p className="text-muted">
                    We're reviewing your documents. This usually takes 1-3 business days.
                  </p>
                </div>
              ) : (
                <div className="verification-unverified">
                  <p>Get verified to unlock premium vendor features!</p>
                  <ul className="benefits-list">
                    <li>✓ Verified badge on your profile</li>
                    <li>✓ Increased customer trust</li>
                    <li>✓ Priority in search results</li>
                    <li>✓ Access to advanced analytics</li>
                  </ul>
                  <Link to="/vendor/verify" className="btn btn-primary">
                    Start Verification
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="profile-card">
          <div className="card-header">
            <h2>Security Settings</h2>
          </div>
          <div className="card-body">
            <Link to="/security" className="settings-link">
              <span>Password & Security</span>
              <span className="arrow">→</span>
            </Link>
            <Link to="/security/sessions" className="settings-link">
              <span>Active Sessions</span>
              <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;