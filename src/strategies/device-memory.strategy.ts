import { Injectable } from '@nestjs/common';
import { AuthStrategy, AuthContext, AuthResult } from './base.strategy';
import { AuthUser } from '../interfaces/auth-user.interface';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class DeviceMemoryStrategy implements AuthStrategy {
  readonly name = 'deviceMemory';
  private readonly tokenStore = new Map<string, { user: AuthUser; expiresAt: Date }>();

  async authenticate(context: AuthContext): Promise<AuthResult> {
    if (!context.deviceId) {
      throw new Error('Device ID is required for device memory authentication');
    }

    // Create or retrieve user based on device ID
    const user: AuthUser = {
      id: this.generateUserId(context.deviceId),
      deviceId: context.deviceId,
      isAnonymous: true,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    const token = this.generateToken(context);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    this.tokenStore.set(token, { user, expiresAt });

    return { user, token, expiresAt };
  }

  async validate(token: string, context: AuthContext): Promise<AuthUser> {
    const stored = this.tokenStore.get(token);
    
    if (!stored) {
      throw new Error('Invalid token');
    }

    if (stored.expiresAt < new Date()) {
      this.tokenStore.delete(token);
      throw new Error('Token expired');
    }

    // Verify device ID matches
    if (stored.user.deviceId !== context.deviceId) {
      throw new Error('Device ID mismatch');
    }

    // Update last login
    stored.user.lastLoginAt = new Date();
    return stored.user;
  }

  async revoke(token: string): Promise<void> {
    this.tokenStore.delete(token);
  }

  private generateUserId(deviceId: string): string {
    return createHash('sha256')
      .update(deviceId)
      .digest('hex')
      .slice(0, 16);
  }

  private generateToken(context: AuthContext): string {
    const data = `${context.deviceId}-${Date.now()}-${randomBytes(16).toString('hex')}`;
    return createHash('sha256').update(data).digest('hex');
  }
} 