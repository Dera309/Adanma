import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ 
          fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', 
          margin: '0 0 0.5rem 0', 
          color: '#FFFFFF',
          textAlign: 'center'
        }}>
          Welcome to
        </h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexWrap: 'nowrap'
        }}>
          <span style={{ 
            fontSize: 'clamp(2rem, 8vw, 3rem)', 
            marginRight: 'clamp(0.5rem, 2vw, 1rem)'
          }}>🛒</span>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 8vw, 3rem)', 
            margin: '0', 
            color: '#FFD700',
            whiteSpace: 'nowrap'
          }}>
            Adanma
          </h1>
        </div>
      </div>
      <p style={{ fontSize: '1.25rem', color: '#B0B0B0', marginBottom: '2rem' }}>
        Your trusted marketplace across Africa
      </p>
      
      {!isAuthenticated && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link 
            to="/register" 
            style={{
              padding: '0.75rem 2rem',
              background: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontSize: '1.1rem'
            }}
          >
            Get Started
          </Link>
          <Link 
            to="/login" 
            style={{
              padding: '0.75rem 2rem',
              background: 'white',
              color: '#667eea',
              textDecoration: 'none',
              borderRadius: '5px',
              fontSize: '1.1rem',
              border: '2px solid #667eea'
            }}
          >
            Login
          </Link>
        </div>
      )}
    </div>
  );
};

export default HomePage;
