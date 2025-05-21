import { Request } from 'express';
import { JsonValue } from '@prisma/client/runtime/library';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  metadata: JsonValue | null;
  devices?: Device[];
  sessions?: Session[];
}

export interface Device {
  id: string;
  userId: string;
  deviceToken: string;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export interface PhantomContext {
  ip: string;
  userAgent: string;
  fingerprint?: string;
  timestamp: number;
} 