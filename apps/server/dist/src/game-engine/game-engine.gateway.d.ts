import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GameEngineService } from './game-engine.service';
export declare class GameEngineGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private gameEngine;
    private jwtService;
    server: Server;
    private logger;
    private onlineCount;
    constructor(gameEngine: GameEngineService, jwtService: JwtService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
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
        cashout?: any;
    }>;
    handleJoinGame(client: Socket, data: {
        gameType: string;
    }): {
        success: boolean;
    };
    getOnlineCount(): number;
    getOnlineUsers(): string[];
}
