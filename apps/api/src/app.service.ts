import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@repo/database';

@Injectable()
export class AppService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getHealth() {
    let dbStatus = 'disconnected';
    try {
      await this.prisma.$connect();
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error: ' + (error instanceof Error ? error.message : 'unknown');
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    };
  }
}
