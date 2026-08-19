import { WalletService } from './wallet.service';
export declare class WalletController {
    private walletService;
    constructor(walletService: WalletService);
    getBalance(req: any): Promise<{
        balance: number;
    }>;
    getTransactions(req: any, page?: string, limit?: string, type?: string): Promise<{
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
}
