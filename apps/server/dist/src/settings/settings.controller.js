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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const settings_service_1 = require("./settings.service");
const auth_guard_1 = require("../auth/auth.guard");
let SettingsController = class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async getSettings() {
        return this.settingsService.getSettings();
    }
    async updateSettings(body, req) {
        return this.settingsService.updateSettings(body, req.user.id);
    }
    async getEnabledGames() {
        return this.settingsService.getEnabledGames();
    }
    async getAllGameConfigs() {
        return this.settingsService.getGameConfigs();
    }
    async updateGameConfig(gameType, body, req) {
        return this.settingsService.updateGameConfig(gameType, body, req.user.id);
    }
    async getQrCode() {
        return this.settingsService.getQrCode();
    }
    async updateQrCode(body, req) {
        return this.settingsService.updateQrCode(body.qrCodeData, req.user.id);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, auth_guard_1.AdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get platform settings (admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)(),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, auth_guard_1.AdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update platform settings (admin)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)('games'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get enabled games (player)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getEnabledGames", null);
__decorate([
    (0, common_1.Get)('games/all'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, auth_guard_1.AdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all game configs (admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getAllGameConfigs", null);
__decorate([
    (0, common_1.Put)('games/:gameType'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, auth_guard_1.AdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update game config (admin)' }),
    __param(0, (0, common_1.Param)('gameType')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateGameConfig", null);
__decorate([
    (0, common_1.Get)('qr-code'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment QR code' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getQrCode", null);
__decorate([
    (0, common_1.Put)('qr-code'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, auth_guard_1.AdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update payment QR code (admin)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateQrCode", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_1.ApiTags)('Settings'),
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map