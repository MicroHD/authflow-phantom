export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  deviceId?: string;
  isAnonymous: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  metadata?: Record<string, any>;
} 