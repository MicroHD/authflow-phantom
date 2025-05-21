import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthFlowService } from '../services/authflow.service';
import { AuthUser } from '../interfaces/auth-user.interface';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: AuthUser;
}

@Injectable()
export class AuthFlowGuard implements CanActivate {
  constructor(private readonly authFlowService: AuthFlowService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      return false;
    }

    try {
      const { userId, email } = await this.authFlowService.validateSession(token);
      request.user = { id: userId, email, isAnonymous: false, createdAt: new Date(), lastLoginAt: new Date() };
      return true;
    } catch {
      return false;
    }
  }

  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 