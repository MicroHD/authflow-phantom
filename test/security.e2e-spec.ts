import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationError } from '../src/errors/base.error';

describe('Security Features (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CORS', () => {
    it('should allow requests from allowed origins', () => {
      return request(app.getHttpServer())
        .get('/')
        .set('Origin', 'http://localhost:3000')
        .expect('Access-Control-Allow-Origin', 'http://localhost:3000');
    });

    it('should reject requests from disallowed origins', () => {
      return request(app.getHttpServer())
        .get('/')
        .set('Origin', 'http://malicious.com')
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect('X-Content-Type-Options', 'nosniff')
        .expect('X-Frame-Options', 'DENY')
        .expect('X-XSS-Protection', '1; mode=block');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const requests = Array(10).fill(null).map(() => 
        request(app.getHttpServer()).get('/')
      );
      
      const responses = await Promise.all(requests);
      responses.forEach(res => {
        expect(res.status).not.toBe(429);
      });
    });

    it('should reject requests exceeding rate limit', async () => {
      const requests = Array(150).fill(null).map(() => 
        request(app.getHttpServer()).get('/')
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(res => res.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    it('should validate request body and return ValidationError', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short',
        })
        .expect(400)
        .expect((res) => {
          const error = new ValidationError('Validation failed', {
            errors: [
              {
                property: 'email',
                constraints: { isEmail: 'email must be an email' },
                value: 'invalid-email'
              },
              {
                property: 'password',
                constraints: { minLength: 'password must be longer than or equal to 8 characters' },
                value: 'short'
              }
            ]
          });
          expect(res.body.error).toBe(error.code);
          expect(res.body.statusCode).toBe(error.statusCode);
          expect(res.body.details.errors).toHaveLength(2);
          expect(res.body.details.errors[0].property).toBe('email');
          expect(res.body.details.errors[1].property).toBe('password');
        });
    });
  });
}); 