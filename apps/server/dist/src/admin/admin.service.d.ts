import { PrismaService } from '../prisma.service';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(): Promise<{
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
    getRecentTransactions(limit?: number): Promise<{
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
    getUserTransactions(userId: string, page?: number, limit?: number): Promise<{
        transactions: {
            amount: number;
            balanceBefore: number;
            balanceAfter: number;
            id: string;
            createdAt: Date;
            status: string;
            type: string;
            walletId: string;
            referenceId: string | null;
            note: string | null;
            createdBy: string | null;
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
    getCommissionHistory(page?: number, limit?: number): Promise<{
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
}
