// ============================================
// Settings Controller
// ============================================

import { Controller, Get, Put, Body, UseGuards, Req, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard, AdminGuard } from '../auth/auth.guard';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform settings (admin)' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update platform settings (admin)' })
  async updateSettings(@Body() body: any, @Req() req: any) {
    return this.settingsService.updateSettings(body, req.user.id);
  }

  @Get('games')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get enabled games (player)' })
  async getEnabledGames() {
    return this.settingsService.getEnabledGames();
  }

  @Get('games/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all game configs (admin)' })
  async getAllGameConfigs() {
    return this.settingsService.getGameConfigs();
  }

  @Put('games/:gameType')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update game config (admin)' })
  async updateGameConfig(@Param('gameType') gameType: string, @Body() body: any, @Req() req: any) {
    return this.settingsService.updateGameConfig(gameType, body, req.user.id);
  }

  @Get('qr-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment QR code' })
  async getQrCode() {
    return this.settingsService.getQrCode();
  }

  @Put('qr-code')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment QR code (admin)' })
  async updateQrCode(@Body() body: { qrCodeData: string }, @Req() req: any) {
    return this.settingsService.updateQrCode(body.qrCodeData, req.user.id);
  }
}
