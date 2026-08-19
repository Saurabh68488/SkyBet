import { OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JetXEngineService } from './jetx-engine.service';
export declare class JetXGateway implements OnGatewayInit {
    private jetxEngine;
    private jwtService;
    server: Server;
    private logger;
    constructor(jetxEngine: JetXEngineService, jwtService: JwtService);
    afterInit(server: Server): void;
    private getUserId;
    private getUsername;
    handlePlaceBet(client: Socket, data: {
        amount: number;
        autoCashout?: number;
        betSlot: number;
    }): Promise<{
        success: boolean;
        message: string;
        bet?: any;
    }>;
    handleCashout(client: Socket, data: {
        betSlot: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    handleJoinGame(client: Socket): {
        success: boolean;
    };
}
