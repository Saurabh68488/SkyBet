// ============================================
// Game Engine Module
// ============================================

import { Module } from '@nestjs/common';
import { GameEngineService } from './game-engine.service';
import { GameEngineGateway } from './game-engine.gateway';
import { PrismaService } from '../prisma.service';
import { WalletModule } from '../wallet/wallet.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [WalletModule, SettingsModule, AuthModule],
  providers: [GameEngineService, GameEngineGateway, PrismaService],
  exports: [GameEngineService],
})
export class GameEngineModule {}
