import { Module, DynamicModule, Global, Provider } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { PrismaService } from './services/prisma.service';
import { RedisConfig } from './interfaces/config.interface';

@Global()
@Module({})
export class SharedModule {
  static forRoot(config: { 
    redis: RedisConfig;
    useCustomPrisma?: boolean;
    customPrismaModule?: any;
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'REDIS_CONFIG',
        useValue: config.redis,
      },
      RedisService,
    ];

    const imports = [];

    // Handle Prisma configuration
    if (config.useCustomPrisma) {
      if (config.customPrismaModule) {
        imports.push(config.customPrismaModule);
      }
      // If no custom module provided but useCustomPrisma is true,
      // we assume the app will provide PrismaService globally
    } else {
      providers.push(PrismaService); // Use the class directly as a provider
    }

    return {
      module: SharedModule,
      imports,
      providers,
      exports: [RedisService, PrismaService], // Export the class directly
    };
  }
} 