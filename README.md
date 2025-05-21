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

## 🚀 Quick Start

1. **Install Dependencies**

```bash
bun add @authflow/phantom @nestjs/common @nestjs/core
```

2. **Environment Setup**

Create a `.env` file in your project root:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-here
SESSION_EXPIRY_DAYS=7

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@example.com

# WebAuthn Configuration
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=https://localhost

# Application Configuration
APP_NAME=Your App Name
APP_URL=https://localhost

# Security Configuration
ENCRYPTION_KEY=your-32-byte-encryption-key-here
PHANTOM_LINK_EXPIRY=300
DEVICE_TOKEN_EXPIRY_DAYS=30
```

3. **Module Integration**

```typescript
import { Module } from '@nestjs/common';
import { AuthFlowModule } from '@authflow/phantom';

@Module({
  imports: [
    AuthFlowModule.forRoot({
      // Optional configuration
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5 // limit each IP to 5 requests per windowMs
      }
    })
  ],
})
export class AppModule {}
```

4. **Controller Implementation**

```typescript
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthFlowService, AuthGuard, ContextEngine } from '@authflow/phantom';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authFlow: AuthFlowService) {}

  @Post('login')
  async login(@Body('email') email: string, @Req() req: Request) {
    const context = ContextEngine.getRequestContext(req);
    await this.authFlow.initiateLogin(email, context);
    return { message: 'Login link sent' };
  }

  @Post('verify')
  async verify(@Body('token') token: string, @Req() req: Request) {
    const context = ContextEngine.getRequestContext(req);
    const result = await this.authFlow.validateLogin(token, context);
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

### AuthFlowModule Options

```typescript
interface AuthFlowModuleOptions {
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  redis?: {
    url: string;
    ttl: number;
  };
  jwt?: {
    secret: string;
    expiresIn: string;
  };
  email?: {
    from: string;
    subject: string;
    template: string;
  };
}
```

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
  initiateLogin(email: string, context: RequestContext): Promise<void>;
  validateLogin(token: string, context: RequestContext): Promise<AuthResult>;
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
