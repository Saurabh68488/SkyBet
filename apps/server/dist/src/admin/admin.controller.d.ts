import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { GameEngineService } from '../game-engine/game-engine.service';
import { JetXEngineService } from '../jetx-engine/jetx-engine.service';
import { LogsService } from '../logs/logs.service';
import { PrismaService } from '../prisma.service';
export declare class AdminController {
    private adminService;
    private usersService;
    private walletService;
    private gameEngine;
    private jetxEngine;
    private logsService;
    private prisma;
    constructor(adminService: AdminService, usersService: UsersService, walletService: WalletService, gameEngine: GameEngineService, jetxEngine: JetXEngineService, logsService: LogsService, prisma: PrismaService);
    getDashboard(): Promise<{
        currentRound: number;
        gamePhase: "CRASHED" | "WAITING" | "COUNTDOWN" | "RUNNING";
        onlineUsers: number;
        totalUsers: number;
        activeUsers: number;
        todayBets: number;
        todayBetAmount: number;
        todayWins: number;
        todayWinAmount: number;
        todayLosses: number;
        todayCommission: number;
        pendingForcedRounds: number;
        todayRounds: number;
    }>;
    getRecentTransactions(limit?: string): Promise<{
        id: string;
        username: string;
        name: string;
        amount: number;
        type: string;
        status: string;
        balanceBefore: number;
        balanceAfter: number;
        note: string | null;
        createdAt: Date;
    }[]>;
    getUsers(page?: string, limit?: string, search?: string, status?: string): Promise<{
        users: {
            plainPassword: string | null;
            wallet: {
                balance: number;
            } | null;
            id: string;
            status: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            username: string;
            phone: string | null;
            role: string;
            playerId: string;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    createUser(body: any, req: any): Promise<{
        wallet: {
            balance: number;
        } | null;
        id: string;
        status: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        username: string;
        phone: string | null;
        role: string;
        playerId: string;
    }>;
    updateUser(id: string, body: any, req: any): Promise<{
        wallet: {
            balance: number;
        } | null;
        id: string;
        status: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        username: string;
        phone: string | null;
        role: string;
        playerId: string;
    }>;
    toggleUserStatus(id: string, req: any): Promise<{
        id: string;
        status: string;
    }>;
    getPlayerPassword(id: string, req: any): Promise<{
        userId: string;
        username: string;
        plainPassword: string;
    }>;
    changePlayerPassword(id: string, body: {
        password: string;
    }, req: any): Promise<{
        message: string;
    }>;
    adjustBalance(userId: string, body: {
        amount: number;
        type: 'add' | 'remove';
        note?: string;
    }, req: any): Promise<{
        balance: number;
        message: string;
    }>;
    getUserTransactions(userId: string, page?: string, limit?: string): Promise<{
        transactions: {
            amount: number;
            balanceBefore: number;
            balanceAfter: number;
            id: string;
            walletId: string;
            type: string;
            status: string;
            referenceId: string | null;
            note: string | null;
            createdBy: string | null;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    forceRound(body: {
        roundNumber: number;
        crashPoint: number;
    }, req: any): Promise<{
        message: string;
    }>;
    getForcedRounds(): Promise<{
        crashPoint: number;
        id: string;
        createdBy: string;
        createdAt: Date;
        roundNumber: number;
        gameType: string;
        executed: boolean;
    }[]>;
    deleteForcedRound(id: string, req: any): Promise<{
        message: string;
    }>;
    jetxForceRound(body: {
        roundNumber: number;
        crashPoint: number;
    }, req: any): Promise<{
        message: string;
    }>;
    jetxGetForcedRounds(): Promise<{
        crashPoint: number;
        id: string;
        createdBy: string;
        createdAt: Date;
        roundNumber: number;
        gameType: string;
        executed: boolean;
    }[]>;
    jetxDeleteForcedRound(id: string, req: any): Promise<{
        message: string;
    }>;
    getLogs(page?: string, limit?: string, category?: string, userId?: string, startDate?: string, endDate?: string): Promise<{
        logs: {
            details: any;
            user: {
                name: string;
                username: string;
            } | null;
            id: string;
            createdAt: Date;
            userId: string | null;
            action: string;
            category: string;
            ip: string | null;
            userAgent: string | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getCommissionSummary(): Promise<{
        allTime: {
            commission: number;
            totalBets: number;
            totalPayouts: number;
            rounds: number;
        };
        today: {
            commission: number;
            totalBets: number;
            totalPayouts: number;
            rounds: number;
        };
        thisWeek: {
            commission: number;
            totalBets: number;
            totalPayouts: number;
            rounds: number;
        };
        thisMonth: {
            commission: number;
            totalBets: number;
            totalPayouts: number;
            rounds: number;
        };
    }>;
    getCommissionHistory(page?: string, limit?: string): Promise<{
        rounds: {
            id: string;
            roundNumber: number;
            crashPoint: number;
            totalBets: number;
            totalPayouts: number;
            commission: number;
            createdAt: Date;
            bets: {
                id: string;
                username: string;
                amount: number;
                commission: number;
                status: string;
                cashoutAt: number | null;
                winAmount: number | null;
            }[];
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getGameConfig(gameType: string): Promise<{
        error: string;
        gameType?: undefined;
        name?: undefined;
        minMultiplier?: undefined;
        maxMultiplier?: undefined;
        minBet?: undefined;
        maxBet?: undefined;
        enabled?: undefined;
    } | {
        gameType: string;
        name: string;
        minMultiplier: number;
        maxMultiplier: number;
        minBet: number;
        maxBet: number;
        enabled: boolean;
        error?: undefined;
    }>;
    getAllGameConfigs(): Promise<{
        gameType: string;
        name: string;
        minMultiplier: number;
        maxMultiplier: number;
        minBet: number;
        maxBet: number;
        enabled: boolean;
    }[]>;
    setMultiplierRange(gameType: string, body: {
        minMultiplier: number;
        maxMultiplier: number;
    }): Promise<{
        error: string;
        success?: undefined;
        gameType?: undefined;
        minMultiplier?: undefined;
        maxMultiplier?: undefined;
    } | {
        success: boolean;
        gameType: string;
        minMultiplier: number;
        maxMultiplier: number;
        error?: undefined;
    }>;
    toggleGame(gameType: string, body: {
        enabled: boolean;
    }): Promise<{
        success: boolean;
        gameType: string;
        enabled: boolean;
    }>;
}
