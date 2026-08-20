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
    getRoundHistory(page?: string, limit?: string, gameType?: string): Promise<{
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
