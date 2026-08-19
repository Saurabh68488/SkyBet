// ============================================
// Ludo Engine Module
// ============================================

import { Module } from '@nestjs/common';
import { LudoEngineService } from './ludo-engine.service';
import { LudoGateway } from './ludo-engine.gateway';
import { PrismaService } from '../prisma.service';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [WalletModule, AuthModule],
  providers: [LudoEngineService, LudoGateway, PrismaService],
  exports: [LudoEngineService],
})
export class LudoEngineModule {}
