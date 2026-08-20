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
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            roundId: string;
            betSlot: number;
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
            id: string;
            status: string;
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
