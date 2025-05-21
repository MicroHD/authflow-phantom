import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthFlowError } from '../errors/authflow.errors';
import { User } from '../interfaces';

export type UserUpdateInput = {
  email?: string | null;
  phone?: string | null;
  isAnonymous?: boolean;
  lastLoginAt?: Date;
  metadata?: any;
};

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        include: {
          devices: true,
          sessions: true,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new AuthFlowError(`Failed to find user: ${errorMessage}`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
        include: {
          devices: true,
          sessions: true,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new AuthFlowError(`Failed to find user: ${errorMessage}`);
    }
  }

  async create(email?: string): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: {
          email: email || null,
          isAnonymous: !email,
          lastLoginAt: new Date(),
        },
        include: {
          devices: true,
          sessions: true,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new AuthFlowError(`Failed to create user: ${errorMessage}`);
    }
  }

  async update(id: string, data: UserUpdateInput): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          devices: true,
          sessions: true,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new AuthFlowError(`Failed to update user: ${errorMessage}`);
    }
  }

  async delete(email: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { email },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new AuthFlowError(`Failed to delete user: ${errorMessage}`);
    }
  }
} 