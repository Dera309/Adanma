import React, { useState, useEffect } from 'react';
import { checkApiHealth } from '../lib/api';

const ServerStatus: React.FC = () => {
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkServer = async () => {
    setIsChecking(true);
    const isOnline = await checkApiHealth();
    setIsServerOnline(isOnline);
    setIsChecking(false);
  };

  useEffect(() => {
    checkServer();
    const interval = setInterval(checkServer, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isServerOnline === true) return null; // Don't show when server is online

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#dc3545',
      color: 'white',
      padding: '0.75rem',
      textAlign: 'center',
      zIndex: 9999,
      fontSize: '0.9rem'
    }}>
      {isServerOnline === false ? (
        <>
          ⚠️ Backend server is not running. Please start the server on port 5002.
          <button 
            onClick={checkServer}
            disabled={isChecking}
            style={{
              marginLeft: '1rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: 'white',
              color: '#dc3545',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            {isChecking ? 'Checking...' : 'Retry'}
          </button>
        </>
      ) : (
        'Checking server status...'
      )}
    </div>
  );
};

export default ServerStatus;