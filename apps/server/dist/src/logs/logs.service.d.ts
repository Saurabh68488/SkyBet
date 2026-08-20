import { PrismaService } from '../prisma.service';
interface LogEntry {
    userId?: string;
    action: string;
    category: string;
    details?: Record<string, any>;
    ip?: string;
    userAgent?: string;
}
export declare class LogsService {
    private prisma;
    constructor(prisma: PrismaService);
    log(entry: LogEntry): Promise<void>;
    getLogs(options: {
        page?: number;
        limit?: number;
        category?: string;
        userId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        logs: {
            details: any;
            user: {
                name: string;
                username: string;
            } | null;
            id: string;
            userId: string | null;
            createdAt: Date;
            category: string;
            action: string;
            ip: string | null;
            userAgent: string | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
}
export {};
