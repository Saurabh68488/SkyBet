"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LudoEngineModule = void 0;
const common_1 = require("@nestjs/common");
const ludo_engine_service_1 = require("./ludo-engine.service");
const ludo_engine_gateway_1 = require("./ludo-engine.gateway");
const prisma_service_1 = require("../prisma.service");
const wallet_module_1 = require("../wallet/wallet.module");
const auth_module_1 = require("../auth/auth.module");
let LudoEngineModule = class LudoEngineModule {
};
exports.LudoEngineModule = LudoEngineModule;
exports.LudoEngineModule = LudoEngineModule = __decorate([
    (0, common_1.Module)({
        imports: [wallet_module_1.WalletModule, auth_module_1.AuthModule],
        providers: [ludo_engine_service_1.LudoEngineService, ludo_engine_gateway_1.LudoGateway, prisma_service_1.PrismaService],
        exports: [ludo_engine_service_1.LudoEngineService],
    })
], LudoEngineModule);
//# sourceMappingURL=ludo-engine.module.js.map