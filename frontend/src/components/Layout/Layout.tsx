import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SearchBar from '../SearchBar';
import './Layout.css';

const Layout = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Check if user has specific roles (handle both string and array)
  const userRoles: string = typeof user?.roles === 'string' ? user.roles : Array.isArray(user?.roles) ? user.roles.join(',') : '';
  const isBuyer = userRoles.toLowerCase().includes('buyer');
  const isVendor = userRoles.toLowerCase().includes('vendor');

  return (
    <div className="layout">
      {/* Skip navigation link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <header className="header" role="banner">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo" onClick={closeMobileMenu}>
              <h1>Adanma</h1>
            </Link>
            
            <SearchBar />
            
            {/* Mobile menu toggle button */}
            <button 
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="main-navigation"
            >
              <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`} aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>

            {/* Navigation */}
            <nav 
              id="main-navigation"
              className={`nav ${isMobileMenuOpen ? 'nav-open' : ''}`}
              role="navigation"
              aria-label="Main navigation"
            >
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="nav-link" onClick={closeMobileMenu}>
                    Dashboard
                  </Link>
                  
                  {/* Buyer-specific navigation */}
                  {isBuyer && (
                    <>
                      <Link to="/orders" className="nav-link" onClick={closeMobileMenu}>
                        My Orders
                      </Link>
                      <Link to="/cart" className="nav-link" onClick={closeMobileMenu}>
                        Cart
                      </Link>
                    </>
                  )}
                  
                  {/* Vendor-specific navigation */}
                  {isVendor && (
                    <>
                      <Link to="/vendor/products" className="nav-link" onClick={closeMobileMenu}>
                        My Products
                      </Link>
                      <Link to="/vendor/orders" className="nav-link" onClick={closeMobileMenu}>
                        Vendor Orders
                      </Link>
                    </>
                  )}
                  
                  <Link to="/profile" className="nav-link" onClick={closeMobileMenu}>
                    Profile
                  </Link>
                  
                  <Link to="/kyc" className="nav-link" onClick={closeMobileMenu}>
                    KYC
                  </Link>
                  
                  <Link to="/admin" className="nav-link" onClick={closeMobileMenu}>
                    Admin
                  </Link>
                  
                  <span className="nav-link user-greeting">
                    Welcome, {user?.email || user?.phoneNumber}
                  </span>
                  
                  <button onClick={handleLogout} className="nav-link btn-link">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link" onClick={closeMobileMenu}>
                    Login
                  </Link>
                  <Link to="/register" className="nav-link" onClick={closeMobileMenu}>
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main id="main-content" className="main" role="main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="footer" role="contentinfo">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2024 Adanma. All rights reserved.</p>
            <nav className="footer-links" aria-label="Footer navigation">
              <Link to="/about">About</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/contact">Contact</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
