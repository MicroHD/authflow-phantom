import { Injectable } from '@nestjs/common';
import { sign, verify, JwtPayload } from 'jsonwebtoken';
import { createHmac, randomBytes } from 'crypto';
import { DatabaseService } from './database.service';
import { PhantomContext, ContextEngine } from '../utils/context';
import {
  PhantomLinkError,
  TokenExpiredError,
  InvalidTokenError,
  ContextVerificationError,
} from '../errors/authflow.errors';

interface PhantomLinkPayload extends JwtPayload {
  email: string;
  context: PhantomContext;
  jti: string;
}

@Injectable()
export class PhantomLinkService {
  private readonly secret: string;
  private readonly expirySeconds: number;
  private readonly maxAttempts: number;

  constructor(
    private readonly db: DatabaseService,
  ) {
    this.secret = process.env.JWT_SECRET || 'your-secret-key';
    this.expirySeconds = parseInt(process.env.PHANTOM_LINK_EXPIRY || '300', 10); // 5 minutes default
    this.maxAttempts = parseInt(process.env.PHANTOM_LINK_MAX_ATTEMPTS || '3', 10);
  }

  async generatePhantomLink(email: string, context: PhantomContext): Promise<string> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const jti = randomBytes(16).toString('hex');

      const payload: PhantomLinkPayload = {
        email,
        context,
        exp: now + this.expirySeconds,
        iat: now,
        jti,
      };

      // Generate JWT with additional security claims
      const token = sign(payload, this.secret, {
        algorithm: 'HS256',
        jwtid: jti,
        noTimestamp: false,
      });

      // Generate HMAC of context
      const hmac = this.generateContextHmac(context);

      // Combine token and HMAC
      const phantomLink = `${token}.${hmac}`;

      // Store in Redis with expiry and attempt tracking
      await this.db.setWithExpiry(
        `phantom:${email}:${hmac}`,
        {
          token,
          context,
          attempts: 0,
          jti,
        },
        this.expirySeconds
      );

      return phantomLink;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new PhantomLinkError(`Failed to generate phantom link: ${errorMessage}`);
    }
  }

  async validatePhantomLink(
    phantomLink: string,
    requestContext: PhantomContext
  ): Promise<{ email: string; context: PhantomContext }> {
    try {
      const [token, hmac] = phantomLink.split('.');
      if (!token || !hmac) {
        throw new InvalidTokenError('Invalid phantom link format');
      }

      // Verify JWT
      const payload = verify(token, this.secret, {
        algorithms: ['HS256'],
      }) as PhantomLinkPayload;

      if (!payload) {
        throw new InvalidTokenError('Invalid token');
      }

      // Check if token is expired
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new TokenExpiredError('Phantom link has expired');
      }

      // Verify HMAC
      const expectedHmac = this.generateContextHmac(payload.context);
      if (hmac !== expectedHmac) {
        throw new ContextVerificationError('Context mismatch');
      }

      // Check if link exists and hasn't been used
      const stored = await this.db.get<{
        token: string;
        context: PhantomContext;
        attempts: number;
        jti: string;
      }>(`phantom:${payload.email}:${hmac}`);

      if (!stored) {
        throw new InvalidTokenError('Link already used or expired');
      }

      // Check attempt count
      if (stored.attempts >= this.maxAttempts) {
        await this.db.del(`phantom:${payload.email}:${hmac}`);
        throw new InvalidTokenError('Maximum attempts exceeded');
      }

      // Verify JTI to prevent replay attacks
      if (stored.jti !== payload.jti) {
        throw new InvalidTokenError('Invalid token ID');
      }

      // Verify context matches
      if (!ContextEngine.matchContext(payload.context, requestContext)) {
        // Increment attempt counter
        await this.db.setWithExpiry(
          `phantom:${payload.email}:${hmac}`,
          {
            ...stored,
            attempts: stored.attempts + 1,
          },
          this.expirySeconds
        );
        throw new ContextVerificationError('Context verification failed');
      }

      // Invalidate the link
      await this.db.del(`phantom:${payload.email}:${hmac}`);

      return {
        email: payload.email,
        context: payload.context,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (error instanceof PhantomLinkError ||
          error instanceof TokenExpiredError ||
          error instanceof InvalidTokenError ||
          error instanceof ContextVerificationError) {
        throw error;
      }
      throw new PhantomLinkError(`Failed to validate phantom link: ${errorMessage}`);
    }
  }

  private generateContextHmac(context: PhantomContext): string {
    const contextString = JSON.stringify({
      ip: context.ipAddress,
      ua: context.userAgent,
      fp: context.fingerprint,
      geo: context.geoLocation,
    });

    return createHmac('sha256', this.secret)
      .update(contextString)
      .digest('hex')
      .slice(0, 16);
  }
} 