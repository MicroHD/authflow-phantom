import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class DatabaseService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err: Error) => console.error('Redis Client Error', err));
    this.client.connect();
  }

  async set(key: string, value: any, options?: { ttl?: number }): Promise<void> {
    const serialized = JSON.stringify(value);
    if (options?.ttl) {
      await this.client.set(key, serialized, { EX: options.ttl });
    } else {
      await this.client.set(key, serialized);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async setWithExpiry(key: string, value: any, expirySeconds: number): Promise<void> {
    await this.set(key, value, { ttl: expirySeconds });
  }

  async increment(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async decrement(key: string): Promise<number> {
    return await this.client.decr(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }
} 