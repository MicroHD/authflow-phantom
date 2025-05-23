export interface DatabaseConfig {
  url: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface WebAuthnConfig {
  rpName: string;
  rpID: string;
  origin: string;
}

export interface AuthFlowConfig {
  database: DatabaseConfig;
  redis: RedisConfig;
  email: EmailConfig;
  jwt: JwtConfig;
  webauthn?: WebAuthnConfig;
} 