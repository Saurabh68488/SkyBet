"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JetXEngineModule = void 0;
const common_1 = require("@nestjs/common");
const jetx_engine_service_1 = require("./jetx-engine.service");
const jetx_engine_gateway_1 = require("./jetx-engine.gateway");
const prisma_service_1 = require("../prisma.service");
const wallet_module_1 = require("../wallet/wallet.module");
const settings_module_1 = require("../settings/settings.module");
const auth_module_1 = require("../auth/auth.module");
let JetXEngineModule = class JetXEngineModule {
};
exports.JetXEngineModule = JetXEngineModule;
exports.JetXEngineModule = JetXEngineModule = __decorate([
    (0, common_1.Module)({
        imports: [wallet_module_1.WalletModule, settings_module_1.SettingsModule, auth_module_1.AuthModule],
        providers: [jetx_engine_service_1.JetXEngineService, jetx_engine_gateway_1.JetXGateway, prisma_service_1.PrismaService],
        exports: [jetx_engine_service_1.JetXEngineService],
    })
], JetXEngineModule);
//# sourceMappingURL=jetx-engine.module.js.map