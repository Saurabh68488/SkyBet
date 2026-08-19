// ============================================
// Payments Module
// ============================================

import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController, AdminPaymentsController } from './payments.controller';
import { PrismaService } from '../prisma.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [PaymentsService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
