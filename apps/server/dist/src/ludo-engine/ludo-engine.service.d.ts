import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WalletService } from '../wallet/wallet.service';
interface TokenState {
    pos: number;
}
interface PlayerState {
    id: string;
    userId: string | null;
    name: string;
    color: string;
    isBot: boolean;
    tokens: TokenState[];
    finishOrder: number;
}
interface GameState {
    players: PlayerState[];
    currentTurn: number;
    diceValue: number;
    diceRolled: boolean;
    consecutiveSixes: number;
    phase: 'WAITING' | 'PLAYING' | 'FINISHED';
    turnTimer: number;
    finishedCount: number;
    lastMove: {
        playerIdx: number;
        tokenIdx: number;
        from: number;
        to: number;
        captured?: boolean;
    } | null;
}
export declare class LudoEngineService implements OnModuleInit {
    private prisma;
    private walletService;
    private readonly logger;
    private rooms;
    private broadcastToRoomFn;
    private sendToUserFn;
    constructor(prisma: PrismaService, walletService: WalletService);
    onModuleInit(): Promise<void>;
    setBroadcast(broadcastToRoom: (roomId: string, event: string, data: any) => void, sendToUser: (userId: string, event: string, data: any) => void): void;
    private broadcastToRoom;
    private sendToUser;
    findOrCreateRoom(userId: string, username: string, mode: string, entryFee: number): Promise<{
        roomId: string;
        error?: string;
    }>;
    private matchmakingTimers;
    private startMatchmakingTimer;
    startGame(roomId: string): Promise<void>;
    rollDice(roomId: string, userId: string): Promise<{
        error?: string;
    }>;
    private rollDiceValue;
    moveToken(roomId: string, userId: string, tokenIdx: number): Promise<{
        error?: string;
    }>;
    private executeMove;
    private getValidMoves;
    private toGlobalPosition;
    private nextTurn;
    private startTurnTimer;
    private botPlay;
    private chooseBestMove;
    private endGame;
    private saveState;
    sanitizeStateForPlayers(gs: GameState): any;
    sanitizeStateForAdmin(gs: GameState): any;
    getRoomState(roomId: string): any;
    getActiveRooms(): any[];
}
export {};
