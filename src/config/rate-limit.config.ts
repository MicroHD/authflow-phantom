import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const rateLimitConfig: ThrottlerModuleOptions = {
  throttlers: [
    {
      name: 'default',
      ttl: 60,
      limit: 10,
    },
    {
      name: 'login',
      ttl: 300,
      limit: 5,
    },
    {
      name: 'verify',
      ttl: 300,
      limit: 3,
    },
  ],
}; 