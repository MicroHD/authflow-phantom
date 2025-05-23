import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class ApiKeyService {
  private readonly prefix = 'pk_';
  private readonly keyLength = 32;

  generateApiKey(): { apiKey: string; projectId: string } {
    const apiKey = randomBytes(32).toString('hex');
    const projectId = randomBytes(16).toString('hex');
    return { apiKey, projectId };
  }

  validateApiKey(apiKey: string): boolean {
    if (!apiKey.startsWith(this.prefix)) {
      return false;
    }

    const parts = apiKey.split('_');
    if (parts.length !== 3) {
      return false;
    }

    const [, projectId, secret] = parts;
    return projectId.length === 16 && secret.length === this.keyLength * 2;
  }

  getProjectIdFromApiKey(apiKey: string): string | null {
    if (!this.validateApiKey(apiKey)) {
      return null;
    }
    return apiKey.split('_')[1];
  }
} 