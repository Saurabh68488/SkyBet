import { PrismaService } from '../prisma.service';
import { LogsService } from '../logs/logs.service';
export declare class WalletService {
    private prisma;
    private logsService;
    constructor(prisma: PrismaService, logsService: LogsService);
    getBalance(userId: string): Promise<number>;
    getTransactions(userId: string, options: {
        page?: number;
        limit?: number;
        type?: string;
    }): Promise<{
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
    debit(userId: string, amount: number, type: string, referenceId?: string, note?: string): Promise<number>;
    credit(userId: string, amount: number, type: string, referenceId?: string, note?: string): Promise<number>;
    adjustBalance(userId: string, amount: number, adjustType: 'add' | 'remove', adminId: string, note?: string): Promise<number>;
}
