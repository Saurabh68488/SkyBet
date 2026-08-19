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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const logs_service_1 = require("../logs/logs.service");
let SettingsService = class SettingsService {
    constructor(prisma, logsService) {
        this.prisma = prisma;
        this.logsService = logsService;
    }
    async getSettings() {
        let settings = await this.prisma.platformSettings.findUnique({
            where: { id: 'default' },
        });
        if (!settings) {
            settings = await this.prisma.platformSettings.create({
                data: {
                    id: 'default',
                    commissionRate: 0.10,
                    countdownDuration: 15,
                    maintenanceMode: false,
                },
            });
        }
        return {
            ...settings,
            commissionRate: Number(settings.commissionRate),
        };
    }
    async updateSettings(data, adminId) {
        const settings = await this.prisma.platformSettings.update({
            where: { id: 'default' },
            data,
        });
        await this.logsService.log({
            userId: adminId,
            action: 'Updated platform settings',
            category: 'ADMIN',
            details: data,
        });
        return {
            ...settings,
            commissionRate: Number(settings.commissionRate),
        };
    }
    async getGameConfigs() {
        const configs = await this.prisma.gameConfig.findMany({
            orderBy: { createdAt: 'asc' },
        });
        return configs.map((c) => ({
            ...c,
            minBet: Number(c.minBet),
            maxBet: Number(c.maxBet),
            settings: c.settings ? JSON.parse(c.settings) : null,
        }));
    }
    async getEnabledGames() {
        const configs = await this.prisma.gameConfig.findMany({
            where: { enabled: true, visible: true },
            orderBy: { createdAt: 'asc' },
        });
        return configs.map((c) => ({
            ...c,
            minBet: Number(c.minBet),
            maxBet: Number(c.maxBet),
            settings: c.settings ? JSON.parse(c.settings) : null,
        }));
    }
    async updateGameConfig(gameType, data, adminId) {
        const config = await this.prisma.gameConfig.update({
            where: { gameType },
            data: {
                ...data,
                settings: data.settings ? JSON.stringify(data.settings) : undefined,
            },
        });
        await this.logsService.log({
            userId: adminId,
            action: `Updated game config: ${gameType}`,
            category: 'ADMIN',
            details: data,
        });
        return {
            ...config,
            minBet: Number(config.minBet),
            maxBet: Number(config.maxBet),
            settings: config.settings ? JSON.parse(config.settings) : null,
        };
    }
    async getQrCode() {
        const settings = await this.prisma.platformSettings.findUnique({
            where: { id: 'default' },
            select: { qrCodeData: true },
        });
        return { qrCodeData: settings?.qrCodeData || null };
    }
    async updateQrCode(qrCodeData, adminId) {
        await this.prisma.platformSettings.update({
            where: { id: 'default' },
            data: { qrCodeData },
        });
        await this.logsService.log({
            userId: adminId,
            action: 'Updated payment QR code',
            category: 'ADMIN',
        });
        return { message: 'QR code updated successfully' };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logs_service_1.LogsService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map