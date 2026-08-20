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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const logs_service_1 = require("../logs/logs.service");
let WalletService = class WalletService {
    constructor(prisma, logsService) {
        this.prisma = prisma;
        this.logsService = logsService;
    }
    async getBalance(userId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet)
            throw new common_1.NotFoundException('Wallet not found');
        return Number(wallet.balance);
    }
    async getTransactions(userId, options) {
        const { page = 1, limit = 20, type } = options;
        const skip = (page - 1) * limit;
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet)
            throw new common_1.NotFoundException('Wallet not found');
        const where = { walletId: wallet.id };
        if (type)
            where.type = type;
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
    async debit(userId, amount, type, referenceId, note) {
        return await this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { userId } });
            if (!wallet)
                throw new common_1.NotFoundException('Wallet not found');
            const currentBalance = Number(wallet.balance);
            if (currentBalance < amount) {
                throw new common_1.BadRequestException('Insufficient balance');
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
    async credit(userId, amount, type, referenceId, note) {
        return await this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { userId } });
            if (!wallet)
                throw new common_1.NotFoundException('Wallet not found');
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
    async adjustBalance(userId, amount, adjustType, adminId, note) {
        const newBalance = adjustType === 'add'
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
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logs_service_1.LogsService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map