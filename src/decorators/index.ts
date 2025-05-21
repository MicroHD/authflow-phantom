import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser, PhantomContext } from '../interfaces';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);

export const DeviceToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.headers['x-device-token'] as string;
  },
);

export const GetPhantomContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PhantomContext => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return {
      ip: request.ip || '0.0.0.0',
      userAgent: request.headers['user-agent'] || '',
      fingerprint: request.headers['x-device-fingerprint'] as string | undefined,
      timestamp: Date.now(),
    };
  },
); 