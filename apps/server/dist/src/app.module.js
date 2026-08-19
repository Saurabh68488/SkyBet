"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("./prisma.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const wallet_module_1 = require("./wallet/wallet.module");
const settings_module_1 = require("./settings/settings.module");
const logs_module_1 = require("./logs/logs.module");
const bets_module_1 = require("./bets/bets.module");
const admin_module_1 = require("./admin/admin.module");
const game_engine_module_1 = require("./game-engine/game-engine.module");
const jetx_engine_module_1 = require("./jetx-engine/jetx-engine.module");
const payments_module_1 = require("./payments/payments.module");
const ludo_engine_module_1 = require("./ludo-engine/ludo-engine.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            wallet_module_1.WalletModule,
            settings_module_1.SettingsModule,
            logs_module_1.LogsModule,
            bets_module_1.BetsModule,
            admin_module_1.AdminModule,
            game_engine_module_1.GameEngineModule,
            jetx_engine_module_1.JetXEngineModule,
            payments_module_1.PaymentsModule,
            ludo_engine_module_1.LudoEngineModule,
        ],
        providers: [prisma_service_1.PrismaService],
        exports: [prisma_service_1.PrismaService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map