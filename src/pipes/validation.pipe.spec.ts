import { Test } from '@nestjs/testing';
import { CustomValidationPipe } from './validation.pipe';
import { AuthFlowError } from '../errors/base.error';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { IsEmail, IsString, MinLength } from 'class-validator';

class TestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

describe('CustomValidationPipe', () => {
  let pipe: CustomValidationPipe;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CustomValidationPipe],
    }).compile();

    pipe = moduleRef.get<CustomValidationPipe>(CustomValidationPipe);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should validate and transform valid data', async () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
    };

    const result = await pipe.transform(data, { metatype: TestDto, type: 'body', data: '' });
    expect(result).toBeInstanceOf(TestDto);
    expect(result).toEqual(data);
  });

  it('should throw AuthFlowError for invalid data', async () => {
    const data = {
      email: 'invalid-email',
      password: 'short',
    };

    await expect(pipe.transform(data, { metatype: TestDto, type: 'body', data: '' }))
      .rejects
      .toThrow(AuthFlowError);
  });

  it('should return value if no metatype is provided', async () => {
    const data = { someField: 'value' };
    const result = await pipe.transform(data, { metatype: undefined, type: 'body', data: '' });
    expect(result).toEqual(data);
  });

  it('should return value for primitive types', async () => {
    const data = 'test string';
    const result = await pipe.transform(data, { metatype: String, type: 'body', data: '' });
    expect(result).toEqual(data);
  });
}); 