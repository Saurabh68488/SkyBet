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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const admin_service_1 = require("./admin.service");
const users_service_1 = require("../users/users.service");
const wallet_service_1 = require("../wallet/wallet.service");
const game_engine_service_1 = require("../game-engine/game-engine.service");
const jetx_engine_service_1 = require("../jetx-engine/jetx-engine.service");
const logs_service_1 = require("../logs/logs.service");
const prisma_service_1 = require("../prisma.service");
let AdminController = class AdminController {
    constructor(adminService, usersService, walletService, gameEngine, jetxEngine, logsService, prisma) {
        this.adminService = adminService;
        this.usersService = usersService;
        this.walletService = walletService;
        this.gameEngine = gameEngine;
        this.jetxEngine = jetxEngine;
        this.logsService = logsService;
        this.prisma = prisma;
    }
    async getDashboard() {
        const stats = await this.adminService.getDashboardStats();
        const gameState = this.gameEngine.getGameState();
        return {
            ...stats,
            currentRound: gameState.roundNumber,
            gamePhase: gameState.phase,
            onlineUsers: 0,
        };
    }
    async getRecentTransactions(limit) {
        return this.adminService.getRecentTransactions(limit ? parseInt(limit) : 10);
    }
    async getUsers(page, limit, search, status) {
        return this.usersService.findAll({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            search,
            status,
        });
    }
    async createUser(body, req) {
        return this.usersService.createUser(body, req.user.id);
    }
    async updateUser(id, body, req) {
        return this.usersService.updateUser(id, body, req.user.id);
    }
    async toggleUserStatus(id, req) {
        return this.usersService.toggleStatus(id, req.user.id);
    }
    async getPlayerPassword(id, req) {
        return this.usersService.adminGetPassword(id, req.user.id);
    }
    async changePlayerPassword(id, body, req) {
        return this.usersService.adminChangePassword(id, body.password, req.user.id);
    }
    async adjustBalance(userId, body, req) {
        const newBalance = await this.walletService.adjustBalance(userId, body.amount, body.type, req.user.id, body.note);
        return { balance: newBalance, message: `Balance ${body.type === 'add' ? 'added' : 'removed'} successfully` };
    }
    async getUserTransactions(userId, page, limit) {
        return this.adminService.getUserTransactions(userId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
    }
    async forceRound(body, req) {
        return this.gameEngine.forceRound(body.roundNumber, body.crashPoint, req.user.id);
    }
    async getForcedRounds() {
        const rounds = await this.gameEngine.getForcedRounds();
        return rounds.map((r) => ({
            ...r,
            crashPoint: Number(r.crashPoint),
        }));
    }
    async deleteForcedRound(id, req) {
        return this.gameEngine.deleteForcedRound(id, req.user.id);
    }
    async jetxForceRound(body, req) {
        return this.jetxEngine.forceRound(body.roundNumber, body.crashPoint, req.user.id);
    }
    async jetxGetForcedRounds() {
        const rounds = await this.jetxEngine.getForcedRounds();
        return rounds.map((r) => ({ ...r, crashPoint: Number(r.crashPoint) }));
    }
    async jetxDeleteForcedRound(id, req) {
        return this.jetxEngine.deleteForcedRound(id, req.user.id);
    }
    async getLogs(page, limit, category, userId, startDate, endDate) {
        return this.logsService.getLogs({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            category,
            userId,
            startDate,
            endDate,
        });
    }
    async getCommissionSummary() {
        return this.adminService.getCommissionSummary();
    }
    async getCommissionHistory(page, limit) {
        return this.adminService.getCommissionHistory(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
    }
    async getGameConfig(gameType) {
        const config = await this.prisma.gameConfig.findUnique({ where: { gameType: gameType.toUpperCase() } });
        if (!config)
            return { error: 'Game config not found' };
        return {
            gameType: config.gameType,
            name: config.name,
            minMultiplier: Number(config.minMultiplier),
            maxMultiplier: Number(config.maxMultiplier),
            minBet: Number(config.minBet),
            maxBet: Number(config.maxBet),
            enabled: config.enabled,
        };
    }
    async getAllGameConfigs() {
        const configs = await this.prisma.gameConfig.findMany();
        return configs.map(c => ({
            gameType: c.gameType,
            name: c.name,
            minMultiplier: Number(c.minMultiplier),
            maxMultiplier: Number(c.maxMultiplier),
            minBet: Number(c.minBet),
            maxBet: Number(c.maxBet),
            enabled: c.enabled,
        }));
    }
    async setMultiplierRange(gameType, body) {
        const gt = gameType.toUpperCase();
        if (body.minMultiplier < 1)
            return { error: 'Min multiplier must be >= 1.00' };
        if (body.maxMultiplier < body.minMultiplier)
            return { error: 'Max must be >= min' };
        if (body.maxMultiplier > 10000)
            return { error: 'Max multiplier cannot exceed 10000' };
        const config = await this.prisma.gameConfig.update({
            where: { gameType: gt },
            data: {
                minMultiplier: body.minMultiplier,
                maxMultiplier: body.maxMultiplier,
            },
        });
        return {
            success: true,
            gameType: gt,
            minMultiplier: Number(config.minMultiplier),
            maxMultiplier: Number(config.maxMultiplier),
        };
    }
    async toggleGame(gameType, body) {
        const gt = gameType.toUpperCase();
        const config = await this.prisma.gameConfig.update({
            where: { gameType: gt },
            data: { enabled: body.enabled },
        });
        await this.logsService.log({
            userId: 'admin',
            action: `${body.enabled ? 'Enabled' : 'Disabled'} game: ${gt}`,
            category: 'ADMIN',
            details: { gameType: gt, enabled: body.enabled },
        });
        return {
            success: true,
            gameType: gt,
            enabled: config.enabled,
        };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('transactions/recent'),
    (0, swagger_1.ApiOperation)({ summary: 'Get recent transactions' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRecentTransactions", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'List all users' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new user' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Put)('users/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle user active/inactive' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "toggleUserStatus", null);
__decorate([
    (0, common_1.Get)('users/:id/password'),
    (0, swagger_1.ApiOperation)({ summary: 'View player password (players only, not admins)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPlayerPassword", null);
__decorate([
    (0, common_1.Put)('users/:id/password'),
    (0, swagger_1.ApiOperation)({ summary: 'Change player password (players only, not admins)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "changePlayerPassword", null);
__decorate([
    (0, common_1.Post)('wallet/:userId/adjust'),
    (0, swagger_1.ApiOperation)({ summary: 'Adjust user balance (add/remove coins)' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "adjustBalance", null);
__decorate([
    (0, common_1.Get)('wallet/:userId/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user transaction history' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserTransactions", null);
__decorate([
    (0, common_1.Post)('games/force-round'),
    (0, swagger_1.ApiOperation)({ summary: 'Force crash point for a specific round' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "forceRound", null);
__decorate([
    (0, common_1.Get)('games/forced-rounds'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending forced rounds' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getForcedRounds", null);
__decorate([
    (0, common_1.Delete)('games/forced-rounds/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a forced round' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteForcedRound", null);
__decorate([
    (0, common_1.Post)('jetx/force-round'),
    (0, swagger_1.ApiOperation)({ summary: 'Force JetX crash point for a specific round' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "jetxForceRound", null);
__decorate([
    (0, common_1.Get)('jetx/forced-rounds'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending JetX forced rounds' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "jetxGetForcedRounds", null);
__decorate([
    (0, common_1.Delete)('jetx/forced-rounds/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a JetX forced round' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "jetxDeleteForcedRound", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit logs' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('userId')),
    __param(4, (0, common_1.Query)('startDate')),
    __param(5, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)('commission/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get commission wallet summary' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCommissionSummary", null);
__decorate([
    (0, common_1.Get)('commission/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get commission history per round' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCommissionHistory", null);
__decorate([
    (0, common_1.Get)('game-config/:gameType'),
    (0, swagger_1.ApiOperation)({ summary: 'Get game config for a specific game type' }),
    __param(0, (0, common_1.Param)('gameType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getGameConfig", null);
__decorate([
    (0, common_1.Get)('game-configs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all game configs' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllGameConfigs", null);
__decorate([
    (0, common_1.Put)('game-config/:gameType/multiplier-range'),
    (0, swagger_1.ApiOperation)({ summary: 'Set min/max multiplier for a game' }),
    __param(0, (0, common_1.Param)('gameType')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "setMultiplierRange", null);
__decorate([
    (0, common_1.Put)('game-config/:gameType/toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Enable or disable a game' }),
    __param(0, (0, common_1.Param)('gameType')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "toggleGame", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, auth_guard_1.AdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        users_service_1.UsersService,
        wallet_service_1.WalletService,
        game_engine_service_1.GameEngineService,
        jetx_engine_service_1.JetXEngineService,
        logs_service_1.LogsService,
        prisma_service_1.PrismaService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map