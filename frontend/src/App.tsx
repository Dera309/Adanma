import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider, useToast } from './components/Toast';
import ServerStatus from './components/ServerStatus';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorHandler, setupNetworkMonitoring } from './lib/errorHandler';
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/PrivateRoute';
import PageLoader from './components/Loading/PageLoader';
import './styles/accessibility.css';

// Lazy load page components for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const EmailVerificationPage = lazy(() => import('./pages/auth/EmailVerificationPage'));
const PhoneVerificationPage = lazy(() => import('./pages/auth/PhoneVerificationPage'));
const RoleSelectionPage = lazy(() => import('./pages/auth/RoleSelectionPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ProfileEditPage = lazy(() => import('./pages/ProfileEditPage'));
const SecuritySettingsPage = lazy(() => import('./pages/SecuritySettingsPage'));
const AddressManagementPage = lazy(() => import('./pages/AddressManagementPage'));
const VendorVerificationPage = lazy(() => import('./pages/VendorVerificationPage'));
const KYCPage = lazy(() => import('./pages/KYCPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const VendorOrdersPage = lazy(() => import('./pages/VendorOrdersPage'));
const VendorProductsPage = lazy(() => import('./pages/VendorProductsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminContentPage = lazy(() => import('./pages/AdminContentPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

const AppContent = () => {
  const { showError } = useToast();

  useEffect(() => {
    // Set up error handler
    ErrorHandler.setToastHandler(showError);
    ErrorHandler.setupAxiosInterceptors();
    
    // Set up network monitoring
    setupNetworkMonitoring(showError);
  }, [showError]);

  return (
    <AuthProvider>
      <ServerStatus />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="verify-email" element={<EmailVerificationPage />} />
                <Route path="verify-phone" element={<PhoneVerificationPage />} />
                <Route path="select-role" element={<RoleSelectionPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password" element={<ResetPasswordPage />} />
                
                {/* Private routes */}
                <Route path="dashboard" element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                } />
                <Route path="profile" element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                } />
                <Route path="profile/edit" element={
                  <PrivateRoute>
                    <ProfileEditPage />
                  </PrivateRoute>
                } />
                <Route path="security" element={
                  <PrivateRoute>
                    <SecuritySettingsPage />
                  </PrivateRoute>
                } />
                <Route path="addresses" element={
                  <PrivateRoute>
                    <AddressManagementPage />
                  </PrivateRoute>
                } />
                <Route path="vendor/verify" element={
                  <PrivateRoute>
                    <VendorVerificationPage />
                  </PrivateRoute>
                } />
                <Route path="kyc" element={
                  <PrivateRoute>
                    <KYCPage />
                  </PrivateRoute>
                } />
                <Route path="cart" element={
                  <PrivateRoute>
                    <CartPage />
                  </PrivateRoute>
                } />
                <Route path="checkout" element={
                  <PrivateRoute>
                    <CheckoutPage />
                  </PrivateRoute>
                } />
                <Route path="order-success" element={
                  <PrivateRoute>
                    <OrderSuccessPage />
                  </PrivateRoute>
                } />
                <Route path="orders" element={
                  <PrivateRoute>
                    <OrdersPage />
                  </PrivateRoute>
                } />
                <Route path="vendor/orders" element={
                  <PrivateRoute>
                    <VendorOrdersPage />
                  </PrivateRoute>
                } />
                <Route path="vendor/products" element={
                  <PrivateRoute>
                    <VendorProductsPage />
                  </PrivateRoute>
                } />
                <Route path="admin" element={
                  <PrivateRoute>
                    <AdminPage />
                  </PrivateRoute>
                } />
                <Route path="admin/content" element={
                  <PrivateRoute>
                    <AdminContentPage />
                  </PrivateRoute>
                } />
                <Route path="search" element={<SearchPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="contact" element={<ContactPage />} />
              </Route>
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
