import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Utility function to generate correlation ID
const generateCorrelationId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Enhanced error logging
const logError = (context: string, error: any) => {
  console.group(`🔧 API Error - ${context}`);
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    name: error.name,
    stack: error.stack?.split('\n').slice(0, 3)
  });
  
  if (error.response) {
    console.error('Response:', {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
      headers: Object.fromEntries(
        Object.entries(error.response.headers || {}).filter(([key]) => 
          key.toLowerCase().includes('access-control') || 
          key.toLowerCase().includes('content-type')
        )
      )
    });
  }
  
  if (error.request) {
    console.error('Request details:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      timeout: error.config?.timeout,
      withCredentials: error.config?.withCredentials
    });
  }
  console.groupEnd();
};

// Create axios instance with enhanced configuration
const api: AxiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api',
  timeout: 15000, // Increased timeout
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  // Retry configuration
  validateStatus: (status) => status < 500, // Don't throw on 4xx errors
});

// Request interceptor with enhanced logging
api.interceptors.request.use(
  (config) => {
    // Add correlation ID for tracking
    config.headers['X-Correlation-ID'] = generateCorrelationId();
    
    // Add origin header for CORS
    if (typeof window !== 'undefined') {
      config.headers['Origin'] = window.location.origin;
    }
    
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error: AxiosError) => {
    logError('Request Interceptor', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error: AxiosError) => {
    const context = `${error.config?.method?.toUpperCase()} ${error.config?.url}`;
    
    if (error.response) {
      const { status, data } = error.response;
      
      // Log different types of errors appropriately
      if (status >= 500) {
        logError(`Server Error (${status})`, error);
      } else if (status === 401) {
        console.log(`🔐 Authentication required for ${context}`);
      } else if (status === 403) {
        console.log(`🚫 Access forbidden for ${context}`);
      } else if (status === 404) {
        console.log(`📭 Resource not found: ${context}`);
      } else {
        logError(`Client Error (${status})`, error);
      }

      // Return the error response data for handling in components
      return Promise.reject(data || error);
    } else if (error.request) {
      // Network error - this is where the XMLHttpRequest error occurs
      logError('Network Error', error);
      
      // Check for specific network error types
      let errorMessage = 'Network error. Please check your connection and try again.';
      let errorCode = 'NETWORK_ERROR';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running.';
        errorCode = 'CONNECTION_REFUSED';
      } else if (error.code === 'ETIMEDOUT') {
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
          message: errorMessage,
          details: {
            originalError: error.message,
            code: error.code,
            name: error.name
          }
        }
      });
    } else {
      // Something else happened
      logError('Unknown Error', error);
      return Promise.reject({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred.',
          details: {
            originalError: error.message,
            name: error.name
          }
        }
      });
    }
  }
);

// Health check function
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/health', {
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

// Connection test function
export const testConnection = async (): Promise<{
  backend: boolean;
  cors: boolean;
  auth: boolean;
}> => {
  const results = {
    backend: false,
    cors: false,
    auth: false
  };
  
  try {
    // Test backend
    results.backend = await checkApiHealth();
    
    // Test CORS
    if (results.backend) {
      try {
        const corsResponse = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/login', {
          method: 'OPTIONS',
          headers: {
            'Origin': window.location.origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
          }
        });
        results.cors = corsResponse.ok;
      } catch (error) {
        console.error('CORS test failed:', error);
      }
      
      // Test auth endpoint
      if (results.cors) {
        try {
          await api.post('/auth/login', {
            identifier: 'test@example.com',
            password: 'testpassword123'
          });
          results.auth = true;
        } catch (error: any) {
          // Auth might fail due to credentials, but if we get a proper response, connection works
          results.auth = error?.error?.code !== 'NETWORK_ERROR' && error?.code !== 'NETWORK_ERROR';
        }
      }
    }
  } catch (error) {
    console.error('Connection test failed:', error);
  }
  
  return results;
};

export default api;

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
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