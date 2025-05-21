export class AuthFlowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthFlowError';
  }
}

export class RateLimitError extends AuthFlowError {
  constructor(message: string, public readonly resetTime: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ContextVerificationError extends AuthFlowError {
  constructor(message: string) {
    super(message);
    this.name = 'ContextVerificationError';
  }
}

export class TokenExpiredError extends AuthFlowError {
  constructor(message: string) {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

export class InvalidTokenError extends AuthFlowError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

export class DeviceTokenError extends AuthFlowError {
  constructor(message: string) {
    super(message);
    this.name = 'DeviceTokenError';
  }
}

export class PhantomLinkError extends AuthFlowError {
  constructor(message: string) {
    super(message);
    this.name = 'PhantomLinkError';
  }
}

export class WebAuthnError extends AuthFlowError {
  constructor(message: string) {
    super(message);
    this.name = 'WebAuthnError';
  }
} 