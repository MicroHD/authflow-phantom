import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthFlowService } from '../services';
import { RequestWithUser, PhantomContext } from '../interfaces';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authFlow: AuthFlowService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No session token provided');
    }

    try {
      const { userId, email } = await this.authFlow.validateSession(token);
      request.user = { userId, email };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid session token');
    }
  }

  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

@Injectable()
export class DeviceGuard implements CanActivate {
  constructor(private readonly authFlow: AuthFlowService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const deviceToken = request.headers['x-device-token'] as string;
    
    if (!deviceToken) {
      throw new UnauthorizedException('No device token provided');
    }

    const phantomContext: PhantomContext = {
      ip: request.ip || '0.0.0.0',
      userAgent: request.headers['user-agent'] || '',
      fingerprint: request.headers['x-device-fingerprint'] as string | undefined,
      timestamp: Date.now(),
    };

    try {
      const { sessionToken } = await this.authFlow.validateDeviceLogin(
        deviceToken,
        phantomContext
      );
      request.headers.authorization = `Bearer ${sessionToken}`;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid device token');
    }
  }
} 