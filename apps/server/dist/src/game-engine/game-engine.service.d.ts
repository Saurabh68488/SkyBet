import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { SettingsService } from '../settings/settings.service';
import { LogsService } from '../logs/logs.service';
export interface ActiveBet {
    id: string;
    userId: string;
    username: string;
    amount: number;
    betSlot: number;
    autoCashout: number | null;
    cashoutAt: number | null;
    winAmount: number | null;
    status: string;
}
type GamePhase = 'WAITING' | 'COUNTDOWN' | 'RUNNING' | 'CRASHED';
export declare class GameEngineService implements OnModuleInit {
    private prisma;
    private walletService;
    private settingsService;
    private logsService;
    private readonly logger;
    private plugin;
    private phase;
    private currentRoundId;
    private currentRoundNumber;
    private countdown;
    private countdownInterval;
    private tickInterval;
    private activeBets;
    private nextRoundBets;
    private startTime;
    private crashPoint;
    private broadcastFn;
    private sendToUserFn;
    private history;
    private fakeBets;
    private readonly FAKE_NAMES;
    constructor(prisma: PrismaService, walletService: WalletService, settingsService: SettingsService, logsService: LogsService);
    onModuleInit(): Promise<void>;
    setBroadcast(broadcastFn: (event: string, data: any) => void, sendToUserFn: (userId: string, event: string, data: any) => void): void;
    private broadcast;
    private sendToUser;
    private startCountdown;
    private startRound;
    private tick;
    private handleCrash;
    placeBet(userId: string, username: string, amount: number, betSlot: number, autoCashout?: number): Promise<{
        success: boolean;
        message: string;
        bet?: any;
    }>;
    processCashout(userId: string, betSlot: number, forcedMultiplier?: number): Promise<{
        success: boolean;
        message: string;
        cashout?: any;
    }>;
    private generateFakeBets;
    private simulateFakeCashouts;
    private crashFakeBets;
    private activateFakeBets;
    private getAllBetsForBroadcast;
    private broadcastBets;
    getGameState(): {
        phase: GamePhase;
        roundId: string | null;
        roundNumber: number;
        multiplier: number;
        countdown: number;
        startTime: number | null;
        crashPoint: number | null;
        bets: {
            id: string;
            userId: string;
            username: string;
            amount: number;
            betSlot: number;
            autoCashout: number | null;
            cashoutAt: number | null;
            winAmount: number | null;
            status: string;
        }[];
        history: {
            roundNumber: number;
            crashPoint: number;
            createdAt: string;
        }[];
    };
    getPhase(): GamePhase;
    getCurrentRoundNumber(): number;
    getHistory(): {
        roundNumber: number;
        crashPoint: number;
        createdAt: string;
    }[];
    forceRound(roundNumber: number, crashPoint: number, adminId: string): Promise<{
        message: string;
    }>;
    getForcedRounds(): Promise<{
        id: string;
        createdBy: string;
        createdAt: Date;
        roundNumber: number;
        gameType: string;
        crashPoint: import("@prisma/client/runtime/library").Decimal;
        executed: boolean;
    }[]>;
    deleteForcedRound(id: string, adminId: string): Promise<{
        message: string;
    }>;
}
export {};
