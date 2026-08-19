// ============================================
// Admin Service - Dashboard & Statistics
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      todayBets,
      todayRounds,
      pendingForcedRounds,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.bet.findMany({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.gameRound.findMany({
        where: { createdAt: { gte: today }, status: 'CRASHED' },
      }),
      this.prisma.forcedRound.count({ where: { executed: false } }),
    ]);

    let todayBetAmount = 0;
    let todayWins = 0;
    let todayWinAmount = 0;
    let todayLosses = 0;
    let todayCommission = 0;

    todayBets.forEach((bet) => {
      todayBetAmount += Number(bet.amount);
      todayCommission += Number(bet.commission);
      if (bet.status === 'WON') {
        todayWins++;
        todayWinAmount += Number(bet.winAmount || 0);
      } else if (bet.status === 'LOST') {
        todayLosses++;
      }
    });

    return {
      totalUsers,
      activeUsers,
      todayBets: todayBets.length,
      todayBetAmount: Math.round(todayBetAmount * 100) / 100,
      todayWins,
      todayWinAmount: Math.round(todayWinAmount * 100) / 100,
      todayLosses,
      todayCommission: Math.round(todayCommission * 100) / 100,
      pendingForcedRounds,
      todayRounds: todayRounds.length,
    };
  }

  async getRecentTransactions(limit: number = 10) {
    const transactions = await this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        wallet: {
          include: {
            user: { select: { username: true, name: true } },
          },
        },
      },
    });

    return transactions.map((t) => ({
      id: t.id,
      username: t.wallet?.user?.username || 'Unknown',
      name: t.wallet?.user?.name || 'Unknown',
      amount: Number(t.amount),
      type: t.type,
      status: t.status,
      balanceBefore: Number(t.balanceBefore),
      balanceAfter: Number(t.balanceAfter),
      note: t.note,
      createdAt: t.createdAt,
    }));
  }

  async getUserTransactions(userId: string, page: number = 1, limit: number = 20) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return { transactions: [], total: 0, page, totalPages: 0 };

    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { walletId: wallet.id } }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── COMMISSION WALLET ──────────────────────────

  async getCommissionSummary() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Get commission aggregates from game rounds
    const [allTime, today, thisWeek, thisMonth] = await Promise.all([
      this.prisma.gameRound.aggregate({
        _sum: { commission: true, totalBets: true, totalPayouts: true },
        _count: true,
        where: { status: 'CRASHED' },
      }),
      this.prisma.gameRound.aggregate({
        _sum: { commission: true, totalBets: true, totalPayouts: true },
        _count: true,
        where: { status: 'CRASHED', createdAt: { gte: todayStart } },
      }),
      this.prisma.gameRound.aggregate({
        _sum: { commission: true, totalBets: true, totalPayouts: true },
        _count: true,
        where: { status: 'CRASHED', createdAt: { gte: weekStart } },
      }),
      this.prisma.gameRound.aggregate({
        _sum: { commission: true, totalBets: true, totalPayouts: true },
        _count: true,
        where: { status: 'CRASHED', createdAt: { gte: monthStart } },
      }),
    ]);

    return {
      allTime: {
        commission: Number(allTime._sum.commission || 0),
        totalBets: Number(allTime._sum.totalBets || 0),
        totalPayouts: Number(allTime._sum.totalPayouts || 0),
        rounds: allTime._count,
      },
      today: {
        commission: Number(today._sum.commission || 0),
        totalBets: Number(today._sum.totalBets || 0),
        totalPayouts: Number(today._sum.totalPayouts || 0),
        rounds: today._count,
      },
      thisWeek: {
        commission: Number(thisWeek._sum.commission || 0),
        totalBets: Number(thisWeek._sum.totalBets || 0),
        totalPayouts: Number(thisWeek._sum.totalPayouts || 0),
        rounds: thisWeek._count,
      },
      thisMonth: {
        commission: Number(thisMonth._sum.commission || 0),
        totalBets: Number(thisMonth._sum.totalBets || 0),
        totalPayouts: Number(thisMonth._sum.totalPayouts || 0),
        rounds: thisMonth._count,
      },
    };
  }

  async getCommissionHistory(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [rounds, total] = await Promise.all([
      this.prisma.gameRound.findMany({
        where: { status: 'CRASHED', commission: { gt: 0 } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          bets: {
            select: {
              id: true,
              amount: true,
              commission: true,
              status: true,
              cashoutAt: true,
              winAmount: true,
              user: { select: { username: true } },
            },
          },
        },
      }),
      this.prisma.gameRound.count({
        where: { status: 'CRASHED', commission: { gt: 0 } },
      }),
    ]);

    return {
      rounds: rounds.map((r) => ({
        id: r.id,
        roundNumber: r.roundNumber,
        crashPoint: Number(r.crashPoint),
        totalBets: Number(r.totalBets || 0),
        totalPayouts: Number(r.totalPayouts || 0),
        commission: Number(r.commission || 0),
        createdAt: r.createdAt,
        bets: r.bets.map((b) => ({
          id: b.id,
          username: b.user?.username || 'Unknown',
          amount: Number(b.amount),
          commission: Number(b.commission || 0),
          status: b.status,
          cashoutAt: b.cashoutAt ? Number(b.cashoutAt) : null,
          winAmount: b.winAmount ? Number(b.winAmount) : null,
        })),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
