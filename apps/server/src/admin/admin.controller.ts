// ============================================
// Admin Controller
// ============================================

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, AdminGuard } from '../auth/auth.guard';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { GameEngineService } from '../game-engine/game-engine.service';
import { JetXEngineService } from '../jetx-engine/jetx-engine.service';
import { LogsService } from '../logs/logs.service';
import { PrismaService } from '../prisma.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private adminService: AdminService,
    private usersService: UsersService,
    private walletService: WalletService,
    private gameEngine: GameEngineService,
    private jetxEngine: JetXEngineService,
    private logsService: LogsService,
    private prisma: PrismaService,
  ) {}

  // ─── DASHBOARD ────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboard() {
    const stats = await this.adminService.getDashboardStats();
    const gameState = this.gameEngine.getGameState();
    return {
      ...stats,
      currentRound: gameState.roundNumber,
      gamePhase: gameState.phase,
      onlineUsers: 0, // Will be filled by gateway
    };
  }

  @Get('transactions/recent')
  @ApiOperation({ summary: 'Get recent transactions' })
  async getRecentTransactions(@Query('limit') limit?: string) {
    return this.adminService.getRecentTransactions(limit ? parseInt(limit) : 10);
  }

  // ─── USER MANAGEMENT ─────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.usersService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
      status,
    });
  }

  @Post('users')
  @ApiOperation({ summary: 'Create new user' })
  async createUser(@Body() body: any, @Req() req: any) {
    return this.usersService.createUser(body, req.user.id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.usersService.updateUser(id, body, req.user.id);
  }

  @Put('users/:id/status')
  @ApiOperation({ summary: 'Toggle user active/inactive' })
  async toggleUserStatus(@Param('id') id: string, @Req() req: any) {
    return this.usersService.toggleStatus(id, req.user.id);
  }

  @Get('users/:id/password')
  @ApiOperation({ summary: 'View player password (players only, not admins)' })
  async getPlayerPassword(@Param('id') id: string, @Req() req: any) {
    return this.usersService.adminGetPassword(id, req.user.id);
  }

  @Put('users/:id/password')
  @ApiOperation({ summary: 'Change player password (players only, not admins)' })
  async changePlayerPassword(@Param('id') id: string, @Body() body: { password: string }, @Req() req: any) {
    return this.usersService.adminChangePassword(id, body.password, req.user.id);
  }

  // ─── WALLET MANAGEMENT ───────────────────────

  @Post('wallet/:userId/adjust')
  @ApiOperation({ summary: 'Adjust user balance (add/remove coins)' })
  async adjustBalance(
    @Param('userId') userId: string,
    @Body() body: { amount: number; type: 'add' | 'remove'; note?: string },
    @Req() req: any,
  ) {
    const newBalance = await this.walletService.adjustBalance(
      userId,
      body.amount,
      body.type,
      req.user.id,
      body.note,
    );
    return { balance: newBalance, message: `Balance ${body.type === 'add' ? 'added' : 'removed'} successfully` };
  }

  @Get('wallet/:userId/history')
  @ApiOperation({ summary: 'Get user transaction history' })
  async getUserTransactions(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUserTransactions(userId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  // ─── GAME CONTROL ────────────────────────────

  @Post('games/force-round')
  @ApiOperation({ summary: 'Force crash point for a specific round' })
  async forceRound(@Body() body: { roundNumber: number; crashPoint: number }, @Req() req: any) {
    return this.gameEngine.forceRound(body.roundNumber, body.crashPoint, req.user.id);
  }

  @Get('games/forced-rounds')
  @ApiOperation({ summary: 'Get pending forced rounds' })
  async getForcedRounds() {
    const rounds = await this.gameEngine.getForcedRounds();
    return rounds.map((r) => ({
      ...r,
      crashPoint: Number(r.crashPoint),
    }));
  }

  @Delete('games/forced-rounds/:id')
  @ApiOperation({ summary: 'Delete a forced round' })
  async deleteForcedRound(@Param('id') id: string, @Req() req: any) {
    return this.gameEngine.deleteForcedRound(id, req.user.id);
  }

  // ─── JETX GAME CONTROL ─────────────────────────

  @Post('jetx/force-round')
  @ApiOperation({ summary: 'Force JetX crash point for a specific round' })
  async jetxForceRound(@Body() body: { roundNumber: number; crashPoint: number }, @Req() req: any) {
    return this.jetxEngine.forceRound(body.roundNumber, body.crashPoint, req.user.id);
  }

  @Get('jetx/forced-rounds')
  @ApiOperation({ summary: 'Get pending JetX forced rounds' })
  async jetxGetForcedRounds() {
    const rounds = await this.jetxEngine.getForcedRounds();
    return rounds.map((r) => ({ ...r, crashPoint: Number(r.crashPoint) }));
  }

  @Delete('jetx/forced-rounds/:id')
  @ApiOperation({ summary: 'Delete a JetX forced round' })
  async jetxDeleteForcedRound(@Param('id') id: string, @Req() req: any) {
    return this.jetxEngine.deleteForcedRound(id, req.user.id);
  }

  // ─── LOGS ────────────────────────────────────

  @Get('logs')
  @ApiOperation({ summary: 'Get audit logs' })
  async getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.logsService.getLogs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      category,
      userId,
      startDate,
      endDate,
    });
  }
  // ─── COMMISSION WALLET ────────────────────────

  @Get('commission/summary')
  @ApiOperation({ summary: 'Get commission wallet summary' })
  async getCommissionSummary() {
    return this.adminService.getCommissionSummary();
  }

  @Get('commission/history')
  @ApiOperation({ summary: 'Get commission history per round' })
  async getCommissionHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getCommissionHistory(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  // ─── GAME CONFIG (Multiplier Range) ──────────

  @Get('game-config/:gameType')
  @ApiOperation({ summary: 'Get game config for a specific game type' })
  async getGameConfig(@Param('gameType') gameType: string) {
    const config = await this.prisma.gameConfig.findUnique({ where: { gameType: gameType.toUpperCase() } });
    if (!config) return { error: 'Game config not found' };
    return {
      gameType: config.gameType,
      name: config.name,
      minMultiplier: Number(config.minMultiplier),
      maxMultiplier: Number(config.maxMultiplier),
      minBet: Number(config.minBet),
      maxBet: Number(config.maxBet),
      enabled: config.enabled,
    };
  }

  @Get('game-configs')
  @ApiOperation({ summary: 'Get all game configs' })
  async getAllGameConfigs() {
    const configs = await this.prisma.gameConfig.findMany();
    return configs.map(c => ({
      gameType: c.gameType,
      name: c.name,
      minMultiplier: Number(c.minMultiplier),
      maxMultiplier: Number(c.maxMultiplier),
      minBet: Number(c.minBet),
      maxBet: Number(c.maxBet),
      enabled: c.enabled,
    }));
  }

  @Put('game-config/:gameType/multiplier-range')
  @ApiOperation({ summary: 'Set min/max multiplier for a game' })
  async setMultiplierRange(
    @Param('gameType') gameType: string,
    @Body() body: { minMultiplier: number; maxMultiplier: number },
  ) {
    const gt = gameType.toUpperCase();
    if (body.minMultiplier < 1) return { error: 'Min multiplier must be >= 1.00' };
    if (body.maxMultiplier < body.minMultiplier) return { error: 'Max must be >= min' };
    if (body.maxMultiplier > 10000) return { error: 'Max multiplier cannot exceed 10000' };

    const config = await this.prisma.gameConfig.update({
      where: { gameType: gt },
      data: {
        minMultiplier: body.minMultiplier,
        maxMultiplier: body.maxMultiplier,
      },
    });

    return {
      success: true,
      gameType: gt,
      minMultiplier: Number(config.minMultiplier),
      maxMultiplier: Number(config.maxMultiplier),
    };
  }

  @Put('game-config/:gameType/toggle')
  @ApiOperation({ summary: 'Enable or disable a game' })
  async toggleGame(
    @Param('gameType') gameType: string,
    @Body() body: { enabled: boolean },
  ) {
    const gt = gameType.toUpperCase();
    const config = await this.prisma.gameConfig.update({
      where: { gameType: gt },
      data: { enabled: body.enabled },
    });

    await this.logsService.log({
      userId: 'admin',
      action: `${body.enabled ? 'Enabled' : 'Disabled'} game: ${gt}`,
      category: 'ADMIN',
      details: { gameType: gt, enabled: body.enabled },
    });

    return {
      success: true,
      gameType: gt,
      enabled: config.enabled,
    };
  }
}
