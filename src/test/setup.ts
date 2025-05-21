import 'reflect-metadata';
import { jest } from '@jest/globals';
import { Transporter } from 'nodemailer';

// Mock environment variables
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://test.com';

// Global test timeout
jest.setTimeout(10000);

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn(),
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  }),
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockImplementation(() => Promise.resolve({ messageId: 'test-id' })),
  } as unknown as Transporter),
})); 