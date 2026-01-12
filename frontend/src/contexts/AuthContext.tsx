import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import api, { ApiResponse } from '../lib/api';
import { User, LoginResponse } from '../types';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    // Add a small delay to avoid React Strict Mode double execution issues
    const timer = setTimeout(() => {
      checkAuth();
    }, 500); // Reduced delay
    
    return () => clearTimeout(timer);
  }, []);

  // Set up automatic token refresh (check every 10 minutes)
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(() => {
      refreshUser();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  // Set up activity-based refresh (refresh on user activity)
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      // Debounce: only refresh if last refresh was more than 5 minutes ago
      const lastRefresh = localStorage.getItem('lastAuthRefresh');
      const now = Date.now();
      
      if (!lastRefresh || now - parseInt(lastRefresh) > 5 * 60 * 1000) {
        localStorage.setItem('lastAuthRefresh', now.toString());
        refreshUser();
      }
    };

    // Listen for user activity
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [user]);

  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking authentication status...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔒 No token found in localStorage');
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Use the API client which includes the token automatically
      const response = await api.get('/users/profile');
      
      if (response.data?.success && response.data.data) {
        console.log('✅ Auth check successful:', response.data);
        setUser(response.data.data.user);
        setError(null);
      } else {
        console.log('🔒 Auth check failed - invalid response');
        setUser(null);
        localStorage.removeItem('token');
      }
    } catch (error: any) {
      console.log('🔒 Auth check failed:', error.message);
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      console.log('🔐 Attempting login for:', identifier);
      console.log('🔗 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5002');
      
      const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
        identifier,
        password
      });

      console.log('✅ Login response received:');
      console.log('- Status:', response.status);
      console.log('- Data:', response.data);
      console.log('- Success:', response.data?.success);
      console.log('- Has data:', !!response.data?.data);
      console.log('- Has user:', !!response.data?.data?.user);
      console.log('- Has accessToken:', !!response.data?.data?.accessToken);

      // Check if this is a successful response
      if (response.status === 200 && response.data && response.data.success && response.data.data) {
        const userData = response.data.data.user;
        // Convert roles array to string if needed
        const normalizedUser = {
          ...userData,
          roles: Array.isArray(userData.roles) ? userData.roles.join(',') : userData.roles
        };
        console.log('✅ Setting user data:', normalizedUser);
        setUser(normalizedUser);
        localStorage.setItem('lastAuthRefresh', Date.now().toString());
        
        // Store access token if provided
        if (response.data.data.accessToken) {
          const token = response.data.data.accessToken;
          localStorage.setItem('token', token);
          setAccessToken(token);
          console.log('✅ Token stored in localStorage');
        }
        
        console.log('✅ Login successful - cookies set by server');
        
        setError(null);
        console.log('✅ Login completed successfully');
      } else {
        console.log('❌ Login failed - response validation failed');
        console.log('- Status check:', response.status === 200);
        console.log('- Data check:', !!response.data);
        console.log('- Success check:', response.data?.success);
        console.log('- Data.data check:', !!response.data?.data);
        const errorMsg = response.data?.error?.message || response.data?.message || 'Login failed - invalid response format';
        console.log('- Error message:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Login error caught:', error);
      console.error('- Error type:', typeof error);
      console.error('- Error message:', error?.message);
      console.error('- Error status:', error?.status);
      console.error('- Error response:', error?.response);
      console.error('- Error data:', error?.data);
      
      // Handle different error formats
      let errorMessage = 'Login failed. Please try again.';
      
      if (error?.status === 401 || error?.response?.status === 401) {
        const errorData = error?.data || error?.response?.data || error;
        errorMessage = errorData?.error?.message || errorData?.message || 'Invalid credentials';
      } else if (error?.message) {
        errorMessage = error.message;
      } else {
        errorMessage = error?.error?.message || error?.response?.data?.error?.message || error?.response?.data?.message || 'Login failed. Please try again.';
      }
      
      console.error('❌ Final error message:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('lastAuthRefresh');
      localStorage.removeItem('token');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }
      
      const response = await api.get('/users/profile');
      
      if (response.data?.success && response.data.data) {
        setUser(response.data.data.user);
      } else {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('lastAuthRefresh');
      }
    } catch (error) {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('lastAuthRefresh');
    }
  }, [user]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = useMemo(() => ({
    user,
    accessToken,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    updateUser,
    clearError
  }), [user, accessToken, isLoading, error, login, logout, refreshUser, updateUser, clearError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
