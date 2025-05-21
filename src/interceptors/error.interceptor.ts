import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthFlowError } from '../errors/base.error';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        if (error instanceof AuthFlowError) {
          throw new HttpException(
            {
              statusCode: error.statusCode,
              error: error.code,
              message: error.message,
              details: error.details,
            },
            error.statusCode,
          );
        }

        if (error instanceof HttpException) {
          throw error;
        }

        // Handle unknown errors
        console.error('Unhandled error:', error);
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }),
    );
  }
} 