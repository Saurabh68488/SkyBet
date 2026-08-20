// ============================================
// Wallet Service - Atomic Balance Operations
// ============================================

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LogsService } from '../logs/logs.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return Number(wallet.balance);
  }

  async getTransactions(userId: string, options: { page?: number; limit?: number; type?: string }) {
    const { page = 1, limit = 20, type } = options;
    const skip = (page - 1) * limit;

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const where: any = { walletId: wallet.id };
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
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

  // Atomic debit - for placing bets
  async debit(userId: string, amount: number, type: string, referenceId?: string, note?: string): Promise<number> {
    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const currentBalance = Number(wallet.balance);
      if (currentBalance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const newBalance = currentBalance - amount;

      await tx.wallet.update({
        where: { userId },
        data: { balance: newBalance },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: -amount,
          type,
          status: 'COMPLETED',
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          referenceId: referenceId || null,
          note: note || null,
        },
      });

      return newBalance;
    });
  }

  // Atomic credit - for cashouts, deposits
  async credit(userId: string, amount: number, type: string, referenceId?: string, note?: string): Promise<number> {
    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const currentBalance = Number(wallet.balance);
      const newBalance = currentBalance + amount;

      await tx.wallet.update({
        where: { userId },
        data: { balance: newBalance },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: amount,
          type,
          status: 'COMPLETED',
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          referenceId: referenceId || null,
          note: note || null,
        },
      });

      return newBalance;
    });
  }

  // Admin balance adjustment
  async adjustBalance(
    userId: string,
    amount: number,
    adjustType: 'add' | 'remove',
    adminId: string,
    note?: string,
  ): Promise<number> {
    const newBalance =
      adjustType === 'add'
        ? await this.credit(userId, amount, 'MANUAL_ADJUST', undefined, note || `Admin adjustment: +${amount}`)
        : await this.debit(userId, amount, 'MANUAL_ADJUST', undefined, note || `Admin adjustment: -${amount}`);

    await this.logsService.log({
      userId: adminId,
      action: `${adjustType === 'add' ? 'Added' : 'Removed'} ${amount} ₹ for user`,
      category: 'BALANCE',
      details: { targetUserId: userId, amount, adjustType, newBalance, note },
    });

    return newBalance;
  }
}
