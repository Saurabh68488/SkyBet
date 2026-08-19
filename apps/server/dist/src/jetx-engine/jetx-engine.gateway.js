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
exports.JetXGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const jetx_engine_service_1 = require("./jetx-engine.service");
let JetXGateway = class JetXGateway {
    constructor(jetxEngine, jwtService) {
        this.jetxEngine = jetxEngine;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger('JetXGateway');
    }
    afterInit(server) {
        this.logger.log('JetX Gateway initialized');
        this.jetxEngine.setBroadcast((event, data) => {
            this.server.emit(event, data);
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
        server.on('connection', (socket) => {
            const state = this.jetxEngine.getGameState();
            socket.emit('jetx:state', state);
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
    async handlePlaceBet(client, data) {
        const userId = this.getUserId(client);
        if (!userId)
            return { success: false, message: 'Authentication required' };
        const username = this.getUsername(client);
        return this.jetxEngine.placeBet(userId, username, data.amount, data.betSlot, data.autoCashout);
    }
    async handleCashout(client, data) {
        const userId = this.getUserId(client);
        if (!userId)
            return { success: false, message: 'Authentication required' };
        return this.jetxEngine.processCashout(userId, data.betSlot);
    }
    handleJoinGame(client) {
        const state = this.jetxEngine.getGameState();
        client.emit('jetx:state', state);
        return { success: true };
    }
};
exports.JetXGateway = JetXGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], JetXGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('jetx:bet:place'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], JetXGateway.prototype, "handlePlaceBet", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('jetx:bet:cashout'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], JetXGateway.prototype, "handleCashout", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('jetx:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], JetXGateway.prototype, "handleJoinGame", null);
exports.JetXGateway = JetXGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*', credentials: true },
        transports: ['websocket', 'polling'],
    }),
    __metadata("design:paramtypes", [jetx_engine_service_1.JetXEngineService,
        jwt_1.JwtService])
], JetXGateway);
//# sourceMappingURL=jetx-engine.gateway.js.map