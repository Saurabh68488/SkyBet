import { SettingsService } from './settings.service';
export declare class SettingsController {
    private settingsService;
    constructor(settingsService: SettingsService);
    getSettings(): Promise<{
        commissionRate: number;
        id: string;
        countdownDuration: number;
        maintenanceMode: boolean;
        qrCodeData: string | null;
    }>;
    updateSettings(body: any, req: any): Promise<{
        commissionRate: number;
        id: string;
        countdownDuration: number;
        maintenanceMode: boolean;
        qrCodeData: string | null;
    }>;
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
    getAllGameConfigs(): Promise<{
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
    updateGameConfig(gameType: string, body: any, req: any): Promise<{
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
    updateQrCode(body: {
        qrCodeData: string;
    }, req: any): Promise<{
        message: string;
    }>;
}
