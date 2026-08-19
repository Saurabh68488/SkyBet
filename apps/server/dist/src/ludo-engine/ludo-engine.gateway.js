"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LudoGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const ludo_engine_service_1 = require("./ludo-engine.service");
let LudoGateway = class LudoGateway {
    constructor(ludoEngine, jwtService) {
        this.ludoEngine = ludoEngine;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger('LudoGateway');
        this.socketRooms = new Map();
    }
    afterInit(server) {
        this.logger.log('Ludo Gateway initialized');
        this.ludoEngine.setBroadcast((roomId, event, data) => {
            this.server.to(`ludo:${roomId}`).emit(event, data);
        }, (userId, event, data) => {
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
                }
                catch { }
            }
        });
    }
    getUserId(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token)
                return null;
            const payload = this.jwtService.verify(token);
            return payload.sub;
        }
        catch {
            return null;
        }
    }
    getUsername(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token)
                return 'Unknown';
            const payload = this.jwtService.verify(token);
            return payload.username || 'Unknown';
        }
        catch {
            return 'Unknown';
        }
    }
    async handleJoin(client, data) {
        const userId = this.getUserId(client);
        if (!userId)
            return { error: 'Not authenticated' };
        const username = this.getUsername(client);
        const result = await this.ludoEngine.findOrCreateRoom(userId, username, data.mode, data.entryFee);
        if (result.error) {
            client.emit('ludo:error', { message: result.error });
            return;
        }
        client.join(`ludo:${result.roomId}`);
        this.socketRooms.set(client.id, result.roomId);
        client.emit('ludo:joined', {
            roomId: result.roomId,
            mode: data.mode,
            entryFee: data.entryFee,
        });
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
    async handleRoll(client) {
        const userId = this.getUserId(client);
        if (!userId)
            return;
        const roomId = this.socketRooms.get(client.id);
        if (!roomId)
            return;
        const result = await this.ludoEngine.rollDice(roomId, userId);
        if (result.error) {
            client.emit('ludo:error', { message: result.error });
        }
    }
    async handleMove(client, data) {
        const userId = this.getUserId(client);
        if (!userId)
            return;
        const roomId = this.socketRooms.get(client.id);
        if (!roomId)
            return;
        const result = await this.ludoEngine.moveToken(roomId, userId, data.tokenIdx);
        if (result.error) {
            client.emit('ludo:error', { message: result.error });
        }
    }
    async handleGetState(client) {
        const roomId = this.socketRooms.get(client.id);
        if (!roomId)
            return;
        const state = this.ludoEngine.getRoomState(roomId);
        if (state) {
            client.emit('ludo:state', state);
        }
    }
    async handleReconnect(client, data) {
        const userId = this.getUserId(client);
        if (!userId)
            return;
        const roomId = data.roomId;
        if (!roomId)
            return;
        client.join(`ludo:${roomId}`);
        this.socketRooms.set(client.id, roomId);
        const state = this.ludoEngine.getRoomState(roomId);
        if (state) {
            client.emit('ludo:state', state);
            this.logger.log(`Player reconnected to room ${roomId}`);
        }
        else {
            client.emit('ludo:error', { message: 'Room not found or game ended' });
        }
    }
};
exports.LudoGateway = LudoGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], LudoGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('ludo:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], LudoGateway.prototype, "handleJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ludo:roll'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], LudoGateway.prototype, "handleRoll", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ludo:move'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], LudoGateway.prototype, "handleMove", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ludo:getState'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], LudoGateway.prototype, "handleGetState", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ludo:reconnect'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], LudoGateway.prototype, "handleReconnect", null);
exports.LudoGateway = LudoGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*', credentials: true },
        transports: ['websocket', 'polling'],
    }),
    __metadata("design:paramtypes", [ludo_engine_service_1.LudoEngineService,
        jwt_1.JwtService])
], LudoGateway);
//# sourceMappingURL=ludo-engine.gateway.js.map