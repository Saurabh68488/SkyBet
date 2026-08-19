// ============================================
// JetX Engine Module
// ============================================

import { Module } from '@nestjs/common';
import { JetXEngineService } from './jetx-engine.service';
import { JetXGateway } from './jetx-engine.gateway';
import { PrismaService } from '../prisma.service';
import { WalletModule } from '../wallet/wallet.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [WalletModule, SettingsModule, AuthModule],
  providers: [JetXEngineService, JetXGateway, PrismaService],
  exports: [JetXEngineService],
})
export class JetXEngineModule {}
