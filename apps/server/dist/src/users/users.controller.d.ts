import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
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
    changePassword(req: any, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
