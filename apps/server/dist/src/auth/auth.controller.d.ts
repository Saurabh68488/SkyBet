import { AuthService } from './auth.service';
import { Request } from 'express';
declare class LoginDto {
    username: string;
    password: string;
}
declare class RefreshDto {
    refreshToken: string;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: LoginDto, req: Request, userAgent: string): Promise<{
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
    refresh(body: RefreshDto): Promise<{
        accessToken: string;
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
    getMe(req: any): Promise<{
        error: string;
    } | {
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
        error?: undefined;
    }>;
}
export {};
