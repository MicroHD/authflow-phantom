import { Module, DynamicModule } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { RedisConfig } from './interfaces/config.interface';

@Module({})
export class RedisModule {
  static forRoot(config: RedisConfig): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: 'REDIS_CONFIG',
          useValue: config,
        },
        RedisService,
      ],
      exports: [RedisService],
    };
  }
} 