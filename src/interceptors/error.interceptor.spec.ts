import { Test } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { throwError } from 'rxjs';
import { ErrorInterceptor } from './error.interceptor';
import { AuthFlowError } from '../errors/base.error';
import { describe, expect, it, beforeEach } from '@jest/globals';

describe('ErrorInterceptor', () => {
  let interceptor: ErrorInterceptor;
  let mockContext: ExecutionContext;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ErrorInterceptor],
    }).compile();

    interceptor = moduleRef.get<ErrorInterceptor>(ErrorInterceptor);
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    } as ExecutionContext;
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should transform AuthFlowError to HttpException', (done) => {
    const error = new AuthFlowError('Test error', 'AUTH_FLOW_ERROR', 400);
    const handler = {
      handle: () => throwError(() => error),
    };

    interceptor.intercept(mockContext, handler).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(400);
        expect(err.getResponse()).toEqual({
          statusCode: 400,
          error: 'AUTH_FLOW_ERROR',
          message: 'Test error',
          details: undefined,
        });
        done();
      },
    });
  });

  it('should pass through HttpException', (done) => {
    const error = new HttpException('Test error', HttpStatus.BAD_REQUEST);
    const handler = {
      handle: () => throwError(() => error),
    };

    interceptor.intercept(mockContext, handler).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });

  it('should transform unknown errors to InternalServerError', (done) => {
    const error = new Error('Unknown error');
    const handler = {
      handle: () => throwError(() => error),
    };

    interceptor.intercept(mockContext, handler).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(err.getResponse()).toEqual({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        });
        done();
      },
    });
  });
}); 