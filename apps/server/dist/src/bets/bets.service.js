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
exports.BetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let BetsService = class BetsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserBets(userId, options) {
        const { page = 1, limit = 20, status } = options;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (status)
            where.status = status;
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
    async getRoundHistory(options) {
        const { page = 1, limit = 20, gameType = 'AVIATION' } = options;
        const skip = (page - 1) * limit;
        const where = { status: 'CRASHED', gameType };
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
};
exports.BetsService = BetsService;
exports.BetsService = BetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BetsService);
//# sourceMappingURL=bets.service.js.map