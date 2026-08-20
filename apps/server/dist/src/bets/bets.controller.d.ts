import { BetsService } from './bets.service';
export declare class BetsController {
    private betsService;
    constructor(betsService: BetsService);
    getBetHistory(req: any, page?: string, limit?: string, status?: string): Promise<{
        bets: {
            amount: number;
            autoCashout: number | null;
            cashoutAt: number | null;
            winAmount: number | null;
            commission: number;
            round: {
                crashPoint: number;
                gameType: string;
                roundNumber: number;
            } | null;
            id: string;
            createdAt: Date;
            userId: string;
            status: string;
            updatedAt: Date;
            roundId: string;
            betSlot: number;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getRoundHistory(page?: string, limit?: string, gameType?: string): Promise<{
        rounds: {
            crashPoint: number;
            totalBets: number;
            totalPayouts: number;
            commission: number;
            id: string;
            createdAt: Date;
            status: string;
            gameType: string;
            roundNumber: number;
            isForced: boolean;
            startedAt: Date | null;
            crashedAt: Date | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
}
