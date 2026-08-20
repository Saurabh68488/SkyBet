import { PrismaService } from '../prisma.service';
import { LogsService } from '../logs/logs.service';
export declare class UsersService {
    private prisma;
    private logsService;
    constructor(prisma: PrismaService, logsService: LogsService);
    createUser(data: {
        username: string;
        password: string;
        name: string;
        phone?: string;
        role?: string;
        status?: string;
        initialBalance?: number;
    }, createdByAdminId?: string): Promise<{
        wallet: {
            balance: number;
        } | null;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        username: string;
        phone: string | null;
        role: string;
        playerId: string;
    }>;
    findAll(options: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }): Promise<{
        users: {
            plainPassword: string | null;
            wallet: {
                balance: number;
            } | null;
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            username: string;
            phone: string | null;
            role: string;
            playerId: string;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<{
        wallet: {
            balance: number;
        } | null;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        username: string;
        phone: string | null;
        role: string;
        playerId: string;
    }>;
    updateUser(id: string, data: {
        name?: string;
        phone?: string;
        status?: string;
    }, adminId?: string): Promise<{
        wallet: {
            balance: number;
        } | null;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        username: string;
        phone: string | null;
        role: string;
        playerId: string;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    adminChangePassword(targetUserId: string, newPassword: string, adminId: string): Promise<{
        message: string;
    }>;
    adminGetPassword(targetUserId: string, adminId: string): Promise<{
        userId: string;
        username: string;
        plainPassword: string;
    }>;
    toggleStatus(id: string, adminId: string): Promise<{
        id: string;
        status: string;
    }>;
}
