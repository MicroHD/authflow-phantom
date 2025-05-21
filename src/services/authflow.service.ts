import { Injectable } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { PhantomLinkService } from './phantom-link.service';
import { DeviceTokenService } from './device-token.service';
import { EmailStrategy } from '../strategies/email.strategy';
import { PhantomContext, ContextEngine } from '../utils/context';
import { UserService } from './user.service';
import { AuthFlowError } from '../errors/authflow.errors';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from './redis.service';

interface SessionPayload {
  userId: string;
  email: string;
  deviceId?: string;
  exp: number;
  iat: number;
}

@Injectable()
export class AuthFlowService {
  private readonly secret: string;
  private readonly sessionExpiryDays: number;

  constructor(
    private readonly phantomLink: PhantomLinkService,
    private readonly deviceToken: DeviceTokenService,
    private readonly emailStrategy: EmailStrategy,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {
    this.secret = process.env.JWT_SECRET || 'your-secret-key';
    this.sessionExpiryDays = parseInt(process.env.SESSION_EXPIRY_DAYS || '7', 10);
  }

  async initiateLogin(email: string, context: PhantomContext): Promise<void> {
    await this.emailStrategy.sendLoginLink(email, context);
  }

  async validateLogin(
    phantomLink: string,
    requestContext: PhantomContext
  ): Promise<{ sessionToken: string; deviceToken?: string }> {
    // Validate phantom link
    const { email, context } = await this.phantomLink.validatePhantomLink(phantomLink, requestContext);

    // Verify context
    if (!ContextEngine.matchContext(context, requestContext)) {
      throw new AuthFlowError('Context verification failed');
    }

    // Get or create user
    let user = await this.userService.findByEmail(email);
    if (!user) {
      user = await this.userService.create(email);
    }

    // Generate session token
    const sessionToken = this.generateSessionToken(user.id, user.email);

    // Generate device token if requested
    let deviceToken: string | undefined;
    if (requestContext.fingerprint) {
      deviceToken = await this.deviceToken.generateDeviceToken(user.id, requestContext);
    }

    return { sessionToken, deviceToken };
  }

  async validateSession(sessionToken: string): Promise<{ userId: string; email: string }> {
    const payload = verify(sessionToken, this.secret) as SessionPayload;
    if (!payload) {
      throw new Error('Invalid session token');
    }

    return {
      userId: payload.userId,
      email: payload.email,
    };
  }

  async validateDeviceLogin(
    deviceToken: string,
    requestContext: PhantomContext
  ): Promise<{ sessionToken: string }> {
    const { userId } = await this.deviceToken.validateDeviceToken(deviceToken, requestContext);

    // Get user from user service
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new AuthFlowError('User not found');
    }

    // Generate new session token
    const sessionToken = this.generateSessionToken(user.id, user.email);

    return { sessionToken };
  }

  async logout(userId: string, deviceId?: string): Promise<void> {
    if (deviceId) {
      await this.redisService.del(`device:${userId}:${deviceId}`);
    } else {
      await this.redisService.del(`session:${userId}`);
    }
  }

  private generateSessionToken(userId: string, email: string | null): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: SessionPayload = {
      userId,
      email: email || '',
      exp: now + (this.sessionExpiryDays * 24 * 60 * 60),
      iat: now,
    };

    return sign(payload, this.secret);
  }

  async issueDeviceToken(userId: string): Promise<any> {
    const token = this.jwtService.sign({ userId, type: 'device' });
    await this.redisService.set(`device:${userId}`, token, 30 * 24 * 60 * 60); // 30 days
    return { deviceToken: token };
  }

  async createGuestSession(_context: PhantomContext): Promise<any> {
    const guestId = `guest_${Date.now()}`;
    const user = await this.userService.create(guestId);
    const sessionToken = this.jwtService.sign({ userId: user.id, type: 'session' });
    return { sessionToken, user };
  }

  async upgradeGuestAccount(_userId: string, email: string, _context: PhantomContext): Promise<any> {
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }
    const updatedUser = await this.userService.update(_userId, { email });
    const sessionToken = this.jwtService.sign({ userId: updatedUser.id, type: 'session' });
    return { sessionToken, user: updatedUser };
  }

  async getCurrentUser(userId: string): Promise<any> {
    return this.userService.findById(userId);
  }

  async verifyContext(context: PhantomContext, fingerprint: string): Promise<boolean> {
    return context.fingerprint === fingerprint;
  }

  async refreshSession(userId: string): Promise<any> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const sessionToken = this.jwtService.sign({ userId: user.id, type: 'session' });
    return { sessionToken, user };
  }

  async getDebugTokens(userId: string): Promise<any> {
    const deviceTokens = await this.redisService.get(`device:${userId}`);
    const sessionToken = await this.redisService.get(`session:${userId}`);
    return { deviceTokens, sessionToken };
  }
} 