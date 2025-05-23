# @auth-flow/phantom

[![npm version](https://badge.fury.io/js/%40authflow%2Fphantom.svg)](https://badge.fury.io/js/%40authflow%2Fphantom)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-Compatible-red.svg)](https://nestjs.com/)
[![Bun](https://img.shields.io/badge/Bun-Compatible-000000.svg)](https://bun.sh/)

A secure, passwordless authentication library for NestJS applications. Built with TypeScript and designed for modern web applications.

## 🌟 Features

- 🔐 **Phantom Links**: Secure, one-time, short-lived links tied to user/device context
- 💾 **Device Memory Tokens**: Local device tokens for seamless re-login
- 📧 **Email Magic Links**: Passwordless login via email
- 🎯 **WebAuthn Support**: FIDO2/WebAuthn authentication
- 🛡️ **Security Features**:
  - Rate limiting
  - Context verification
  - IP-based blocking
  - Challenge expiration
  - Secure token generation
  - Redis-backed session management
  - JWT token support

## 📦 Installation

```bash
# Using bun (recommended)
bun add @auth-flow/phantom

# Using npm
npm install @auth-flow/phantom

# Using yarn
yarn add @auth-flow/phantom
```

## 🔑 Getting Started

1. **Generate API Key**

You can generate your API key in two ways:

```bash
# Method 1: Using the CLI tool
bunx @auth-flow/phantom
# or
npx @auth-flow/phantom

# Method 2: Programmatically
import { ApiKeyService } from '@auth-flow/phantom';

const apiKeyService = new ApiKeyService();
const { apiKey, projectId } = apiKeyService.generateApiKey();
```

This will generate your API key and Project ID. Add them to your `.env` file:

```env
AUTHFLOW_API_KEY=your_api_key_here
AUTHFLOW_PROJECT_ID=your_project_id_here
```

2. **Install Dependencies**

```bash
bun add @auth-flow/phantom @nestjs/common @nestjs/core
```

3. **Environment Setup**

Add these to your `.env` file:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@example.com

# JWT Configuration
JWT_SECRET=your-secret-key-here

# WebAuthn Configuration (Optional)
WEBAUTHN_RP_NAME=Your App Name
WEBAUTHN_RP_ID=yourdomain.com
WEBAUTHN_ORIGIN=https://yourdomain.com
```

4. **Module Integration**

```typescript
import { Module } from '@nestjs/common';
import { AuthFlowModule } from '@auth-flow/phantom';

@Module({
  imports: [
    AuthFlowModule.forRoot({
      database: {
        url: process.env.DATABASE_URL,
      },
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
      email: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        from: process.env.SMTP_FROM,
      },
      jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
      },
      webauthn: {
        rpName: process.env.WEBAUTHN_RP_NAME,
        rpID: process.env.WEBAUTHN_RP_ID,
        origin: process.env.WEBAUTHN_ORIGIN,
      },
    }),
  ],
})
export class AppModule {}
```

5. **Controller Implementation**

```typescript
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthFlowService, AuthGuard } from '@auth-flow/phantom';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authFlow: AuthFlowService) {}

  @Post('login')
  async login(@Body('email') email: string) {
    await this.authFlow.sendMagicLink(email);
    return { message: 'Login link sent' };
  }

  @Post('verify')
  async verify(@Body('token') token: string) {
    const result = await this.authFlow.validateLogin(token);
    return result;
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request) {
    return req.user;
  }
}
```

## 🔧 Configuration Options

### AuthFlowModule Configuration

```typescript
interface AuthFlowConfig {
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  webauthn?: {
    rpName: string;
    rpID: string;
    origin: string;
  };
}
```

### Using Custom Redis Configuration

You can use your own Redis configuration in three ways:
1. **Using the built-in SharedModule (default)**:
```typescript
@Module({
  imports: [
    AuthFlowModule.forRoot({
      // ... other config
      redis: {
        host: 'localhost',
        port: 6379,
        password: 'your-password'
      },
    }),
  ],
})
export class AppModule {}
```

2. **Using your own Redis module**:
```typescript
@Module({
  imports: [
    AuthFlowModule.forRoot({
      // ... other config
      redis: {
        host: 'localhost',
        port: 6379,
        password: 'your-password'
      },
    }, {
      useCustomRedis: true,
      customRedisModule: YourRedisModule, // Your custom Redis module
    }),
  ],
})
export class AppModule {}
```

3. **Providing RedisService globally**:
```typescript
@Module({
  imports: [
    AuthFlowModule.forRoot({
      // ... other config
      redis: {
        host: 'localhost',
        port: 6379,
        password: 'your-password'
      },
    }, { useCustomRedis: true }), // No custom module provided, app must provide RedisService
  ],
})
export class AppModule {}
```

Note: When using a custom Redis module or providing RedisService globally, make sure it implements the same interface as the built-in RedisService. The RedisService should provide these methods:
- `get<T>(key: string): Promise<T | null>`
- `set(key: string, value: any, ttl?: number): Promise<void>`
- `del(key: string): Promise<void>`
- `setWithExpiry(key: string, value: any, ttl: number): Promise<void>`

### Using Custom Redis and Prisma Configuration

You can use your own Redis and Prisma configuration in several ways:

1. **Using the built-in SharedModule (default)**:
```typescript
@Module({
  imports: [
    AuthFlowModule.forRoot({
      // ... other config
      redis: {
        host: 'localhost',
        port: 6379,
        password: 'your-password'
      },
    }),
  ],
})
export class AppModule {}
```

2. **Using custom Redis and Prisma modules**:
```typescript
@Module({
  imports: [
    AuthFlowModule.forRoot({
      // ... other config
      redis: {
        host: 'localhost',
        port: 6379,
        password: 'your-password'
      },
    }, {
      useCustomRedis: true,
      customRedisModule: YourRedisModule,
      useCustomPrisma: true,
      customPrismaModule: YourPrismaModule,
    }),
  ],
})
export class AppModule {}
```

3. **Providing PrismaService globally**:
```typescript
// In your app's PrismaModule:
@Module({
  providers: [YourPrismaService],
  exports: [YourPrismaService],
})
export class PrismaModule {}

// In your AppModule:
@Module({
  imports: [
    PrismaModule, // Import your PrismaModule first
    AuthFlowModule.forRoot({
      // ... other config
      redis: {
        host: 'localhost',
        port: 6379,
        password: 'your-password'
      },
    }, {
      useCustomPrisma: true, // No custom module provided, app must provide PrismaService
    }),
  ],
})
export class AppModule {}
```

Note: When using custom modules or providing services globally, make sure they implement the correct interfaces:

**RedisService Interface:**
```typescript
interface RedisService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  setWithExpiry(key: string, value: any, ttl: number): Promise<void>;
}
```

**PrismaService Interface:**
```typescript
interface PrismaService {
  // Your Prisma client methods
  user: {
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  // ... other Prisma models
}
```

**Important**: When providing your own PrismaService:
1. Make sure your PrismaService class implements all required methods
2. Export your PrismaService from your module
3. Import your PrismaModule before AuthFlowModule in your app
4. If using a custom module, pass it through the `customPrismaModule` option

## 🔐 Security Best Practices

1. **Environment Variables**
   - Use strong, unique secrets
   - Never commit `.env` files
   - Use different secrets for development and production

2. **Rate Limiting**
   - Configure appropriate limits based on your use case
   - Monitor and adjust limits based on traffic patterns

3. **Context Verification**
   - Always verify request context
   - Implement IP-based blocking for suspicious activity

4. **Token Management**
   - Use short expiry times for phantom links
   - Implement proper token rotation
   - Monitor token usage patterns

5. **HTTPS**
   - Always use HTTPS in production
   - Configure proper SSL/TLS settings

## 🧪 Testing

```bash
# Run tests
bun test

# Run tests with coverage
bun test:cov

# Run tests in watch mode
bun test:watch
```

## 📚 API Documentation

### AuthFlowService

```typescript
class AuthFlowService {
  sendMagicLink(email: string): Promise<void>;
  validateLogin(token: string): Promise<AuthResult>;
  refreshToken(token: string): Promise<AuthResult>;
  logout(token: string): Promise<void>;
}
```

### Guards

```typescript
@UseGuards(AuthGuard)
```

### Decorators

```typescript
@AuthUser()
@RequireAuth()
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/)
- [WebAuthn](https://webauthn.io/)
- [Redis](https://redis.io/)
- [TypeScript](https://www.typescriptlang.org/)

## 📞 Support

- [GitHub Issues](https://github.com/yourusername/authflow-phantom/issues)
- [Documentation](https://docs.authflow.io/phantom)
- [Discord Community](https://discord.gg/authflow)

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes. 
