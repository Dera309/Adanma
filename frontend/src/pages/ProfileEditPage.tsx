import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input, Button, FormError } from '../components/Form';
import { useToast } from '../components/Toast';
import { User } from '../types';
import axios from 'axios';
import './ProfileEditPage.css';

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showSuccess } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    firstName: '',
    lastName: ''
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState<{
    email?: boolean;
    phone?: boolean;
  }>({});

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      });
      setProfilePicturePreview(user.profilePicture || '');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (max 2MB for security)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image file size must be less than 2MB');
        return;
      }
      
      setProfilePicture(file);
      
      // Create preview with error handling
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.onerror = () => {
        setError('Failed to process the selected image file');
        setProfilePicture(null);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setVerificationRequired({});

    // Validation
    if (!formData.email && !formData.phoneNumber) {
      setError('At least one contact method (email or phone) is required');
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const submitData = new FormData();
      
      // Add text fields
      if (formData.email) submitData.append('email', formData.email);
      if (formData.phoneNumber) submitData.append('phoneNumber', formData.phoneNumber);
      if (formData.firstName) submitData.append('firstName', formData.firstName);
      if (formData.lastName) submitData.append('lastName', formData.lastName);
      
      // Add profile picture if selected
      if (profilePicture) {
        submitData.append('profilePicture', profilePicture);
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/profile`,
        submitData,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success && response.data.data) {
        const updatedUser = response.data.data.user;
        updateUser(updatedUser);

        // Check if verification is required
        const emailChanged = user?.email !== formData.email;
        const phoneChanged = user?.phoneNumber !== formData.phoneNumber;

        if (emailChanged || phoneChanged) {
          setVerificationRequired({
            email: emailChanged && formData.email !== '',
            phone: phoneChanged && formData.phoneNumber !== ''
          });
          showSuccess(
            'Profile Updated',
            'Please check your ' +
            (emailChanged && phoneChanged ? 'email and phone' : emailChanged ? 'email' : 'phone') +
            ' for verification instructions.'
          );
        } else {
          showSuccess('Profile Updated', 'Your profile has been updated successfully!');
          setTimeout(() => {
            navigate('/profile');
          }, 1500);
        }
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (!user) {
    return (
      <div className="profile-edit-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-edit-page">
      <div className="profile-edit-container">
        <div className="profile-edit-header">
          <h1>Edit Profile</h1>
          <p>Update your personal information</p>
        </div>

        <form onSubmit={handleSubmit} className="profile-edit-form">
          {error && <FormError message={error} />}

          {verificationRequired.email && (
            <div className="verification-notice">
              <strong>Email Verification Required:</strong> We've sent a verification link to your new email address. Please verify it to complete the change.
            </div>
          )}

          {verificationRequired.phone && (
            <div className="verification-notice">
              <strong>Phone Verification Required:</strong> We've sent a verification code to your new phone number. Please verify it to complete the change.
            </div>
          )}

          <div className="form-section">
            <h2>Profile Picture</h2>
            
            <div className="profile-picture-section">
              <div className="profile-picture-preview">
                {profilePicturePreview ? (
                  <img 
                    src={profilePicturePreview} 
                    alt="Profile preview" 
                    className="profile-picture-img"
                  />
                ) : (
                  <div className="profile-picture-placeholder">
                    <span>No Image</span>
                  </div>
                )}
              </div>
              
              <div className="profile-picture-controls">
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={isLoading}
                />
                <label htmlFor="profilePicture" className="btn btn-outline">
                  Choose Image
                </label>
                {profilePicturePreview && (
                  <button
                    type="button"
                    onClick={removeProfilePicture}
                    className="btn btn-danger"
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <p className="profile-picture-help">
                Upload a profile picture (JPEG, PNG, GIF, or WebP, max 2MB)
              </p>
            </div>
          </div>

          <div className="form-section">
            <h2>Contact Information</h2>
            
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              disabled={isLoading}
            />

            <Input
              label="Phone Number"
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+234 800 000 0000"
              disabled={isLoading}
            />

            <div className="info-box">
              <p>
                <strong>Note:</strong> Changing your email or phone number will require verification. 
                You'll need to verify the new contact method before it becomes active.
              </p>
            </div>
          </div>

          <div className="form-section">
            <h2>Personal Details (Optional)</h2>
            
            <Input
              label="First Name"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              disabled={isLoading}
            />

            <Input
              label="Last Name"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              disabled={isLoading}
            />
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Save Changes
            </Button>
          </div>
        </form>

        <div className="danger-zone">
          <h2>Account Information</h2>
          <div className="info-row">
            <div>
              <strong>Auth Provider:</strong> {user.authProvider}
            </div>
          </div>
          <div className="info-row">
            <div>
              <strong>Account Status:</strong> Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;