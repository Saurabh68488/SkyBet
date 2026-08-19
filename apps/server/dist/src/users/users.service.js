"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
const logs_service_1 = require("../logs/logs.service");
let UsersService = class UsersService {
    constructor(prisma, logsService) {
        this.prisma = prisma;
        this.logsService = logsService;
    }
    async createUser(data, createdByAdminId) {
        const existing = await this.prisma.user.findUnique({
            where: { username: data.username },
        });
        if (existing) {
            throw new common_1.ConflictException('Username already exists');
        }
        const hashedPassword = await bcrypt.hash(data.password, 12);
        const role = data.role === 'ADMIN' ? 'ADMIN' : 'PLAYER';
        const user = await this.prisma.user.create({
            data: {
                username: data.username,
                password: hashedPassword,
                plainPassword: data.password,
                name: data.name,
                phone: data.phone || null,
                role,
                status: data.status || 'ACTIVE',
                wallet: {
                    create: {
                        balance: data.initialBalance || 0,
                    },
                },
            },
            include: { wallet: true },
        });
        await this.logsService.log({
            userId: createdByAdminId,
            action: `Created ${role.toLowerCase()}: ${user.username}`,
            category: 'ADMIN',
            details: { newUserId: user.id, username: user.username, role },
        });
        const { password, plainPassword, ...result } = user;
        return {
            ...result,
            wallet: user.wallet ? { balance: Number(user.wallet.balance) } : null,
        };
    }
    async findAll(options) {
        const { page = 1, limit = 20, search, status } = options;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { username: { contains: search } },
                { name: { contains: search } },
                { playerId: { contains: search } },
            ];
        }
        if (status)
            where.status = status;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: { wallet: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            users: users.map(({ password, plainPassword, ...user }) => ({
                ...user,
                plainPassword: user.role === 'PLAYER' ? plainPassword : null,
                wallet: user.wallet ? { balance: Number(user.wallet.balance) } : null,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { wallet: true },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const { password, plainPassword, ...result } = user;
        return {
            ...result,
            wallet: user.wallet ? { balance: Number(user.wallet.balance) } : null,
        };
    }
    async updateUser(id, data, adminId) {
        const user = await this.prisma.user.update({
            where: { id },
            data,
            include: { wallet: true },
        });
        await this.logsService.log({
            userId: adminId,
            action: `Updated user: ${user.username}`,
            category: 'ADMIN',
            details: { targetUserId: id, changes: data },
        });
        const { password, plainPassword, ...result } = user;
        return {
            ...result,
            wallet: user.wallet ? { balance: Number(user.wallet.balance) } : null,
        };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid)
            throw new common_1.ConflictException('Current password is incorrect');
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword, plainPassword: newPassword },
        });
        await this.logsService.log({
            userId,
            action: 'Password changed',
            category: 'AUTH',
        });
        return { message: 'Password changed successfully' };
    }
    async adminChangePassword(targetUserId, newPassword, adminId) {
        const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
        if (!target)
            throw new common_1.NotFoundException('User not found');
        if (target.role === 'ADMIN') {
            throw new common_1.ForbiddenException('Cannot change another admin\'s password');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: { id: targetUserId },
            data: { password: hashedPassword, plainPassword: newPassword },
        });
        await this.logsService.log({
            userId: adminId,
            action: `Changed password for player: ${target.username}`,
            category: 'ADMIN',
            details: { targetUserId, targetUsername: target.username },
        });
        return { message: `Password changed for ${target.username}` };
    }
    async adminGetPassword(targetUserId, adminId) {
        const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
        if (!target)
            throw new common_1.NotFoundException('User not found');
        if (target.role === 'ADMIN') {
            throw new common_1.ForbiddenException('Cannot view another admin\'s password');
        }
        await this.logsService.log({
            userId: adminId,
            action: `Viewed password for player: ${target.username}`,
            category: 'ADMIN',
            details: { targetUserId, targetUsername: target.username },
        });
        return {
            userId: target.id,
            username: target.username,
            plainPassword: target.plainPassword || '(not stored — password was set before this feature)',
        };
    }
    async toggleStatus(id, adminId) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const updated = await this.prisma.user.update({
            where: { id },
            data: { status: newStatus },
        });
        await this.logsService.log({
            userId: adminId,
            action: `${newStatus === 'ACTIVE' ? 'Activated' : 'Deactivated'} user: ${user.username}`,
            category: 'ADMIN',
            details: { targetUserId: id, newStatus },
        });
        return { id: updated.id, status: updated.status };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logs_service_1.LogsService])
], UsersService);
//# sourceMappingURL=users.service.js.map