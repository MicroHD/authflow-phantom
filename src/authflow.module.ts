import { Module } from '@nestjs/common';
import { AuthFlowService } from './services/authflow.service';
import { DatabaseService } from './services/database.service';
import { DeviceTokenService } from './services/device-token.service';
import { PhantomLinkService } from './services/phantom-link.service';
import { RateLimitService } from './services/rate-limit.service';
import { WebAuthnService } from './services/webauthn.service';
import { UserService } from './services/user.service';
import { EmailStrategy } from './strategies/email.strategy';
import { WebAuthnStrategy } from './strategies/webauthn.strategy';

@Module({
  providers: [
    AuthFlowService,
    DatabaseService,
    DeviceTokenService,
    PhantomLinkService,
    RateLimitService,
    WebAuthnService,
    UserService,
    EmailStrategy,
    WebAuthnStrategy,
  ],
  exports: [
    AuthFlowService,
    DatabaseService,
    DeviceTokenService,
    PhantomLinkService,
    RateLimitService,
    WebAuthnService,
    UserService,
    EmailStrategy,
    WebAuthnStrategy,
  ],
})
export class AuthFlowModule {} 