// ============================================
// Ludo WebSocket Gateway
// Real-time game communication
// ============================================

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { LudoEngineService } from './ludo-engine.service';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class LudoGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('LudoGateway');
  // Track which socket is in which room
  private socketRooms: Map<string, string> = new Map(); // socketId -> roomId

  constructor(
    private ludoEngine: LudoEngineService,
    private jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Ludo Gateway initialized');

    this.ludoEngine.setBroadcast(
      // Broadcast to room
      (roomId: string, event: string, data: any) => {
        this.server.to(`ludo:${roomId}`).emit(event, data);
      },
      // Send to specific user
      (userId: string, event: string, data: any) => {
        const sockets = this.server.sockets.sockets;
        for (const [socketId, socket] of sockets) {
          try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
            if (token) {
              const payload = this.jwtService.verify(token);
              if (payload.sub === userId) {
                socket.emit(event, data);
              }
            }
          } catch {}
        }
      },
    );
  }

  private getUserId(client: Socket): string | null {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return null;
      const payload = this.jwtService.verify(token);
      return payload.sub;
    } catch {
      return null;
    }
  }

  private getUsername(client: Socket): string {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return 'Unknown';
      const payload = this.jwtService.verify(token);
      return payload.username || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  @SubscribeMessage('ludo:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { mode: string; entryFee: number },
  ) {
    const userId = this.getUserId(client);
    if (!userId) return { error: 'Not authenticated' };
    const username = this.getUsername(client);

    const result = await this.ludoEngine.findOrCreateRoom(userId, username, data.mode, data.entryFee);
    if (result.error) {
      client.emit('ludo:error', { message: result.error });
      return;
    }

    // Join the socket.io room
    client.join(`ludo:${result.roomId}`);
    this.socketRooms.set(client.id, result.roomId);

    client.emit('ludo:joined', {
      roomId: result.roomId,
      mode: data.mode,
      entryFee: data.entryFee,
    });

    // If game is already playing, redirect the client immediately
    const state = this.ludoEngine.getRoomState(result.roomId);
    if (state && state.gameState.phase === 'PLAYING') {
      client.emit('ludo:start', {
        roomId: result.roomId,
        mode: state.mode,
        entryFee: state.entryFee,
        gameState: state.gameState,
      });
    }

    this.logger.log(`${username} joined room ${result.roomId}`);
  }

  @SubscribeMessage('ludo:roll')
  async handleRoll(@ConnectedSocket() client: Socket) {
    const userId = this.getUserId(client);
    if (!userId) return;

    const roomId = this.socketRooms.get(client.id);
    if (!roomId) return;

    const result = await this.ludoEngine.rollDice(roomId, userId);
    if (result.error) {
      client.emit('ludo:error', { message: result.error });
    }
  }

  @SubscribeMessage('ludo:move')
  async handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tokenIdx: number },
  ) {
    const userId = this.getUserId(client);
    if (!userId) return;

    const roomId = this.socketRooms.get(client.id);
    if (!roomId) return;

    const result = await this.ludoEngine.moveToken(roomId, userId, data.tokenIdx);
    if (result.error) {
      client.emit('ludo:error', { message: result.error });
    }
  }

  @SubscribeMessage('ludo:getState')
  async handleGetState(@ConnectedSocket() client: Socket) {
    const roomId = this.socketRooms.get(client.id);
    if (!roomId) return;

    const state = this.ludoEngine.getRoomState(roomId);
    if (state) {
      client.emit('ludo:state', state);
    }
  }

  @SubscribeMessage('ludo:reconnect')
  async handleReconnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = this.getUserId(client);
    if (!userId) return;

    const roomId = data.roomId;
    if (!roomId) return;

    // Join socket.io room
    client.join(`ludo:${roomId}`);
    this.socketRooms.set(client.id, roomId);

    // Send current state
    const state = this.ludoEngine.getRoomState(roomId);
    if (state) {
      client.emit('ludo:state', state);
      this.logger.log(`Player reconnected to room ${roomId}`);
    } else {
      client.emit('ludo:error', { message: 'Room not found or game ended' });
    }
  }
}
