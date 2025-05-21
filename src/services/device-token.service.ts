import { Injectable } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { DatabaseService } from './database.service';
import { PhantomContext, ContextEngine } from '../utils/context';

interface DeviceTokenPayload {
  userId: string;
  deviceId: string;
  context: PhantomContext;
  exp: number;
  iat: number;
}

@Injectable()
export class DeviceTokenService {
  private readonly secret: string;
  private readonly encryptionKey: Buffer;
  private readonly tokenExpiryDays: number;

  constructor(
    private readonly db: DatabaseService,
  ) {
    this.secret = process.env.JWT_SECRET || 'your-secret-key';
    this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY || 'your-32-byte-encryption-key-here', 'utf8');
    this.tokenExpiryDays = parseInt(process.env.DEVICE_TOKEN_EXPIRY_DAYS || '30', 10);
  }

  async generateDeviceToken(userId: string, context: PhantomContext): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const deviceId = randomBytes(16).toString('hex');

    const payload: DeviceTokenPayload = {
      userId,
      deviceId,
      context,
      exp: now + (this.tokenExpiryDays * 24 * 60 * 60),
      iat: now,
    };

    // Generate JWT
    const token = sign(payload, this.secret);

    // Encrypt token for storage
    const encryptedToken = this.encryptToken(token);

    // Store in Redis with expiry
    await this.db.setWithExpiry(
      `device:${userId}:${deviceId}`,
      { token, context },
      this.tokenExpiryDays * 24 * 60 * 60
    );

    return encryptedToken;
  }

  async validateDeviceToken(
    encryptedToken: string,
    requestContext: PhantomContext
  ): Promise<{ userId: string; deviceId: string }> {
    // Decrypt token
    const token = this.decryptToken(encryptedToken);

    // Verify JWT
    const payload = verify(token, this.secret) as DeviceTokenPayload;
    if (!payload) {
      throw new Error('Invalid token');
    }

    // Check if token exists
    const stored = await this.db.get<{ token: string; context: PhantomContext }>(
      `device:${payload.userId}:${payload.deviceId}`
    );
    if (!stored) {
      throw new Error('Device token not found or expired');
    }

    // Verify context matches
    if (!ContextEngine.matchContext(payload.context, requestContext)) {
      throw new Error('Context verification failed');
    }

    return {
      userId: payload.userId,
      deviceId: payload.deviceId,
    };
  }

  async revokeDeviceToken(userId: string, deviceId: string): Promise<void> {
    await this.db.del(`device:${userId}:${deviceId}`);
  }

  async revokeAllDeviceTokens(userId: string): Promise<void> {
    const keys = await this.db.keys(`device:${userId}:*`);
    await Promise.all(keys.map(key => this.db.del(key)));
  }

  private encryptToken(token: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(token, 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    // Combine IV, encrypted data, and auth tag
    return Buffer.concat([iv, encrypted, authTag]).toString('base64');
  }

  private decryptToken(encryptedData: string): string {
    const buffer = Buffer.from(encryptedData, 'base64');

    // Extract IV, encrypted data, and auth tag
    const iv = buffer.slice(0, 16);
    const authTag = buffer.slice(-16);
    const encrypted = buffer.slice(16, -16);

    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString('utf8');
  }
} 