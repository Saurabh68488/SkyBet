// ============================================
// Bets Controller
// ============================================

import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BetsService } from './bets.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@ApiTags('Bets')
@Controller('bets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BetsController {
  constructor(private betsService: BetsService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get user bet history' })
  async getBetHistory(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.betsService.getUserBets(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
    });
  }

  @Get('rounds')
  @ApiOperation({ summary: 'Get game round history' })
  async getRoundHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('gameType') gameType?: string,
  ) {
    return this.betsService.getRoundHistory({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      gameType,
    });
  }
}
