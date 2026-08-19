// ============================================
// Wallet Controller
// ============================================

import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  async getBalance(@Req() req: any) {
    const balance = await this.walletService.getBalance(req.user.id);
    return { balance };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  async getTransactions(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.walletService.getTransactions(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      type,
    });
  }
}
