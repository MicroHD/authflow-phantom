import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { WebAuthnError } from '../errors/authflow.errors';

interface WebAuthnUser {
  id: string;
  username: string;
  displayName: string;
  currentChallenge?: string;
}

interface StoredCredential {
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
}

@Injectable()
export class WebAuthnService {
  private readonly rpName: string;
  private readonly rpID: string;
  private readonly origin: string;

  constructor(private readonly db: DatabaseService) {
    this.rpName = process.env.WEBAUTHN_RP_NAME || 'AuthFlow Phantom';
    this.rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
    this.origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
  }

  private handleError(error: unknown, message: string): never {
    if (error instanceof Error) {
      throw new WebAuthnError(`${message}: ${error.message}`);
    }
    throw new WebAuthnError(message);
  }

  async generateRegistrationOptions(user: WebAuthnUser): Promise<PublicKeyCredentialCreationOptionsJSON> {
    try {
      const options = await generateRegistrationOptions({
        rpName: this.rpName,
        rpID: this.rpID,
        userID: Buffer.from(user.id),
        userName: user.username,
        attestationType: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
          requireResidentKey: true,
        },
      });

      await this.storeChallenge(user.id, options.challenge);
      return options;
    } catch (error) {
      this.handleError(error, 'Failed to generate registration options');
    }
  }

  async generateAuthenticationOptions(userId: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
    try {
      const credentials = await this.getUserCredentials(userId);
      
      const options = await generateAuthenticationOptions({
        rpID: this.rpID,
        allowCredentials: credentials.map(cred => ({
          id: cred.credentialId,
          type: 'public-key',
        })),
        userVerification: 'preferred',
      });

      await this.storeChallenge(userId, options.challenge);
      return options;
    } catch (error) {
      this.handleError(error, 'Failed to generate authentication options');
    }
  }

  async verifyRegistration(
    userId: string,
    credential: RegistrationResponseJSON,
  ): Promise<VerifiedRegistrationResponse> {
    try {
      const expectedChallenge = await this.db.get<string>(`webauthn:challenge:${userId}`);
      if (!expectedChallenge) {
        throw new WebAuthnError('No challenge found');
      }

      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      });

      if (!verification.verified) {
        throw new WebAuthnError('Registration verification failed');
      }

      return verification;
    } catch (error) {
      this.handleError(error, 'Failed to verify registration');
    }
  }

  async verifyAuthentication(
    userId: string,
    credential: AuthenticationResponseJSON,
  ): Promise<VerifiedAuthenticationResponse> {
    try {
      const expectedChallenge = await this.db.get<string>(`webauthn:challenge:${userId}`);
      if (!expectedChallenge) {
        throw new WebAuthnError('No challenge found');
      }

      const storedCredential = await this.getCredential(credential.id);
      if (!storedCredential) {
        throw new WebAuthnError('Credential not found');
      }

      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        credential: {
          id: storedCredential.credentialId,
          publicKey: Buffer.from(storedCredential.publicKey),
          counter: storedCredential.counter,
        },
      });

      if (!verification.verified) {
        throw new WebAuthnError('Authentication verification failed');
      }

      await this.updateCredentialCounter(storedCredential.credentialId, verification.authenticationInfo.newCounter);
      return verification;
    } catch (error) {
      this.handleError(error, 'Failed to verify authentication');
    }
  }

  async storeCredential(credential: StoredCredential): Promise<void> {
    try {
      await this.db.setWithExpiry(
        `webauthn:credential:${credential.credentialId}`,
        credential,
        0 // No expiry
      );

      const userCredentials = await this.getUserCredentials(credential.userId);
      userCredentials.push(credential);
      await this.db.setWithExpiry(
        `webauthn:user:${credential.userId}:credentials`,
        userCredentials,
        0 // No expiry
      );
    } catch (error) {
      this.handleError(error, 'Failed to store credential');
    }
  }

  async getCredential(credentialId: string): Promise<StoredCredential | null> {
    try {
      return await this.db.get<StoredCredential>(`webauthn:credential:${credentialId}`);
    } catch (error) {
      this.handleError(error, 'Failed to get credential');
    }
  }

  async getUserCredentials(userId: string): Promise<StoredCredential[]> {
    try {
      return await this.db.get<StoredCredential[]>(`webauthn:user:${userId}:credentials`) || [];
    } catch (error) {
      this.handleError(error, 'Failed to get user credentials');
    }
  }

  async updateCredentialCounter(credentialId: string, newCounter: number): Promise<void> {
    try {
      const credential = await this.getCredential(credentialId);
      if (!credential) {
        throw new WebAuthnError('Credential not found');
      }

      credential.counter = newCounter;
      await this.db.setWithExpiry(
        `webauthn:credential:${credentialId}`,
        credential,
        0 // No expiry
      );
    } catch (error) {
      this.handleError(error, 'Failed to update credential counter');
    }
  }

  async revokeCredential(credentialId: string): Promise<void> {
    try {
      const credential = await this.getCredential(credentialId);
      if (!credential) {
        throw new WebAuthnError('Credential not found');
      }

      const userCredentials = await this.getUserCredentials(credential.userId);
      const updatedCredentials = userCredentials.filter(c => c.credentialId !== credentialId);
      await this.db.setWithExpiry(
        `webauthn:user:${credential.userId}:credentials`,
        updatedCredentials,
        0 // No expiry
      );

      await this.db.del(`webauthn:credential:${credentialId}`);
    } catch (error) {
      this.handleError(error, 'Failed to revoke credential');
    }
  }

  async storeChallenge(userId: string, challenge: string): Promise<void> {
    try {
      await this.db.setWithExpiry(
        `webauthn:challenge:${userId}`,
        challenge,
        300 // 5 minutes
      );
    } catch (error) {
      this.handleError(error, 'Failed to store challenge');
    }
  }
} 