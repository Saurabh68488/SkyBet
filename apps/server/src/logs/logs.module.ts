// ============================================
// Logs Module
// ============================================

import { Module, Global } from '@nestjs/common';
import { LogsService } from './logs.service';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  providers: [LogsService, PrismaService],
  exports: [LogsService],
})
export class LogsModule {}
