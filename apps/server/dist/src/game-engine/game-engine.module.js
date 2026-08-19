"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngineModule = void 0;
const common_1 = require("@nestjs/common");
const game_engine_service_1 = require("./game-engine.service");
const game_engine_gateway_1 = require("./game-engine.gateway");
const prisma_service_1 = require("../prisma.service");
const wallet_module_1 = require("../wallet/wallet.module");
const settings_module_1 = require("../settings/settings.module");
const auth_module_1 = require("../auth/auth.module");
let GameEngineModule = class GameEngineModule {
};
exports.GameEngineModule = GameEngineModule;
exports.GameEngineModule = GameEngineModule = __decorate([
    (0, common_1.Module)({
        imports: [wallet_module_1.WalletModule, settings_module_1.SettingsModule, auth_module_1.AuthModule],
        providers: [game_engine_service_1.GameEngineService, game_engine_gateway_1.GameEngineGateway, prisma_service_1.PrismaService],
        exports: [game_engine_service_1.GameEngineService],
    })
], GameEngineModule);
//# sourceMappingURL=game-engine.module.js.map