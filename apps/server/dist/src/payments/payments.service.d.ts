import { PrismaService } from '../prisma.service';
import { LogsService } from '../logs/logs.service';
import { WalletService } from '../wallet/wallet.service';
export declare class PaymentsService {
    private prisma;
    private logsService;
    private walletService;
    constructor(prisma: PrismaService, logsService: LogsService, walletService: WalletService);
    createDeposit(userId: string, amount: number, playerTxnId: string): Promise<{
        id: string;
        message: string;
    }>;
    createWithdraw(userId: string, amount: number, upiId: string): Promise<{
        id: string;
        message: string;
    }>;
    getMyRequests(userId: string, page?: number, type?: string): Promise<{
        requests: {
            id: string;
            type: string;
            amount: number;
            status: string;
            playerTxnId: string | null;
            upiId: string | null;
            adminTxnId: string | null;
            adminNote: string | null;
            processedAt: Date | null;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getAllRequests(page?: number, status?: string, type?: string): Promise<{
        requests: {
            id: string;
            type: string;
            amount: number;
            status: string;
            playerTxnId: string | null;
            upiId: string | null;
            adminTxnId: string | null;
            adminNote: string | null;
            processedBy: string | null;
            processedAt: Date | null;
            createdAt: Date;
            user: {
                id: string;
                name: string;
                username: string;
                playerId: string;
            };
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getStats(): Promise<{
        pending: number;
        todayApproved: number;
        todayRejected: number;
        totalDeposits: number;
        totalWithdrawals: number;
    }>;
    approveRequest(requestId: string, adminId: string, adminTxnId?: string): Promise<{
        message: string;
    }>;
    rejectRequest(requestId: string, adminId: string, reason: string): Promise<{
        message: string;
    }>;
}
