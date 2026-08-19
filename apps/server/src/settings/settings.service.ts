// ============================================
// Settings Service
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  async getSettings() {
    let settings = await this.prisma.platformSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.platformSettings.create({
        data: {
          id: 'default',
          commissionRate: 0.10,
          countdownDuration: 15,
          maintenanceMode: false,
        },
      });
    }

    return {
      ...settings,
      commissionRate: Number(settings.commissionRate),
    };
  }

  async updateSettings(data: {
    commissionRate?: number;
    countdownDuration?: number;
    maintenanceMode?: boolean;
  }, adminId: string) {
    const settings = await this.prisma.platformSettings.update({
      where: { id: 'default' },
      data,
    });

    await this.logsService.log({
      userId: adminId,
      action: 'Updated platform settings',
      category: 'ADMIN',
      details: data,
    });

    return {
      ...settings,
      commissionRate: Number(settings.commissionRate),
    };
  }

  async getGameConfigs() {
    const configs = await this.prisma.gameConfig.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return configs.map((c) => ({
      ...c,
      minBet: Number(c.minBet),
      maxBet: Number(c.maxBet),
      settings: c.settings ? JSON.parse(c.settings) : null,
    }));
  }

  async getEnabledGames() {
    const configs = await this.prisma.gameConfig.findMany({
      where: { enabled: true, visible: true },
      orderBy: { createdAt: 'asc' },
    });
    return configs.map((c) => ({
      ...c,
      minBet: Number(c.minBet),
      maxBet: Number(c.maxBet),
      settings: c.settings ? JSON.parse(c.settings) : null,
    }));
  }

  async updateGameConfig(gameType: string, data: any, adminId: string) {
    const config = await this.prisma.gameConfig.update({
      where: { gameType },
      data: {
        ...data,
        settings: data.settings ? JSON.stringify(data.settings) : undefined,
      },
    });

    await this.logsService.log({
      userId: adminId,
      action: `Updated game config: ${gameType}`,
      category: 'ADMIN',
      details: data,
    });

    return {
      ...config,
      minBet: Number(config.minBet),
      maxBet: Number(config.maxBet),
      settings: config.settings ? JSON.parse(config.settings) : null,
    };
  }

  async getQrCode() {
    const settings = await this.prisma.platformSettings.findUnique({
      where: { id: 'default' },
      select: { qrCodeData: true },
    });
    return { qrCodeData: settings?.qrCodeData || null };
  }

  async updateQrCode(qrCodeData: string, adminId: string) {
    await this.prisma.platformSettings.update({
      where: { id: 'default' },
      data: { qrCodeData },
    });

    await this.logsService.log({
      userId: adminId,
      action: 'Updated payment QR code',
      category: 'ADMIN',
    });

    return { message: 'QR code updated successfully' };
  }
}
