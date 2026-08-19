// ============================================
// Bets Module
// ============================================

import { Module } from '@nestjs/common';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [BetsController],
  providers: [BetsService, PrismaService],
  exports: [BetsService],
})
export class BetsModule {}
