import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
        wallet: {
            balance: number;
        } | null;
        id: string;
        status: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        username: string;
        phone: string | null;
        role: string;
        playerId: string;
    }>;
    changePassword(req: any, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
