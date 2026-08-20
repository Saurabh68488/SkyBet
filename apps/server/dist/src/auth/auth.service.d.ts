import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { LogsService } from '../logs/logs.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private logsService;
    private configService;
    constructor(prisma: PrismaService, jwtService: JwtService, logsService: LogsService, configService: ConfigService);
    login(username: string, password: string, ip?: string, userAgent?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            wallet: {
                balance: number;
            } | null;
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            username: string;
            plainPassword: string | null;
            phone: string | null;
            role: string;
            playerId: string;
        };
    }>;
    refreshToken(token: string): Promise<{
        accessToken: string;
    }>;
    logout(userId: string, token?: string): Promise<void>;
    validateUser(userId: string): Promise<{
        wallet: {
            id: string;
            userId: string;
            updatedAt: Date;
            balance: import("@prisma/client/runtime/library").Decimal;
        } | null;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        username: string;
        plainPassword: string | null;
        phone: string | null;
        role: string;
        playerId: string;
    } | null>;
}
