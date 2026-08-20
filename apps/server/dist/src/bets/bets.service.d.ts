import { PrismaService } from '../prisma.service';
export declare class BetsService {
    private prisma;
    constructor(prisma: PrismaService);
    getUserBets(userId: string, options: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{
        bets: {
            amount: number;
            autoCashout: number | null;
            cashoutAt: number | null;
            winAmount: number | null;
            commission: number;
            round: {
                crashPoint: number;
                roundNumber: number;
                gameType: string;
            } | null;
            status: string;
            id: string;
            userId: string;
            roundId: string;
            betSlot: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getRoundHistory(options: {
        page?: number;
        limit?: number;
        gameType?: string;
    }): Promise<{
        rounds: {
            crashPoint: number;
            totalBets: number;
            totalPayouts: number;
            commission: number;
            status: string;
            id: string;
            createdAt: Date;
            roundNumber: number;
            gameType: string;
            isForced: boolean;
            startedAt: Date | null;
            crashedAt: Date | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
}
