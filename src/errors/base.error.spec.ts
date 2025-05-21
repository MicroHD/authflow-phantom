import { describe, expect, it } from '@jest/globals';
import {
  AuthFlowError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
} from './base.error';

describe('Error Classes', () => {
  describe('AuthFlowError', () => {
    it('should create with default status code', () => {
      const error = new AuthFlowError('Test error', 'TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error');
    });

    it('should create with custom status code', () => {
      const error = new AuthFlowError('Test error', 'TEST_ERROR', 418);
      expect(error.statusCode).toBe(418);
    });

    it('should include details in JSON', () => {
      const details = { field: 'test' };
      const error = new AuthFlowError('Test error', 'TEST_ERROR', 500, details);
      expect(error.toJSON()).toEqual({
        name: 'AuthFlowError',
        message: 'Test error',
        code: 'TEST_ERROR',
        statusCode: 500,
        details,
      });
    });
  });

  describe('ValidationError', () => {
    it('should have correct status code and code', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('AuthenticationError', () => {
    it('should have correct status code and code', () => {
      const error = new AuthenticationError('Invalid credentials');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('AuthorizationError', () => {
    it('should have correct status code and code', () => {
      const error = new AuthorizationError('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
    });
  });

  describe('NotFoundError', () => {
    it('should have correct status code and code', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND_ERROR');
    });
  });

  describe('ConflictError', () => {
    it('should have correct status code and code', () => {
      const error = new ConflictError('Resource conflict');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT_ERROR');
    });
  });

  describe('RateLimitError', () => {
    it('should have correct status code and code', () => {
      const error = new RateLimitError('Too many requests');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_ERROR');
    });
  });

  describe('InternalServerError', () => {
    it('should have correct status code and code', () => {
      const error = new InternalServerError('Server error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });
}); 