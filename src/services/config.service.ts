import { Injectable, Inject } from '@nestjs/common';
import { AuthFlowConfig } from '../interfaces/config.interface';

@Injectable()
export class ConfigService {
  constructor(
    @Inject('AUTHFLOW_CONFIG')
    private readonly config: AuthFlowConfig,
  ) {}

  get database() {
    return this.config.database;
  }

  get redis() {
    return this.config.redis;
  }

  get email() {
    return this.config.email;
  }

  get jwt() {
    return this.config.jwt;
  }

  get webauthn() {
    return this.config.webauthn;
  }
} 