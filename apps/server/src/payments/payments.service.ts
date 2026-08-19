// ============================================
// Payments Service — Deposit & Withdrawal
// ============================================

import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LogsService } from '../logs/logs.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
    private walletService: WalletService,
  ) {}

  // ─── PLAYER: Create Deposit Request ────────────
  async createDeposit(userId: string, amount: number, playerTxnId: string) {
    if (amount < 1) throw new BadRequestException('Minimum deposit is ₹1');
    if (amount > 100000) throw new BadRequestException('Maximum deposit is ₹1,00,000');
    if (!playerTxnId || playerTxnId.trim().length < 3) {
      throw new BadRequestException('Please enter a valid transaction ID');
    }

    const request = await this.prisma.paymentRequest.create({
      data: {
        userId,
        type: 'DEPOSIT',
        amount,
        playerTxnId: playerTxnId.trim(),
        status: 'PENDING',
      },
    });

    await this.logsService.log({
      userId,
      action: `Deposit request: ₹${amount} (Txn: ${playerTxnId})`,
      category: 'BALANCE',
      details: { requestId: request.id, amount, playerTxnId },
    });

    return { id: request.id, message: 'Deposit request submitted. Your coins will be added within 48 hours after verification.' };
  }

  // ─── PLAYER: Create Withdrawal Request ─────────
  async createWithdraw(userId: string, amount: number, upiId: string) {
    if (amount < 100) throw new BadRequestException('Minimum withdrawal is ₹100');
    if (!upiId || !upiId.includes('@')) {
      throw new BadRequestException('Please enter a valid UPI ID (e.g. name@upi)');
    }

    // Check balance
    const balance = await this.walletService.getBalance(userId);
    if (balance < amount) {
      throw new BadRequestException(`Insufficient balance. You have ${balance} coins.`);
    }

    const request = await this.prisma.paymentRequest.create({
      data: {
        userId,
        type: 'WITHDRAW',
        amount,
        upiId: upiId.trim(),
        status: 'PENDING',
      },
    });

    await this.logsService.log({
      userId,
      action: `Withdrawal request: ₹${amount} (UPI: ${upiId})`,
      category: 'BALANCE',
      details: { requestId: request.id, amount, upiId },
    });

    return { id: request.id, message: 'Withdrawal request submitted. Money will be credited to your account within 48 hours.' };
  }

  // ─── PLAYER: My Payment History ────────────────
  async getMyRequests(userId: string, page: number = 1, type?: string) {
    const limit = 15;
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (type) where.type = type;

    const [requests, total] = await Promise.all([
      this.prisma.paymentRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.paymentRequest.count({ where }),
    ]);

    return {
      requests: requests.map((r) => ({
        id: r.id,
        type: r.type,
        amount: Number(r.amount),
        status: r.status,
        playerTxnId: r.playerTxnId,
        upiId: r.upiId,
        adminTxnId: r.adminTxnId,
        adminNote: r.adminNote,
        processedAt: r.processedAt,
        createdAt: r.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── ADMIN: Get All Payment Requests ───────────
  async getAllRequests(page: number = 1, status?: string, type?: string) {
    const limit = 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [requests, total] = await Promise.all([
      this.prisma.paymentRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, name: true, playerId: true } },
        },
      }),
      this.prisma.paymentRequest.count({ where }),
    ]);

    return {
      requests: requests.map((r) => ({
        id: r.id,
        type: r.type,
        amount: Number(r.amount),
        status: r.status,
        playerTxnId: r.playerTxnId,
        upiId: r.upiId,
        adminTxnId: r.adminTxnId,
        adminNote: r.adminNote,
        processedBy: r.processedBy,
        processedAt: r.processedAt,
        createdAt: r.createdAt,
        user: r.user,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── ADMIN: Payment Stats ─────────────────────
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, todayApproved, todayRejected, totalDeposits, totalWithdrawals] = await Promise.all([
      this.prisma.paymentRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.paymentRequest.count({ where: { status: 'APPROVED', processedAt: { gte: today } } }),
      this.prisma.paymentRequest.count({ where: { status: 'REJECTED', processedAt: { gte: today } } }),
      this.prisma.paymentRequest.aggregate({
        _sum: { amount: true },
        where: { type: 'DEPOSIT', status: 'APPROVED' },
      }),
      this.prisma.paymentRequest.aggregate({
        _sum: { amount: true },
        where: { type: 'WITHDRAW', status: 'APPROVED' },
      }),
    ]);

    return {
      pending,
      todayApproved,
      todayRejected,
      totalDeposits: Number(totalDeposits._sum.amount || 0),
      totalWithdrawals: Number(totalWithdrawals._sum.amount || 0),
    };
  }

  // ─── ADMIN: Approve Request ───────────────────
  async approveRequest(requestId: string, adminId: string, adminTxnId?: string) {
    const request = await this.prisma.paymentRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Payment request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('Request already processed');

    if (request.type === 'WITHDRAW' && (!adminTxnId || adminTxnId.trim().length < 3)) {
      throw new BadRequestException('Please enter the transaction ID for withdrawal payment');
    }

    // Process based on type
    if (request.type === 'DEPOSIT') {
      // Add coins to player wallet
      await this.walletService.credit(
        request.userId,
        Number(request.amount),
        'DEPOSIT',
        requestId,
        `Deposit approved (Player Txn: ${request.playerTxnId})`,
      );
    } else if (request.type === 'WITHDRAW') {
      // Deduct coins from player wallet
      await this.walletService.debit(
        request.userId,
        Number(request.amount),
        'WITHDRAWAL',
        requestId,
        `Withdrawal approved (Admin Txn: ${adminTxnId})`,
      );
    }

    // Update request status
    await this.prisma.paymentRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        adminTxnId: adminTxnId?.trim() || null,
        processedBy: adminId,
        processedAt: new Date(),
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: request.userId } });
    await this.logsService.log({
      userId: adminId,
      action: `Approved ${request.type.toLowerCase()} of ₹${request.amount} for ${user?.username}`,
      category: 'ADMIN',
      details: { requestId, type: request.type, amount: Number(request.amount), adminTxnId },
    });

    return { message: `${request.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} approved successfully` };
  }

  // ─── ADMIN: Reject Request ────────────────────
  async rejectRequest(requestId: string, adminId: string, reason: string) {
    const request = await this.prisma.paymentRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Payment request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('Request already processed');
    if (!reason || reason.trim().length < 3) {
      throw new BadRequestException('Please provide a reason for rejection');
    }

    await this.prisma.paymentRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        adminNote: reason.trim(),
        processedBy: adminId,
        processedAt: new Date(),
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: request.userId } });
    await this.logsService.log({
      userId: adminId,
      action: `Rejected ${request.type.toLowerCase()} of ₹${request.amount} for ${user?.username}: ${reason}`,
      category: 'ADMIN',
      details: { requestId, type: request.type, amount: Number(request.amount), reason },
    });

    return { message: `Request rejected` };
  }
}
