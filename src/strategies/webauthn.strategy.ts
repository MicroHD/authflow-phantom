import { Injectable } from '@nestjs/common';
import { AuthStrategy, AuthContext, AuthResult } from './base.strategy';
import { AuthUser } from '../interfaces/auth-user.interface';
import { createHash } from 'crypto';
import { WebAuthnService } from '../services/webauthn.service';

@Injectable()
export class WebAuthnStrategy implements AuthStrategy {
  readonly name = 'webauthn';

  constructor(private readonly webauthnService: WebAuthnService) {}

  async authenticate(context: AuthContext): Promise<AuthResult> {
    if (!context.fingerprint) {
      throw new Error('Fingerprint is required for WebAuthn authentication');
    }

    // Generate registration options
    const options = await this.webauthnService.generateRegistrationOptions({
      id: this.generateUserId(context.fingerprint),
      username: context.fingerprint,
      displayName: context.fingerprint,
    });

    return {
      user: {
        id: options.user.id,
        isAnonymous: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      },
      token: options.challenge,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    };
  }

  async validate(token: string, context: AuthContext): Promise<AuthUser> {
    if (!context.fingerprint || !context.webauthnResponse) {
      throw new Error('Missing required context for WebAuthn validation');
    }

    // Store the challenge token for verification
    await this.webauthnService.storeChallenge(context.fingerprint, token);

    // Verify the attestation response
    const verification = await this.webauthnService.verifyRegistration(
      context.fingerprint,
      context.webauthnResponse
    );

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error('WebAuthn verification failed');
    }

    // Store the credential
    await this.webauthnService.storeCredential({
      userId: context.fingerprint,
      credentialId: verification.registrationInfo.credential.id,
      publicKey: Buffer.from(verification.registrationInfo.credential.publicKey).toString('base64'),
      counter: verification.registrationInfo.credential.counter,
    });

    // Create or update user
    const user: AuthUser = {
      id: context.fingerprint,
      isAnonymous: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      metadata: {
        webauthn: {
          credentialId: verification.registrationInfo.credential.id,
          counter: verification.registrationInfo.credential.counter,
        },
      },
    };

    return user;
  }

  async revoke(token: string): Promise<void> {
    await this.webauthnService.revokeCredential(token);
  }

  private generateUserId(fingerprint: string): string {
    return createHash('sha256')
      .update(fingerprint)
      .digest('hex')
      .slice(0, 16);
  }
} 