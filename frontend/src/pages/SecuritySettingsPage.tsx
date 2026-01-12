import { useState, useEffect, FormEvent } from 'react';
import { Input, Button, FormError } from '../components/Form';
import { useToast } from '../components/Toast';
import axios from 'axios';
import './SecuritySettingsPage.css';

interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  lastActivityAt: string;
  isCurrent?: boolean;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains number', test: (p) => /\d/.test(p) },
  { label: 'Contains special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) }
];

const SecuritySettingsPage = () => {
  const { showSuccess } = useToast();
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/auth/sessions`,
        { withCredentials: true }
      );
      if (response.data.success && response.data.data) {
        setSessions(response.data.data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessionError('Failed to load active sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    setPasswordError('');
  };

  const validatePassword = (password: string): boolean => {
    return passwordRequirements.every(req => req.test(password));
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (!validatePassword(passwordForm.newPassword)) {
      setPasswordError('New password does not meet requirements');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/password/change`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        { withCredentials: true }
      );

      showSuccess('Password Changed', 'Your password has been updated successfully! All other sessions have been logged out.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Refresh sessions list
      fetchSessions();
    } catch (err: any) {
      if (err.response?.data?.message) {
        setPasswordError(err.response.data.message);
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    setSessionError('');

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/auth/sessions/${sessionId}`,
        { withCredentials: true }
      );

      showSuccess('Session Terminated', 'The selected session has been logged out successfully.');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err: any) {
      if (err.response?.data?.message) {
        setSessionError(err.response.data.message);
      } else {
        setSessionError('Failed to terminate session');
      }
    }
  };

  const handleLogoutAllOthers = async () => {
    setSessionError('');

    if (!confirm('Are you sure you want to log out all other sessions?')) {
      return;
    }

    try {
      const otherSessions = sessions.filter(s => !s.isCurrent);
      
      await Promise.all(
        otherSessions.map(session =>
          axios.delete(
            `${import.meta.env.VITE_API_URL}/api/auth/sessions/${session.id}`,
            { withCredentials: true }
          )
        )
      );

      showSuccess('Sessions Terminated', 'All other sessions have been logged out successfully.');
      fetchSessions();
    } catch (err: any) {
      setSessionError('Failed to log out all sessions');
    }
  };

  return (
    <div className="security-settings-page">
      <div className="security-header">
        <h1>Security Settings</h1>
        <p>Manage your password and active sessions</p>
      </div>

      <div className="security-grid">
        {/* Password Change Section */}
        <div className="security-card">
          <div className="card-header">
            <h2>Change Password</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handlePasswordSubmit}>
              {passwordError && <FormError message={passwordError} />}

              <Input
                label="Current Password"
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter your current password"
                required
                disabled={isChangingPassword}
              />

              <div className="password-field-container">
                <Input
                  label="New Password"
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  onFocus={() => setShowPasswordRequirements(true)}
                  placeholder="Enter your new password"
                  required
                  disabled={isChangingPassword}
                />
                
                {showPasswordRequirements && (
                  <div className="password-requirements">
                    <p className="requirements-title">Password must contain:</p>
                    <ul className="requirements-list">
                      {passwordRequirements.map((req, index) => (
                        <li 
                          key={index}
                          className={req.test(passwordForm.newPassword) ? 'requirement-met' : 'requirement-unmet'}
                        >
                          <span className="requirement-icon">
                            {req.test(passwordForm.newPassword) ? '✓' : '○'}
                          </span>
                          {req.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Input
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm your new password"
                required
                disabled={isChangingPassword}
              />

              <Button
                type="submit"
                fullWidth
                isLoading={isChangingPassword}
                disabled={isChangingPassword}
              >
                Change Password
              </Button>
            </form>
          </div>
        </div>

        {/* Active Sessions Section */}
        <div className="security-card">
          <div className="card-header">
            <h2>Active Sessions</h2>
            {sessions.filter(s => !s.isCurrent).length > 0 && (
              <Button
                variant="danger"
                size="small"
                onClick={handleLogoutAllOthers}
              >
                Logout All Others
              </Button>
            )}
          </div>
          <div className="card-body">
            {sessionError && <FormError message={sessionError} />}

            {isLoadingSessions ? (
              <p className="text-muted">Loading sessions...</p>
            ) : sessions.length > 0 ? (
              <div className="sessions-list">
                {sessions.map((session) => (
                  <div key={session.id} className="session-item">
                    <div className="session-info">
                      <div className="session-device">
                        <span className="device-icon">📱</span>
                        <strong>{session.deviceInfo || 'Unknown Device'}</strong>
                        {session.isCurrent && (
                          <span className="current-badge">Current</span>
                        )}
                      </div>
                      <div className="session-details">
                        <span>IP: {session.ipAddress}</span>
                        <span>Last active: {new Date(session.lastActivityAt).toLocaleString()}</span>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <button
                        className="btn-terminate"
                        onClick={() => handleTerminateSession(session.id)}
                      >
                        Terminate
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No active sessions found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettingsPage;
