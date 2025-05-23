import {
  AuthFlowService,
  DatabaseService,
  DeviceTokenService,
  PhantomLinkService,
  RateLimitService,
  WebAuthnService,
  UserService,
  ApiKeyService,
  ConfigService,
  RedisService,
  PrismaService
} from '@auth-flow/phantom';

// This is just a type check - if any of these imports fail, TypeScript will error
const services = {
  AuthFlowService,
  DatabaseService,
  DeviceTokenService,
  PhantomLinkService,
  RateLimitService,
  WebAuthnService,
  UserService,
  ApiKeyService,
  ConfigService,
  RedisService,
  PrismaService
};

console.log('All services successfully exported:', Object.keys(services)); 