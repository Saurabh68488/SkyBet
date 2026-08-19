import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    createDeposit(body: {
        amount: number;
        playerTxnId: string;
    }, req: any): Promise<{
        id: string;
        message: string;
    }>;
    createWithdraw(body: {
        amount: number;
        upiId: string;
    }, req: any): Promise<{
        id: string;
        message: string;
    }>;
    getMyRequests(req: any, page?: string, type?: string): Promise<{
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
}
export declare class AdminPaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    getAllRequests(page?: string, status?: string, type?: string): Promise<{
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
    approveRequest(id: string, body: {
        adminTxnId?: string;
    }, req: any): Promise<{
        message: string;
    }>;
    rejectRequest(id: string, body: {
        reason: string;
    }, req: any): Promise<{
        message: string;
    }>;
}
