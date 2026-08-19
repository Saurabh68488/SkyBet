// ============================================
// Admin Module
// ============================================

import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma.service';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';
import { GameEngineModule } from '../game-engine/game-engine.module';
import { JetXEngineModule } from '../jetx-engine/jetx-engine.module';

@Module({
  imports: [UsersModule, WalletModule, GameEngineModule, JetXEngineModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}
