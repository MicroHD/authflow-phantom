export interface AuthFlowOptions {
  strategies: string[];
  dbAdapter?: 'prisma' | 'typeorm' | 'mongoose';
  phantomLinkExpiry?: number; // in seconds
  deviceMemoryExpiry?: number; // in seconds
  enableWebAuthn?: boolean;
  enableRateLimit?: boolean;
  enableAuditLogs?: boolean;
} 