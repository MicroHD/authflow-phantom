import { Controller, Post, Body, Req, UseGuards, HttpCode, Get } from '@nestjs/common';
import { AuthFlowService } from '../services/authflow.service';
import { PhantomContext, ContextEngine } from '../utils/context';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';
import { Throttle } from '@nestjs/throttler';

// DTOs
class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email!: string;
}

class VerifyDto {
  @ApiProperty({ example: 'phantom-link-token', description: 'Phantom link token received via email' })
  @IsString()
  token!: string;
}

class DeviceLoginDto {
  @ApiProperty({ example: 'device-token', description: 'Device token for automatic login' })
  @IsString()
  deviceToken!: string;
}

class LogoutDto {
  @ApiProperty({ example: 'device-id', description: 'Optional device ID to logout from specific device', required: false })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

class GuestUpgradeDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email to upgrade guest account' })
  @IsEmail()
  email!: string;
}

class ContextCheckDto {
  @ApiProperty({ example: 'expected-fingerprint', description: 'Expected context fingerprint' })
  @IsString()
  fingerprint!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authFlow: AuthFlowService) {}

  // 1. Phantom Link Auth
  @Post('request-link')
  @Throttle({
    default: {
      ttl: 300,
      limit: 5,
    },
  })
  @ApiOperation({ summary: 'Start login by email (sends Phantom Link)' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login link sent successfully' })
  async requestLink(@Body() loginDto: LoginDto, @Req() req: Request) {
    const context: PhantomContext = ContextEngine.getRequestContext(req);
    await this.authFlow.initiateLogin(loginDto.email, context);
    return { message: 'Login link sent' };
  }

  @Post('verify-link')
  @Throttle({
    default: {
      ttl: 300,
      limit: 3,
    },
  })
  @ApiOperation({ summary: 'Validate Phantom Link + return session token' })
  @ApiBody({ type: VerifyDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async verifyLink(@Body() verifyDto: VerifyDto, @Req() req: Request) {
    const context: PhantomContext = ContextEngine.getRequestContext(req);
    return await this.authFlow.validateLogin(verifyDto.token, context);
  }

  // 2. Device Memory Token
  @Post('device-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue device memory token on login' })
  @ApiResponse({ status: 200, description: 'Device token issued successfully' })
  async issueDeviceToken(@Req() req: Request & { user: { userId: string } }) {
    return await this.authFlow.issueDeviceToken(req.user.userId);
  }

  @Post('device-login')
  @Throttle({
    default: {
      ttl: 60,
      limit: 5,
    },
  })
  @ApiOperation({ summary: 'Attempt silent login via memory token' })
  @ApiBody({ type: DeviceLoginDto })
  @ApiResponse({ status: 200, description: 'Device login successful' })
  async deviceLogin(@Body() deviceLoginDto: DeviceLoginDto, @Req() req: Request) {
    const context: PhantomContext = ContextEngine.getRequestContext(req);
    return await this.authFlow.validateDeviceLogin(deviceLoginDto.deviceToken, context);
  }

  // 3. Guest Session + Promotion
  @Post('guest')
  @ApiOperation({ summary: 'Create anonymous guest session' })
  @ApiResponse({ status: 200, description: 'Guest session created successfully' })
  async createGuestSession(@Req() req: Request) {
    const context: PhantomContext = ContextEngine.getRequestContext(req);
    return await this.authFlow.createGuestSession(context);
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link guest to real account' })
  @ApiBody({ type: GuestUpgradeDto })
  @ApiResponse({ status: 200, description: 'Guest account upgraded successfully' })
  async upgradeGuestAccount(
    @Body() upgradeDto: GuestUpgradeDto,
    @Req() req: Request & { user: { userId: string } }
  ) {
    const context: PhantomContext = ContextEngine.getRequestContext(req);
    return await this.authFlow.upgradeGuestAccount(req.user.userId, upgradeDto.email, context);
  }

  // 4. Session Management
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user from session' })
  @ApiResponse({ status: 200, description: 'Current user information' })
  async getCurrentUser(@Req() req: Request & { user: { userId: string } }) {
    return await this.authFlow.getCurrentUser(req.user.userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate current session' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @HttpCode(200)
  async logout(
    @Req() req: Request & { user: { userId: string } },
    @Body() logoutDto: LogoutDto
  ) {
    await this.authFlow.logout(req.user.userId, logoutDto.deviceId);
    return { message: 'Logged out successfully' };
  }

  // 5. Security & Context Tools
  @Post('context-check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current context matches expected' })
  @ApiBody({ type: ContextCheckDto })
  @ApiResponse({ status: 200, description: 'Context check result' })
  async checkContext(
    @Body() contextCheckDto: ContextCheckDto,
    @Req() req: Request
  ) {
    const context: PhantomContext = ContextEngine.getRequestContext(req);
    return await this.authFlow.verifyContext(context, contextCheckDto.fingerprint);
  }

  @Post('refresh-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token using phantom session' })
  @ApiResponse({ status: 200, description: 'Session refreshed successfully' })
  async refreshSession(@Req() req: Request & { user: { userId: string } }) {
    return await this.authFlow.refreshSession(req.user.userId);
  }

  // Debug Endpoints
  @Get('debug/context')
  @ApiOperation({ summary: 'Return full context fingerprint for request' })
  @ApiResponse({ status: 200, description: 'Context information' })
  async getDebugContext(@Req() req: Request) {
    return ContextEngine.getRequestContext(req);
  }

  @Get('debug/tokens')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List issued tokens for the session' })
  @ApiResponse({ status: 200, description: 'Token information' })
  async getDebugTokens(@Req() req: Request & { user: { userId: string } }) {
    return await this.authFlow.getDebugTokens(req.user.userId);
  }
} 