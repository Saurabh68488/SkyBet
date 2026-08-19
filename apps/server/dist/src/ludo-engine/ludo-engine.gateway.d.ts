import { OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { LudoEngineService } from './ludo-engine.service';
export declare class LudoGateway implements OnGatewayInit {
    private ludoEngine;
    private jwtService;
    server: Server;
    private logger;
    private socketRooms;
    constructor(ludoEngine: LudoEngineService, jwtService: JwtService);
    afterInit(server: Server): void;
    private getUserId;
    private getUsername;
    handleJoin(client: Socket, data: {
        mode: string;
        entryFee: number;
    }): Promise<{
        error: string;
    } | undefined>;
    handleRoll(client: Socket): Promise<void>;
    handleMove(client: Socket, data: {
        tokenIdx: number;
    }): Promise<void>;
    handleGetState(client: Socket): Promise<void>;
    handleReconnect(client: Socket, data: {
        roomId: string;
    }): Promise<void>;
}
