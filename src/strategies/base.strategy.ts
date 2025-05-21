import { AuthUser } from '../interfaces/auth-user.interface';

export interface AuthContext {
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  fingerprint?: string;
  origin?: string;
  rpId?: string;
  webauthnResponse?: any; // WebAuthn response from browser
}

export interface AuthResult {
  user: AuthUser;
  token?: string;
  expiresAt?: Date;
}

export interface AuthStrategy {
  readonly name: string;
  
  /**
   * Authenticate a user using this strategy
   */
  authenticate(context: AuthContext): Promise<AuthResult>;
  
  /**
   * Validate an existing authentication
   */
  validate(token: string, context: AuthContext): Promise<AuthUser>;
  
  /**
   * Revoke an existing authentication
   */
  revoke(token: string): Promise<void>;
} 