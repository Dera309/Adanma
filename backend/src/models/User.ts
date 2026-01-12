export interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  name: string;
  roles: string[]; // 'buyer', 'vendor', 'admin'
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  addresses: Address[];
  primaryAddressId?: string;
  socialAccounts: {
    whatsapp?: string;
    facebook?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface Address {
  id: string;
  userId: string;
  country: 'Nigeria' | 'Ghana' | 'Kenya' | 'South Africa' | 'Cameroon' | 'Egypt';
  // Nigeria fields
  state?: string;
  lga?: string;
  // Ghana fields
  region?: string;
  district?: string;
  // Kenya fields
  county?: string;
  subCounty?: string;
  // South Africa fields
  province?: string;
  municipality?: string;
  // Cameroon fields
  division?: string;
  // Egypt fields
  governorate?: string;
  // Common fields
  city: string;
  streetAddress: string;
  postalCode?: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  isActive: boolean;
  userAgent?: string;
  ipAddress?: string;
}