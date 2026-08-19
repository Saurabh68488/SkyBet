// ============================================
// Root App Module
// ============================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { SettingsModule } from './settings/settings.module';
import { LogsModule } from './logs/logs.module';
import { BetsModule } from './bets/bets.module';
import { AdminModule } from './admin/admin.module';
import { GameEngineModule } from './game-engine/game-engine.module';
import { JetXEngineModule } from './jetx-engine/jetx-engine.module';
import { PaymentsModule } from './payments/payments.module';
import { LudoEngineModule } from './ludo-engine/ludo-engine.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    WalletModule,
    SettingsModule,
    LogsModule,
    BetsModule,
    AdminModule,
    GameEngineModule,
    JetXEngineModule,
    PaymentsModule,
    LudoEngineModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}

