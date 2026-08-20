import { PrismaService } from '../prisma.service';
import { LogsService } from '../logs/logs.service';
export declare class SettingsService {
    private prisma;
    private logsService;
    constructor(prisma: PrismaService, logsService: LogsService);
    getSettings(): Promise<{
        commissionRate: number;
        id: string;
        countdownDuration: number;
        maintenanceMode: boolean;
        qrCodeData: string | null;
    }>;
    updateSettings(data: {
        commissionRate?: number;
        countdownDuration?: number;
        maintenanceMode?: boolean;
    }, adminId: string): Promise<{
        commissionRate: number;
        id: string;
        countdownDuration: number;
        maintenanceMode: boolean;
        qrCodeData: string | null;
    }>;
    getGameConfigs(): Promise<{
        minBet: number;
        maxBet: number;
        settings: any;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        gameType: string;
        enabled: boolean;
        visible: boolean;
        minMultiplier: import("@prisma/client/runtime/library").Decimal;
        maxMultiplier: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    getEnabledGames(): Promise<{
        minBet: number;
        maxBet: number;
        settings: any;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        gameType: string;
        enabled: boolean;
        visible: boolean;
        minMultiplier: import("@prisma/client/runtime/library").Decimal;
        maxMultiplier: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    updateGameConfig(gameType: string, data: any, adminId: string): Promise<{
        minBet: number;
        maxBet: number;
        settings: any;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        gameType: string;
        enabled: boolean;
        visible: boolean;
        minMultiplier: import("@prisma/client/runtime/library").Decimal;
        maxMultiplier: import("@prisma/client/runtime/library").Decimal;
    }>;
    getQrCode(): Promise<{
        qrCodeData: string | null;
    }>;
    updateQrCode(qrCodeData: string, adminId: string): Promise<{
        message: string;
    }>;
}
