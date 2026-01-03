import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Utility function to generate correlation ID
const generateCorrelationId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Create axios instance with enhanced configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5002') + '/api',
  timeout: 15000, // Increased timeout to 15 seconds
  withCredentials: true, // Important for cookie-based authentication
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Don't throw on 4xx errors, handle them in interceptor
  validateStatus: (status) => status < 500,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add correlation ID for tracking
    config.headers['X-Correlation-ID'] = generateCorrelationId();
    
    // Add authentication token if available
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? 'Found' : 'Not found');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Added Authorization header');
    } else {
      console.log('No token available - request will be unauthorized');
    }
    
    // Note: Don't manually set Origin header - browsers handle this automatically
    // Setting Origin manually causes "Refused to set unsafe header" error
    
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Handle successful responses
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Only log errors that are not expected
      if (status !== 401) {
        console.error('Response error:', error);
      }
      
      switch (status) {
        case 401:
          // Unauthorized - this is expected when not logged in
          // Don't log as error, just handle silently
          break; 
        case 403:
          // Forbidden
          console.log('Access forbidden');
          break;
        case 404:
          // Not found
          console.log('Resource not found');
          break;
        case 500:
          // Server error
          console.log('Server error');
          break;
        default:
          console.log(`HTTP Error ${status}`);
      }

      // For 401, return the response data instead of rejecting
      if (status === 401) {
        return Promise.resolve({ status, data: data || { success: false, error: { message: 'Unauthorized' } } });
      }
      
      // Return the error response data for handling in components
      return Promise.reject(data || error);
    } else if (error.request) {
      // Network error - Enhanced logging and error handling
      console.group('🔧 Network Error Details');
      console.error('Request config:', {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout
      });
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        name: error.name
      });
      console.error('Request object:', error.request);
      console.groupEnd();
      
      // Determine specific error type
      let errorMessage = 'Network error. Please check your connection and try again.';
      let errorCode = 'NETWORK_ERROR';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on port 5002.';
        errorCode = 'CONNECTION_REFUSED';
      } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
        errorCode = 'TIMEOUT';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS error. Please check server configuration.';
        errorCode = 'CORS_ERROR';
      }
      
      return Promise.reject({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage
        }
      });
    } else {
      // Something else happened
      console.error('Error:', error.message);
      return Promise.reject({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred.'
        }
      });
    }
  }
);

// Health check function
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002';
    console.log('Health check URL:', apiUrl + '/health');
    const response = await fetch(apiUrl + '/health', {
      method: 'GET',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export default api;

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T & { accessToken?: string };
  error?: {
    code: string;
    message: string;
    field?: string;
    details?: any;
  };
}

// Common API error type
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
    details?: any;
  };
}