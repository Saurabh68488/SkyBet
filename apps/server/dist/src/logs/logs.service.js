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
exports.LogsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let LogsService = class LogsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(entry) {
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
        }
        catch (error) {
            console.error('Failed to write log:', error);
        }
    }
    async getLogs(options) {
        const { page = 1, limit = 20, category, userId, startDate, endDate } = options;
        const skip = (page - 1) * limit;
        const where = {};
        if (category)
            where.category = category;
        if (userId)
            where.userId = userId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
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
};
exports.LogsService = LogsService;
exports.LogsService = LogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LogsService);
//# sourceMappingURL=logs.service.js.map