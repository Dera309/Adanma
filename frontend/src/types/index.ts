export interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  roles: string | string[];
  emailVerified: boolean;
  phoneVerified: boolean;
  verificationStatus: string;
  authProvider: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface Order {
  id: string;
  status: string;
  total: number;
  totalAmount?: number;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T & { accessToken?: string; user?: User };
  error?: {
    code: string;
    message: string;
    field?: string;
    details?: any;
  };
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}