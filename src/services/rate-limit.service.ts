import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

interface RateLimitConfig {
  points: number;
  duration: number;
  blockDuration: number;
}

@Injectable()
export class RateLimitService {
  private readonly defaultConfig: RateLimitConfig = {
    points: 5,
    duration: 60,
    blockDuration: 300,
  };

  constructor(private readonly db: DatabaseService) {}

  async checkRateLimit(
    key: string,
    config: Partial<RateLimitConfig> = {},
  ): Promise<{ allowed: boolean; remaining: number; reset: number }> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / (finalConfig.duration * 1000))}`;
    const blockKey = `ratelimit:block:${key}`;

    // Check if blocked
    const isBlocked = await this.db.exists(blockKey);
    if (isBlocked) {
      return {
        allowed: false,
        remaining: 0,
        reset: await this.getBlockResetTime(blockKey),
      };
    }

    // Get current count
    const count = await this.db.increment(windowKey);
    if (count === 1) {
      await this.db.setWithExpiry(windowKey, count, finalConfig.duration);
    }

    // Check if limit exceeded
    if (count > finalConfig.points) {
      await this.db.setWithExpiry(blockKey, true, finalConfig.blockDuration);
      return {
        allowed: false,
        remaining: 0,
        reset: now + finalConfig.blockDuration * 1000,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, finalConfig.points - count),
      reset: now + finalConfig.duration * 1000,
    };
  }

  private async getBlockResetTime(blockKey: string): Promise<number> {
    const ttl = await this.db.ttl(blockKey);
    return Date.now() + ttl * 1000;
  }
} 