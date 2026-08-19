// ============================================
// Game Engine Gateway (Socket.IO)
// Thin gateway layer — delegates all logic to GameEngineService
// ============================================

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GameEngineService } from './game-engine.service';

// Map userId -> Set of socket IDs
const userSockets = new Map<string, Set<string>>();
// Map socketId -> userId
const socketUsers = new Map<string, string>();

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class GameEngineGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('GameGateway');
  private onlineCount = 0;

  constructor(
    private gameEngine: GameEngineService,
    private jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Give the game engine the ability to broadcast
    this.gameEngine.setBroadcast(
      // Broadcast to all
      (event: string, data: any) => {
        this.server.emit(event, data);
      },
      // Send to specific user
      (userId: string, event: string, data: any) => {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.forEach((socketId) => {
            this.server.to(socketId).emit(event, data);
          });
        }
      },
    );
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        const payload = this.jwtService.verify(token);
        const userId = payload.sub;

        // Track this socket
        socketUsers.set(client.id, userId);
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(client.id);
      }

      this.onlineCount++;
      this.server.emit('online:count', { count: this.onlineCount });

      // Send current game state to the new connection
      const state = this.gameEngine.getGameState();
      client.emit('game:state', state);
    } catch (error) {
      // Allow unauthenticated connections (spectators)
      this.onlineCount++;
      this.server.emit('online:count', { count: this.onlineCount });
      const state = this.gameEngine.getGameState();
      client.emit('game:state', state);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = socketUsers.get(client.id);
    if (userId) {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
      socketUsers.delete(client.id);
    }

    this.onlineCount = Math.max(0, this.onlineCount - 1);
    this.server.emit('online:count', { count: this.onlineCount });
  }

  @SubscribeMessage('bet:place')
  async handlePlaceBet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { amount: number; autoCashout?: number; betSlot: number },
  ) {
    const userId = socketUsers.get(client.id);
    if (!userId) {
      return { success: false, message: 'Authentication required' };
    }

    // Get username from JWT
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
    let username = 'Unknown';
    try {
      const payload = this.jwtService.verify(token);
      username = payload.username;
    } catch {}

    const result = await this.gameEngine.placeBet(
      userId,
      username,
      data.amount,
      data.betSlot,
      data.autoCashout,
    );

    return result;
  }

  @SubscribeMessage('bet:cashout')
  async handleCashout(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { betSlot: number },
  ) {
    const userId = socketUsers.get(client.id);
    if (!userId) {
      return { success: false, message: 'Authentication required' };
    }

    const result = await this.gameEngine.processCashout(userId, data.betSlot);
    return result;
  }

  @SubscribeMessage('game:join')
  handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameType: string },
  ) {
    // Send current game state
    const state = this.gameEngine.getGameState();
    client.emit('game:state', state);
    return { success: true };
  }

  // Helper: get online count
  getOnlineCount(): number {
    return this.onlineCount;
  }

  getOnlineUsers(): string[] {
    return Array.from(userSockets.keys());
  }
}
