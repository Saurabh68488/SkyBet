"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const logs_service_1 = require("../logs/logs.service");
const wallet_service_1 = require("../wallet/wallet.service");
let PaymentsService = class PaymentsService {
    constructor(prisma, logsService, walletService) {
        this.prisma = prisma;
        this.logsService = logsService;
        this.walletService = walletService;
    }
    async createDeposit(userId, amount, playerTxnId) {
        if (amount < 1)
            throw new common_1.BadRequestException('Minimum deposit is ₹1');
        if (amount > 100000)
            throw new common_1.BadRequestException('Maximum deposit is ₹1,00,000');
        if (!playerTxnId || playerTxnId.trim().length < 3) {
            throw new common_1.BadRequestException('Please enter a valid transaction ID');
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
    async createWithdraw(userId, amount, upiId) {
        if (amount < 100)
            throw new common_1.BadRequestException('Minimum withdrawal is ₹100');
        if (!upiId || !upiId.includes('@')) {
            throw new common_1.BadRequestException('Please enter a valid UPI ID (e.g. name@upi)');
        }
        const balance = await this.walletService.getBalance(userId);
        if (balance < amount) {
            throw new common_1.BadRequestException(`Insufficient balance. You have ${balance} coins.`);
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
    async getMyRequests(userId, page = 1, type) {
        const limit = 15;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (type)
            where.type = type;
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
    async getAllRequests(page = 1, status, type) {
        const limit = 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (type)
            where.type = type;
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
    async approveRequest(requestId, adminId, adminTxnId) {
        const request = await this.prisma.paymentRequest.findUnique({ where: { id: requestId } });
        if (!request)
            throw new common_1.NotFoundException('Payment request not found');
        if (request.status !== 'PENDING')
            throw new common_1.BadRequestException('Request already processed');
        if (request.type === 'WITHDRAW' && (!adminTxnId || adminTxnId.trim().length < 3)) {
            throw new common_1.BadRequestException('Please enter the transaction ID for withdrawal payment');
        }
        if (request.type === 'DEPOSIT') {
            await this.walletService.credit(request.userId, Number(request.amount), 'DEPOSIT', requestId, `Deposit approved (Player Txn: ${request.playerTxnId})`);
        }
        else if (request.type === 'WITHDRAW') {
            await this.walletService.debit(request.userId, Number(request.amount), 'WITHDRAWAL', requestId, `Withdrawal approved (Admin Txn: ${adminTxnId})`);
        }
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
    async rejectRequest(requestId, adminId, reason) {
        const request = await this.prisma.paymentRequest.findUnique({ where: { id: requestId } });
        if (!request)
            throw new common_1.NotFoundException('Payment request not found');
        if (request.status !== 'PENDING')
            throw new common_1.BadRequestException('Request already processed');
        if (!reason || reason.trim().length < 3) {
            throw new common_1.BadRequestException('Please provide a reason for rejection');
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
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logs_service_1.LogsService,
        wallet_service_1.WalletService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map