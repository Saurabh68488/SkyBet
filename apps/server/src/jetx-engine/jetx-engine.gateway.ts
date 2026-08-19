// ============================================
// JetX WebSocket Gateway
// Separate from Aviation gateway — uses jetx: events
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
import { JetXEngineService } from './jetx-engine.service';

// Reuse the same socket connections — just different event names
// We access userId from the main gateway's socket tracking via handshake

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class JetXGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('JetXGateway');

  constructor(
    private jetxEngine: JetXEngineService,
    private jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('JetX Gateway initialized');

    // Give the JetX engine broadcast capability
    this.jetxEngine.setBroadcast(
      (event: string, data: any) => {
        this.server.emit(event, data);
      },
      (userId: string, event: string, data: any) => {
        // Find sockets for this user
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

    // Send JetX state to new connections
    server.on('connection', (socket: Socket) => {
      const state = this.jetxEngine.getGameState();
      socket.emit('jetx:state', state);
    });
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

  @SubscribeMessage('jetx:bet:place')
  async handlePlaceBet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { amount: number; autoCashout?: number; betSlot: number },
  ) {
    const userId = this.getUserId(client);
    if (!userId) return { success: false, message: 'Authentication required' };
    const username = this.getUsername(client);
    return this.jetxEngine.placeBet(userId, username, data.amount, data.betSlot, data.autoCashout);
  }

  @SubscribeMessage('jetx:bet:cashout')
  async handleCashout(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { betSlot: number },
  ) {
    const userId = this.getUserId(client);
    if (!userId) return { success: false, message: 'Authentication required' };
    return this.jetxEngine.processCashout(userId, data.betSlot);
  }

  @SubscribeMessage('jetx:join')
  handleJoinGame(@ConnectedSocket() client: Socket) {
    const state = this.jetxEngine.getGameState();
    client.emit('jetx:state', state);
    return { success: true };
  }
}
