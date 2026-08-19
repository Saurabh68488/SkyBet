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
exports.GameEngineGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const game_engine_service_1 = require("./game-engine.service");
const userSockets = new Map();
const socketUsers = new Map();
let GameEngineGateway = class GameEngineGateway {
    constructor(gameEngine, jwtService) {
        this.gameEngine = gameEngine;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger('GameGateway');
        this.onlineCount = 0;
    }
    afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
        this.gameEngine.setBroadcast((event, data) => {
            this.server.emit(event, data);
        }, (userId, event, data) => {
            const sockets = userSockets.get(userId);
            if (sockets) {
                sockets.forEach((socketId) => {
                    this.server.to(socketId).emit(event, data);
                });
            }
        });
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (token) {
                const payload = this.jwtService.verify(token);
                const userId = payload.sub;
                socketUsers.set(client.id, userId);
                if (!userSockets.has(userId)) {
                    userSockets.set(userId, new Set());
                }
                userSockets.get(userId).add(client.id);
            }
            this.onlineCount++;
            this.server.emit('online:count', { count: this.onlineCount });
            const state = this.gameEngine.getGameState();
            client.emit('game:state', state);
        }
        catch (error) {
            this.onlineCount++;
            this.server.emit('online:count', { count: this.onlineCount });
            const state = this.gameEngine.getGameState();
            client.emit('game:state', state);
        }
    }
    handleDisconnect(client) {
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
    async handlePlaceBet(client, data) {
        const userId = socketUsers.get(client.id);
        if (!userId) {
            return { success: false, message: 'Authentication required' };
        }
        const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
        let username = 'Unknown';
        try {
            const payload = this.jwtService.verify(token);
            username = payload.username;
        }
        catch { }
        const result = await this.gameEngine.placeBet(userId, username, data.amount, data.betSlot, data.autoCashout);
        return result;
    }
    async handleCashout(client, data) {
        const userId = socketUsers.get(client.id);
        if (!userId) {
            return { success: false, message: 'Authentication required' };
        }
        const result = await this.gameEngine.processCashout(userId, data.betSlot);
        return result;
    }
    handleJoinGame(client, data) {
        const state = this.gameEngine.getGameState();
        client.emit('game:state', state);
        return { success: true };
    }
    getOnlineCount() {
        return this.onlineCount;
    }
    getOnlineUsers() {
        return Array.from(userSockets.keys());
    }
};
exports.GameEngineGateway = GameEngineGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameEngineGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('bet:place'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameEngineGateway.prototype, "handlePlaceBet", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('bet:cashout'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameEngineGateway.prototype, "handleCashout", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], GameEngineGateway.prototype, "handleJoinGame", null);
exports.GameEngineGateway = GameEngineGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    }),
    __metadata("design:paramtypes", [game_engine_service_1.GameEngineService,
        jwt_1.JwtService])
], GameEngineGateway);
//# sourceMappingURL=game-engine.gateway.js.map