import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
        wallet: {
            balance: number;
        } | null;
        id: string;
        createdAt: Date;
        name: string;
        username: string;
        phone: string | null;
        role: string;
        status: string;
        playerId: string;
        updatedAt: Date;
    }>;
    changePassword(req: any, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
