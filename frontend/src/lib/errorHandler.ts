import axios, { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class ErrorHandler {
  private static toastHandler: ((title: string, message?: string) => void) | null = null;
  private static retryQueue: Array<() => Promise<any>> = [];
  private static isRefreshing = false;

  static setToastHandler(handler: (title: string, message?: string) => void) {
    this.toastHandler = handler;
  }

  static setupAxiosInterceptors() {
    // Note: We'll set up interceptors on the api instance instead of global axios
    // This prevents conflicts with other axios instances
    return; // Temporarily disabled to prevent conflicts

    // Response interceptor
    axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve) => {
              this.retryQueue.push(async () => {
                const result = await axios(originalRequest);
                resolve(result);
                return result;
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Try to refresh the token
            await this.refreshToken();
            this.processRetryQueue();
            return axios(originalRequest);
          } catch (refreshError) {
            this.processRetryQueue(refreshError);
            this.redirectToLogin();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  private static async refreshToken(): Promise<void> {
    try {
      await axios.post('/api/auth/refresh', {}, { withCredentials: true });
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  }

  private static processRetryQueue(error?: any) {
    this.retryQueue.forEach((callback) => {
      if (error) {
        callback();
      } else {
        callback();
      }
    });
    this.retryQueue = [];
  }

  private static redirectToLogin() {
    // Clear any stored auth data
    localStorage.removeItem('lastAuthRefresh');
    
    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  static handleApiError(error: AxiosError) {
    const apiError = this.parseApiError(error);
    
    // Don't show toast for certain errors
    if (this.shouldSuppressError(error)) {
      return;
    }

    // Show user-friendly error message
    if (this.toastHandler) {
      this.toastHandler(
        this.getErrorTitle(apiError),
        this.getErrorMessage(apiError)
      );
    }

    // Log error for monitoring
    this.logError(error, apiError);
  }

  private static parseApiError(error: AxiosError): ApiError {
    const response = error.response;
    
    if (response?.data && typeof response.data === 'object') {
      const data = response.data as any;
      return {
        message: data.message || data.error || 'An error occurred',
        code: data.code,
        status: response.status,
        details: data.details
      };
    }

    return {
      message: error.message || 'Network error occurred',
      status: response?.status,
    };
  }

  private static shouldSuppressError(error: AxiosError): boolean {
    const status = error.response?.status;
    const url = error.config?.url;

    // Suppress 401 errors (handled by interceptor)
    if (status === 401) return true;

    // Suppress errors for certain endpoints
    if (url?.includes('/auth/refresh')) return true;
    if (url?.includes('/users/profile') && status === 404) return true;

    return false;
  }

  private static getErrorTitle(apiError: ApiError): string {
    const status = apiError.status;

    switch (status) {
      case 400:
        return 'Invalid Request';
      case 403:
        return 'Access Denied';
      case 404:
        return 'Not Found';
      case 409:
        return 'Conflict';
      case 422:
        return 'Validation Error';
      case 429:
        return 'Too Many Requests';
      case 500:
        return 'Server Error';
      case 502:
      case 503:
      case 504:
        return 'Service Unavailable';
      default:
        return 'Error';
    }
  }

  private static getErrorMessage(apiError: ApiError): string {
    const status = apiError.status;

    // Use API message if available and user-friendly
    if (apiError.message && !apiError.message.includes('Error:')) {
      return apiError.message;
    }

    // Fallback messages
    switch (status) {
      case 400:
        return 'Please check your input and try again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data.';
      case 422:
        return 'Please check your input for errors.';
      case 429:
        return 'Please wait a moment before trying again.';
      case 500:
        return 'Something went wrong on our end. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Our service is temporarily unavailable. Please try again later.';
      default:
        if (!navigator.onLine) {
          return 'Please check your internet connection and try again.';
        }
        return 'An unexpected error occurred. Please try again.';
    }
  }

  private static logError(error: AxiosError, apiError: ApiError) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: apiError.status,
      message: apiError.message,
      code: apiError.code,
      correlationId: error.config?.headers?.['X-Correlation-ID'],
      userAgent: navigator.userAgent,
      stack: error.stack
    };

    console.error('API Error:', errorLog);

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to error monitoring service (e.g., Sentry)
    }
  }

  private static generateCorrelationId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  static handleNetworkError() {
    if (this.toastHandler) {
      this.toastHandler(
        'Connection Error',
        'Please check your internet connection and try again.'
      );
    }
  }

  static handleRetry(retryFn: () => Promise<any>) {
    if (this.toastHandler) {
      this.toastHandler(
        'Retrying...',
        'Attempting to reconnect.'
      );
    }
    
    return retryFn();
  }
}

// Network status monitoring
export const setupNetworkMonitoring = (showError: (title: string, message?: string) => void) => {
  window.addEventListener('online', () => {
    showError('Connection Restored', 'You are back online.');
  });

  window.addEventListener('offline', () => {
    showError('Connection Lost', 'Please check your internet connection.');
  });
};