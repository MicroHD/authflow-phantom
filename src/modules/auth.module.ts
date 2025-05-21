import { Module } from '@nestjs/common';
import { AuthController } from '../controllers/auth.controller';
import { AuthFlowService } from '../services/authflow.service';
import { PhantomLinkService } from '../services/phantom-link.service';
import { DeviceTokenService } from '../services/device-token.service';
import { UserService } from '../services/user.service';
import { EmailStrategy } from '../strategies/email.strategy';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ThrottlerModule } from '@nestjs/throttler';
import { throttlerConfig } from '../config/security.config';

@Module({
  imports: [
    ThrottlerModule.forRoot(throttlerConfig),
  ],
  controllers: [AuthController],
  providers: [
    AuthFlowService,
    PhantomLinkService,
    DeviceTokenService,
    UserService,
    EmailStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthFlowService],
})
export class AuthModule {} 