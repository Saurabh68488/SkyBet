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
exports.BetsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bets_service_1 = require("./bets.service");
const auth_guard_1 = require("../auth/auth.guard");
let BetsController = class BetsController {
    constructor(betsService) {
        this.betsService = betsService;
    }
    async getBetHistory(req, page, limit, status) {
        return this.betsService.getUserBets(req.user.id, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            status,
        });
    }
    async getRoundHistory(page, limit, gameType) {
        return this.betsService.getRoundHistory({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            gameType,
        });
    }
};
exports.BetsController = BetsController;
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user bet history' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], BetsController.prototype, "getBetHistory", null);
__decorate([
    (0, common_1.Get)('rounds'),
    (0, swagger_1.ApiOperation)({ summary: 'Get game round history' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('gameType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BetsController.prototype, "getRoundHistory", null);
exports.BetsController = BetsController = __decorate([
    (0, swagger_1.ApiTags)('Bets'),
    (0, common_1.Controller)('bets'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [bets_service_1.BetsService])
], BetsController);
//# sourceMappingURL=bets.controller.js.map