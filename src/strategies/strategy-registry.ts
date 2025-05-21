import { Injectable } from '@nestjs/common';
import { AuthStrategy } from './base.strategy';
import { DeviceMemoryStrategy } from './device-memory.strategy';
import { EmailStrategy } from './email.strategy';

@Injectable()
export class StrategyRegistry {
  private strategies = new Map<string, AuthStrategy>();

  constructor(
    private readonly deviceMemoryStrategy: DeviceMemoryStrategy,
    private readonly emailStrategy: EmailStrategy,
  ) {
    this.registerStrategy(this.deviceMemoryStrategy);
    this.registerStrategy(this.emailStrategy);
  }

  registerStrategy(strategy: AuthStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  getStrategy(name: string): AuthStrategy {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Strategy '${name}' not found`);
    }
    return strategy;
  }

  getStrategies(): AuthStrategy[] {
    return Array.from(this.strategies.values());
  }

  hasStrategy(name: string): boolean {
    return this.strategies.has(name);
  }
} 