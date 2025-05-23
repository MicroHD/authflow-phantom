import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthFlowService } from './services/authflow.service';
import { DatabaseService } from './services/database.service';
import { DeviceTokenService } from './services/device-token.service';
import { PhantomLinkService } from './services/phantom-link.service';
import { RateLimitService } from './services/rate-limit.service';
import { WebAuthnService } from './services/webauthn.service';
import { UserService } from './services/user.service';
import { EmailStrategy } from './strategies/email.strategy';
import { WebAuthnStrategy } from './strategies/webauthn.strategy';
import { AuthFlowConfig } from './interfaces/config.interface';
import { ConfigService } from './services/config.service';
import { SharedModule } from './shared.module';

@Global()
@Module({})
export class AuthFlowModule {
  static forRoot(
    config: AuthFlowConfig,
    options?: {
      useCustomRedis?: boolean;
      customRedisModule?: any;
      useCustomPrisma?: boolean;
      customPrismaModule?: any;
    }
  ): DynamicModule {
    // Create imports array with required modules
    const imports = [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [() => ({ authflow: config })],
      }),
      JwtModule.register({
        secret: config.jwt.secret,
        signOptions: { expiresIn: config.jwt.expiresIn },
      }),
    ];

    // Add SharedModule with Redis and Prisma configuration
    imports.push(
      SharedModule.forRoot({
        redis: config.redis,
        useCustomPrisma: options?.useCustomPrisma,
        customPrismaModule: options?.customPrismaModule,
      })
    );

    // If using custom Prisma module, ensure it's imported
    if (options?.useCustomPrisma && options?.customPrismaModule) {
      imports.push(options.customPrismaModule);
    }

    return {
      module: AuthFlowModule,
      imports,
      providers: [
        {
          provide: 'AUTHFLOW_CONFIG',
          useValue: config,
        },
        ConfigService,
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
        ConfigService,
        AuthFlowService,
        DatabaseService,
        DeviceTokenService,
        PhantomLinkService,
        RateLimitService,
        WebAuthnService,
        UserService,
        EmailStrategy,
        WebAuthnStrategy,
        JwtModule,
      ],
    };
  }
} 