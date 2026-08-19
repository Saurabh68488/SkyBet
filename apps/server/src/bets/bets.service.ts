// ============================================
// Bets Service - History & Statistics
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BetsService {
  constructor(private prisma: PrismaService) {}

  async getUserBets(userId: string, options: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) where.status = status;

    const [bets, total] = await Promise.all([
      this.prisma.bet.findMany({
        where,
        include: {
          round: {
            select: { roundNumber: true, crashPoint: true, gameType: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bet.count({ where }),
    ]);

    return {
      bets: bets.map((b) => ({
        ...b,
        amount: Number(b.amount),
        autoCashout: b.autoCashout ? Number(b.autoCashout) : null,
        cashoutAt: b.cashoutAt ? Number(b.cashoutAt) : null,
        winAmount: b.winAmount ? Number(b.winAmount) : null,
        commission: Number(b.commission),
        round: b.round
          ? { ...b.round, crashPoint: Number(b.round.crashPoint) }
          : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRoundHistory(options: { page?: number; limit?: number; gameType?: string }) {
    const { page = 1, limit = 20, gameType = 'AVIATION' } = options;
    const skip = (page - 1) * limit;

    const where: any = { status: 'CRASHED', gameType };

    const [rounds, total] = await Promise.all([
      this.prisma.gameRound.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.gameRound.count({ where }),
    ]);

    return {
      rounds: rounds.map((r) => ({
        ...r,
        crashPoint: Number(r.crashPoint),
        totalBets: Number(r.totalBets),
        totalPayouts: Number(r.totalPayouts),
        commission: Number(r.commission),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
