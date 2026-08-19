// ============================================
// Logs Service - Audit Trail
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface LogEntry {
  userId?: string;
  action: string;
  category: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) { }

  async log(entry: LogEntry) {
    try {
      await this.prisma.log.create({
        data: {
          userId: entry.userId || null,
          action: entry.action,
          category: entry.category,
          details: entry.details ? JSON.stringify(entry.details) : null,
          ip: entry.ip || null,
          userAgent: entry.userAgent || null,
        },
      });
    } catch (error) {
      // Logging should never crash the app
      console.error('Failed to write log:', error);
    }
  }

  async getLogs(options: {
    page?: number;
    limit?: number;
    category?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, category, userId, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category) where.category = category;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.log.findMany({
        where,
        include: {
          user: { select: { username: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.log.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
