import { Injectable } from '@nestjs/common';
import { AuthStrategy, AuthContext, AuthResult } from './base.strategy';
import { AuthUser } from '../interfaces/auth-user.interface';
import { randomBytes, createHash } from 'crypto';
import { createTransport, Transporter } from 'nodemailer';
import { PhantomLinkService } from '../services/phantom-link.service';
import { RateLimitService } from '../services/rate-limit.service';
import { PhantomContext } from '../utils/context';
import { RateLimitError } from '../errors/authflow.errors';

@Injectable()
export class EmailStrategy implements AuthStrategy {
  readonly name = 'email';
  private readonly phantomLinks = new Map<string, { 
    email: string;
    context: AuthContext;
    expiresAt: Date;
  }>();
  private readonly transporter: Transporter;
  private readonly rateLimitConfig = {
    points: 3,
    duration: 300, // 5 minutes
    blockDuration: 900, // 15 minutes
  };

  constructor(
    private readonly phantomLink: PhantomLinkService,
    private readonly rateLimit: RateLimitService,
  ) {
    this.transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true, // Use pooled connections
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000, // 1 second
      rateLimit: 5, // 5 messages per second
    });

    // Handle SMTP errors
    this.transporter.on('error', (error) => {
      console.error('SMTP Error:', error);
    });
  }

  async authenticate(context: AuthContext): Promise<AuthResult> {
    if (!context.fingerprint) {
      throw new Error('Fingerprint is required for email authentication');
    }

    // Generate a phantom link
    const link = this.generatePhantomLink(context);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    this.phantomLinks.set(link, {
      email: context.fingerprint, // In real implementation, this would be the email
      context,
      expiresAt,
    });

    // In a real implementation, you would send this link via email
    return {
      user: {
        id: 'pending',
        isAnonymous: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      },
      token: link,
      expiresAt,
    };
  }

  async validate(token: string, context: AuthContext): Promise<AuthUser> {
    const stored = this.phantomLinks.get(token);
    
    if (!stored) {
      throw new Error('Invalid phantom link');
    }

    if (stored.expiresAt < new Date()) {
      this.phantomLinks.delete(token);
      throw new Error('Phantom link expired');
    }

    // Verify context matches
    if (!this.verifyContext(stored.context, context)) {
      throw new Error('Context mismatch');
    }

    // Create or retrieve user
    const user: AuthUser = {
      id: this.generateUserId(stored.email),
      email: stored.email,
      isAnonymous: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    // Clean up used link
    this.phantomLinks.delete(token);

    return user;
  }

  async revoke(token: string): Promise<void> {
    this.phantomLinks.delete(token);
  }

  private generatePhantomLink(context: AuthContext): string {
    const data = `${context.fingerprint}-${Date.now()}-${randomBytes(16).toString('hex')}`;
    return createHash('sha256').update(data).digest('hex');
  }

  private generateUserId(email: string): string {
    return createHash('sha256')
      .update(email)
      .digest('hex')
      .slice(0, 16);
  }

  private verifyContext(stored: AuthContext, current: AuthContext): boolean {
    // In a real implementation, you would do more thorough context verification
    return stored.fingerprint === current.fingerprint;
  }

  async sendLoginLink(email: string, context: PhantomContext): Promise<void> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Check rate limit
      const rateLimitResult = await this.rateLimit.checkRateLimit(
        `email:${email}`,
        this.rateLimitConfig
      );

      if (!rateLimitResult.allowed) {
        throw new RateLimitError(
          `Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.reset / 60)} minutes.`,
          rateLimitResult.reset
        );
      }

      // Generate phantom link
      const link = await this.phantomLink.generatePhantomLink(email, context);

      // Send email with retry logic
      await this.sendEmailWithRetry({
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: email,
        subject: 'Your Login Link',
        html: this.generateEmailTemplate(link),
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to send login link: ${errorMessage}`);
    }
  }

  private async sendEmailWithRetry(
    mailOptions: any,
    retries = 3,
    delay = 1000
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.transporter.sendMail(mailOptions);
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  private generateEmailTemplate(link: string): string {
    const appName = process.env.APP_NAME || 'Your App';
    const expiryMinutes = parseInt(process.env.PHANTOM_LINK_EXPIRY || '5', 10);
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@example.com';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login to ${appName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Welcome to ${appName}</h2>
            
            <p>Click the button below to log in to your account. This link will expire in ${expiryMinutes} minutes.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL}/auth/verify?token=${link}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Log In
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              If you didn't request this link, you can safely ignore this email.
            </p>

            <hr style="border: 1px solid #eee; margin: 20px 0;">

            <div style="font-size: 12px; color: #999;">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>If you need assistance, please contact <a href="mailto:${supportEmail}">${supportEmail}</a></p>
              <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
} 