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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LudoEngineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const COLOR_START = { RED: 0, GREEN: 13, YELLOW: 26, BLUE: 39 };
const COLOR_ORDER_2P = ['RED', 'BLUE'];
const COLOR_ORDER_4P = ['RED', 'BLUE', 'YELLOW', 'GREEN'];
const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];
const BOT_NAMES = [
    'Ravi_K', 'Priya_S', 'Amit_22', 'Sneha_M', 'Arjun_P', 'Divya_R', 'Karan_J',
    'Neha_99', 'Vikram_D', 'Pooja_L', 'Rahul_T', 'Anita_G', 'Suresh_B', 'Meena_V',
    'Rohit_N', 'Kavita_C', 'Deepak_H', 'Lucky_77', 'King_Bet', 'Pro_Play',
    'HighRoll', 'StarBet', 'MegaWin', 'Golden_7', 'BetKing1', 'WinnerX',
    'TopGun22', 'FastBet', 'MoneyM', 'AllIn_99', 'JackPot', 'SkyHigh',
];
const ENTRY_FEES = [10, 50, 100, 200, 500];
let LudoEngineService = class LudoEngineService {
    constructor(prisma, walletService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.logger = new common_1.Logger('LudoEngine');
        this.rooms = new Map();
        this.broadcastToRoomFn = null;
        this.sendToUserFn = null;
        this.matchmakingTimers = new Map();
    }
    async onModuleInit() {
        const staleRooms = await this.prisma.ludoRoom.findMany({
            where: { status: { in: ['WAITING', 'PLAYING'] } },
            include: { players: true },
        });
        for (const room of staleRooms) {
            for (const player of room.players) {
                if (player.userId && !player.isBot) {
                    try {
                        await this.walletService.credit(player.userId, Number(room.entryFee), 'BET_REFUND', room.id, 'Ludo room expired (server restart)');
                        this.logger.log(`Refunded ${room.entryFee} to ${player.playerName} for stale room ${room.id}`);
                    }
                    catch { }
                }
            }
        }
        if (staleRooms.length > 0) {
            await this.prisma.ludoPlayer.deleteMany({ where: { room: { status: { in: ['WAITING', 'PLAYING'] } } } });
            await this.prisma.ludoRoom.updateMany({
                where: { status: { in: ['WAITING', 'PLAYING'] } },
                data: { status: 'FINISHED' },
            });
            this.logger.log(`Cleaned up ${staleRooms.length} stale Ludo rooms on startup`);
        }
    }
    setBroadcast(broadcastToRoom, sendToUser) {
        this.broadcastToRoomFn = broadcastToRoom;
        this.sendToUserFn = sendToUser;
    }
    broadcastToRoom(roomId, event, data) {
        if (this.broadcastToRoomFn)
            this.broadcastToRoomFn(roomId, event, data);
    }
    sendToUser(userId, event, data) {
        if (this.sendToUserFn)
            this.sendToUserFn(userId, event, data);
    }
    async findOrCreateRoom(userId, username, mode, entryFee) {
        if (!ENTRY_FEES.includes(entryFee))
            return { roomId: '', error: 'Invalid entry fee' };
        if (mode !== '2P' && mode !== '4P')
            return { roomId: '', error: 'Invalid mode' };
        const existing = await this.prisma.ludoPlayer.findFirst({
            where: { userId, room: { status: { in: ['WAITING', 'PLAYING'] } } },
            include: { room: true },
        });
        if (existing)
            return { roomId: existing.roomId };
        try {
            await this.walletService.debit(userId, entryFee, 'BET_PLACE', `ludo-${mode}-${entryFee}`);
        }
        catch {
            return { roomId: '', error: 'Insufficient balance' };
        }
        const waitingRoom = await this.prisma.ludoRoom.findFirst({
            where: { mode, entryFee, status: 'WAITING' },
            include: { players: true },
        });
        const maxPlayers = mode === '2P' ? 2 : 4;
        if (waitingRoom && waitingRoom.players.length < maxPlayers) {
            const colorOrder = mode === '2P' ? COLOR_ORDER_2P : COLOR_ORDER_4P;
            const usedColors = waitingRoom.players.map(p => p.color);
            const nextColor = colorOrder.find(c => !usedColors.includes(c));
            await this.prisma.ludoPlayer.create({
                data: {
                    roomId: waitingRoom.id,
                    userId,
                    playerName: username,
                    color: nextColor,
                    isBot: false,
                },
            });
            const updatedRoom = await this.prisma.ludoRoom.findUnique({
                where: { id: waitingRoom.id },
                include: { players: true },
            });
            if (updatedRoom && updatedRoom.players.length >= maxPlayers) {
                this.startGame(updatedRoom.id);
            }
            else {
                this.startMatchmakingTimer(waitingRoom.id, mode);
            }
            return { roomId: waitingRoom.id };
        }
        const colorOrder = mode === '2P' ? COLOR_ORDER_2P : COLOR_ORDER_4P;
        const room = await this.prisma.ludoRoom.create({
            data: {
                mode,
                entryFee,
                status: 'WAITING',
            },
        });
        await this.prisma.ludoPlayer.create({
            data: {
                roomId: room.id,
                userId,
                playerName: username,
                color: colorOrder[0],
                isBot: false,
            },
        });
        this.startMatchmakingTimer(room.id, mode);
        this.logger.log(`Room ${room.id} created: ${mode} ${entryFee} coins by ${username}`);
        return { roomId: room.id };
    }
    startMatchmakingTimer(roomId, mode) {
        const existing = this.matchmakingTimers.get(roomId);
        if (existing)
            clearTimeout(existing);
        const timer = setTimeout(async () => {
            try {
                const room = await this.prisma.ludoRoom.findUnique({
                    where: { id: roomId },
                    include: { players: true },
                });
                if (!room || room.status !== 'WAITING')
                    return;
                const maxPlayers = mode === '2P' ? 2 : 4;
                const colorOrder = mode === '2P' ? COLOR_ORDER_2P : COLOR_ORDER_4P;
                const usedColors = room.players.map(p => p.color);
                const usedNames = room.players.map(p => p.playerName);
                while (room.players.length < maxPlayers) {
                    const nextColor = colorOrder.find(c => !usedColors.includes(c));
                    usedColors.push(nextColor);
                    let botName;
                    do {
                        botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
                    } while (usedNames.includes(botName));
                    usedNames.push(botName);
                    await this.prisma.ludoPlayer.create({
                        data: {
                            roomId,
                            userId: null,
                            playerName: botName,
                            color: nextColor,
                            isBot: true,
                        },
                    });
                    room.players.push({ color: nextColor, playerName: botName, isBot: true });
                }
                this.logger.log(`Room ${roomId}: filled with bots, starting game`);
                await this.startGame(roomId);
            }
            catch (err) {
                this.logger.error(`Matchmaking timer error for room ${roomId}: ${err}`);
            }
        }, 15000);
        this.matchmakingTimers.set(roomId, timer);
    }
    async startGame(roomId) {
        const room = await this.prisma.ludoRoom.findUnique({
            where: { id: roomId },
            include: { players: true },
        });
        if (!room)
            return;
        const players = room.players.map(p => ({
            id: p.id,
            userId: p.userId,
            name: p.playerName,
            color: p.color,
            isBot: p.isBot,
            tokens: [{ pos: -1 }, { pos: -1 }, { pos: -1 }, { pos: -1 }],
            finishOrder: 0,
        }));
        const gameState = {
            players,
            currentTurn: 0,
            diceValue: 0,
            diceRolled: false,
            consecutiveSixes: 0,
            phase: 'PLAYING',
            turnTimer: 15,
            finishedCount: 0,
            lastMove: null,
        };
        await this.prisma.ludoRoom.update({
            where: { id: roomId },
            data: {
                status: 'PLAYING',
                gameState: JSON.stringify(gameState),
            },
        });
        const roomData = {
            roomId,
            mode: room.mode,
            entryFee: Number(room.entryFee),
            gameState,
        };
        this.rooms.set(roomId, roomData);
        this.broadcastToRoom(roomId, 'ludo:start', {
            roomId,
            mode: room.mode,
            entryFee: Number(room.entryFee),
            gameState: this.sanitizeStateForPlayers(gameState),
        });
        this.logger.log(`Game started: Room ${roomId} (${room.mode})`);
        this.startTurnTimer(roomId);
        if (gameState.players[0].isBot) {
            setTimeout(() => this.botPlay(roomId), 1000 + Math.random() * 1500);
        }
    }
    async rollDice(roomId, userId) {
        const roomData = this.rooms.get(roomId);
        if (!roomData)
            return { error: 'Room not found' };
        const gs = roomData.gameState;
        if (gs.phase !== 'PLAYING')
            return { error: 'Game not in progress' };
        if (gs.diceRolled)
            return { error: 'Already rolled' };
        const currentPlayer = gs.players[gs.currentTurn];
        if (currentPlayer.isBot)
            return { error: 'Not your turn' };
        if (currentPlayer.userId !== userId)
            return { error: 'Not your turn' };
        const dice = this.rollDiceValue(roomData, false);
        gs.diceValue = dice;
        gs.diceRolled = true;
        if (dice === 6) {
            gs.consecutiveSixes++;
            if (gs.consecutiveSixes >= 3) {
                this.broadcastToRoom(roomId, 'ludo:dice', { roomId, dice, tripleSix: true, playerIdx: gs.currentTurn });
                gs.consecutiveSixes = 0;
                gs.diceRolled = false;
                this.nextTurn(roomId);
                return {};
            }
        }
        else {
            gs.consecutiveSixes = 0;
        }
        const validMoves = this.getValidMoves(gs, gs.currentTurn, dice);
        this.broadcastToRoom(roomId, 'ludo:dice', {
            roomId,
            dice,
            playerIdx: gs.currentTurn,
            validMoves: validMoves.map(m => m.tokenIdx),
        });
        if (validMoves.length === 0) {
            setTimeout(() => {
                gs.diceRolled = false;
                this.nextTurn(roomId);
            }, 1000);
        }
        else if (validMoves.length === 1) {
            setTimeout(() => this.executeMove(roomId, validMoves[0].tokenIdx), 500);
        }
        return {};
    }
    rollDiceValue(roomData, isBot) {
        return Math.floor(Math.random() * 6) + 1;
    }
    async moveToken(roomId, userId, tokenIdx) {
        const roomData = this.rooms.get(roomId);
        if (!roomData)
            return { error: 'Room not found' };
        const gs = roomData.gameState;
        if (gs.phase !== 'PLAYING')
            return { error: 'Game not in progress' };
        if (!gs.diceRolled)
            return { error: 'Roll dice first' };
        const currentPlayer = gs.players[gs.currentTurn];
        if (currentPlayer.userId !== userId)
            return { error: 'Not your turn' };
        return this.executeMove(roomId, tokenIdx);
    }
    executeMove(roomId, tokenIdx) {
        const roomData = this.rooms.get(roomId);
        if (!roomData)
            return { error: 'Room not found' };
        const gs = roomData.gameState;
        const player = gs.players[gs.currentTurn];
        const dice = gs.diceValue;
        const validMoves = this.getValidMoves(gs, gs.currentTurn, dice);
        const move = validMoves.find(m => m.tokenIdx === tokenIdx);
        if (!move)
            return { error: 'Invalid move' };
        const token = player.tokens[tokenIdx];
        const fromPos = token.pos;
        token.pos = move.targetPos;
        let captured = false;
        if (move.targetPos >= 0 && move.targetPos <= 51) {
            const globalTarget = this.toGlobalPosition(move.targetPos, player.color);
            if (!SAFE_POSITIONS.includes(globalTarget)) {
                for (let pi = 0; pi < gs.players.length; pi++) {
                    if (pi === gs.currentTurn)
                        continue;
                    const other = gs.players[pi];
                    if (other.finishOrder > 0)
                        continue;
                    for (const ot of other.tokens) {
                        if (ot.pos >= 0 && ot.pos <= 51) {
                            const otherGlobal = this.toGlobalPosition(ot.pos, other.color);
                            if (otherGlobal === globalTarget) {
                                ot.pos = -1;
                                captured = true;
                            }
                        }
                    }
                }
            }
        }
        gs.lastMove = { playerIdx: gs.currentTurn, tokenIdx, from: fromPos, to: move.targetPos, captured };
        if (player.tokens.every(t => t.pos === 57)) {
            gs.finishedCount++;
            player.finishOrder = gs.finishedCount;
            this.logger.log(`Room ${roomId}: ${player.name} finished in position ${gs.finishedCount}`);
        }
        const mode = roomData.mode;
        const totalPlayers = mode === '2P' ? 2 : 4;
        const activePlayers = gs.players.filter(p => p.finishOrder === 0).length;
        if (mode === '2P' && gs.finishedCount >= 1) {
            const loser = gs.players.find(p => p.finishOrder === 0);
            loser.finishOrder = 2;
            gs.phase = 'FINISHED';
            this.broadcastToRoom(roomId, 'ludo:move', { roomId, gameState: this.sanitizeStateForPlayers(gs) });
            this.endGame(roomId);
            return {};
        }
        else if (mode === '4P' && activePlayers <= 1) {
            const lastPlayer = gs.players.find(p => p.finishOrder === 0);
            if (lastPlayer) {
                gs.finishedCount++;
                lastPlayer.finishOrder = gs.finishedCount;
            }
            gs.phase = 'FINISHED';
            this.broadcastToRoom(roomId, 'ludo:move', { roomId, gameState: this.sanitizeStateForPlayers(gs) });
            this.endGame(roomId);
            return {};
        }
        this.broadcastToRoom(roomId, 'ludo:move', { roomId, gameState: this.sanitizeStateForPlayers(gs) });
        gs.diceRolled = false;
        if (dice === 6 || captured) {
            this.startTurnTimer(roomId);
            if (player.isBot && player.finishOrder === 0) {
                setTimeout(() => this.botPlay(roomId), 800 + Math.random() * 1200);
            }
        }
        else {
            this.nextTurn(roomId);
        }
        this.saveState(roomId);
        return {};
    }
    getValidMoves(gs, playerIdx, dice) {
        const player = gs.players[playerIdx];
        if (player.finishOrder > 0)
            return [];
        const moves = [];
        for (let i = 0; i < 4; i++) {
            const token = player.tokens[i];
            if (token.pos === -1) {
                if (dice === 6) {
                    moves.push({ tokenIdx: i, targetPos: 0 });
                }
            }
            else if (token.pos === 57) {
                continue;
            }
            else {
                const newPos = token.pos + dice;
                if (newPos <= 57) {
                    const targetGlobal = newPos <= 51 ? this.toGlobalPosition(newPos, player.color) : newPos;
                    let blocked = false;
                    for (let j = 0; j < 4; j++) {
                        if (j === i)
                            continue;
                        const other = player.tokens[j];
                        if (other.pos === newPos) {
                            blocked = true;
                            break;
                        }
                    }
                    if (!blocked) {
                        moves.push({ tokenIdx: i, targetPos: newPos });
                    }
                }
            }
        }
        return moves;
    }
    toGlobalPosition(localPos, color) {
        if (localPos > 51)
            return localPos + 100;
        return (localPos + COLOR_START[color]) % 52;
    }
    nextTurn(roomId) {
        const roomData = this.rooms.get(roomId);
        if (!roomData)
            return;
        const gs = roomData.gameState;
        if (gs.phase !== 'PLAYING')
            return;
        gs.consecutiveSixes = 0;
        let nextIdx = (gs.currentTurn + 1) % gs.players.length;
        let attempts = 0;
        while (gs.players[nextIdx].finishOrder > 0 && attempts < gs.players.length) {
            nextIdx = (nextIdx + 1) % gs.players.length;
            attempts++;
        }
        gs.currentTurn = nextIdx;
        gs.diceRolled = false;
        gs.turnTimer = 15;
        this.broadcastToRoom(roomId, 'ludo:turn', {
            roomId,
            currentTurn: nextIdx,
            playerName: gs.players[nextIdx].name,
            playerColor: gs.players[nextIdx].color,
        });
        this.startTurnTimer(roomId);
        if (gs.players[nextIdx].isBot) {
            setTimeout(() => this.botPlay(roomId), 800 + Math.random() * 1500);
        }
    }
    startTurnTimer(roomId) {
        const roomData = this.rooms.get(roomId);
        if (!roomData)
            return;
        if (roomData.turnTimeout)
            clearTimeout(roomData.turnTimeout);
        roomData.turnTimeout = setTimeout(() => {
            const rd = this.rooms.get(roomId);
            if (!rd || rd.gameState.phase !== 'PLAYING')
                return;
            const gs = rd.gameState;
            const player = gs.players[gs.currentTurn];
            if (!player.isBot && !gs.diceRolled) {
                const dice = Math.floor(Math.random() * 6) + 1;
                gs.diceValue = dice;
                gs.diceRolled = true;
                const validMoves = this.getValidMoves(gs, gs.currentTurn, dice);
                this.broadcastToRoom(roomId, 'ludo:dice', {
                    roomId, dice, playerIdx: gs.currentTurn,
                    validMoves: validMoves.map(m => m.tokenIdx), autoRoll: true,
                });
                if (validMoves.length > 0) {
                    setTimeout(() => this.executeMove(roomId, validMoves[0].tokenIdx), 500);
                }
                else {
                    gs.diceRolled = false;
                    this.nextTurn(roomId);
                }
            }
            else if (!player.isBot && gs.diceRolled) {
                const validMoves = this.getValidMoves(gs, gs.currentTurn, gs.diceValue);
                if (validMoves.length > 0) {
                    this.executeMove(roomId, validMoves[0].tokenIdx);
                }
                else {
                    gs.diceRolled = false;
                    this.nextTurn(roomId);
                }
            }
        }, 16000);
    }
    async botPlay(roomId) {
        const roomData = this.rooms.get(roomId);
        if (!roomData)
            return;
        const gs = roomData.gameState;
        if (gs.phase !== 'PLAYING')
            return;
        const player = gs.players[gs.currentTurn];
        if (!player.isBot)
            return;
        if (gs.diceRolled)
            return;
        let dice;
        if (roomData.mode === '4P') {
            const r = Math.random();
            if (r < 0.30)
                dice = 6;
            else if (r < 0.55)
                dice = 5;
            else
                dice = Math.floor(Math.random() * 4) + 1;
        }
        else {
            const r = Math.random();
            if (r < 0.22)
                dice = 6;
            else if (r < 0.40)
                dice = 5;
            else
                dice = Math.floor(Math.random() * 4) + 1;
        }
        gs.diceValue = dice;
        gs.diceRolled = true;
        if (dice === 6) {
            gs.consecutiveSixes++;
            if (gs.consecutiveSixes >= 3) {
                this.broadcastToRoom(roomId, 'ludo:dice', { roomId, dice, tripleSix: true, playerIdx: gs.currentTurn });
                gs.consecutiveSixes = 0;
                gs.diceRolled = false;
                this.nextTurn(roomId);
                return;
            }
        }
        else {
            gs.consecutiveSixes = 0;
        }
        const validMoves = this.getValidMoves(gs, gs.currentTurn, dice);
        this.broadcastToRoom(roomId, 'ludo:dice', {
            roomId, dice, playerIdx: gs.currentTurn,
            validMoves: validMoves.map(m => m.tokenIdx),
        });
        if (validMoves.length === 0) {
            setTimeout(() => {
                gs.diceRolled = false;
                this.nextTurn(roomId);
            }, 800);
            return;
        }
        const chosenMove = this.chooseBestMove(gs, gs.currentTurn, dice, validMoves, roomData.mode);
        setTimeout(() => {
            this.executeMove(roomId, chosenMove.tokenIdx);
        }, 600 + Math.random() * 800);
    }
    chooseBestMove(gs, playerIdx, dice, moves, mode) {
        const player = gs.players[playerIdx];
        let bestMove = moves[0];
        let bestScore = -Infinity;
        for (const move of moves) {
            let score = 0;
            const token = player.tokens[move.tokenIdx];
            if (token.pos === -1 && move.targetPos === 0) {
                score += 50;
            }
            if (move.targetPos > token.pos) {
                score += move.targetPos * 2;
            }
            if (move.targetPos === 57) {
                score += 200;
            }
            if (move.targetPos >= 52 && token.pos < 52) {
                score += 80;
            }
            if (move.targetPos >= 0 && move.targetPos <= 51) {
                const globalTarget = this.toGlobalPosition(move.targetPos, player.color);
                if (!SAFE_POSITIONS.includes(globalTarget)) {
                    for (let pi = 0; pi < gs.players.length; pi++) {
                        if (pi === playerIdx)
                            continue;
                        const other = gs.players[pi];
                        for (const ot of other.tokens) {
                            if (ot.pos >= 0 && ot.pos <= 51) {
                                if (this.toGlobalPosition(ot.pos, other.color) === globalTarget) {
                                    score += 150;
                                }
                            }
                        }
                    }
                }
            }
            if (move.targetPos >= 0 && move.targetPos <= 51) {
                const globalTarget = this.toGlobalPosition(move.targetPos, player.color);
                if (SAFE_POSITIONS.includes(globalTarget)) {
                    score += 20;
                }
            }
            if (mode === '4P') {
                score *= 1.2;
                if (token.pos >= 0 && token.pos === Math.max(...player.tokens.filter(t => t.pos >= 0).map(t => t.pos))) {
                    score += 30;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    }
    async endGame(roomId) {
        const roomData = this.rooms.get(roomId);
        if (!roomData)
            return;
        const gs = roomData.gameState;
        if (roomData.turnTimeout)
            clearTimeout(roomData.turnTimeout);
        const entryFee = roomData.entryFee;
        const results = [];
        const sorted = [...gs.players].sort((a, b) => {
            if (a.finishOrder === 0)
                return 1;
            if (b.finishOrder === 0)
                return -1;
            return a.finishOrder - b.finishOrder;
        });
        for (const p of sorted) {
            let payout = 0;
            if (roomData.mode === '2P') {
                if (p.finishOrder === 1)
                    payout = entryFee * 1.5;
            }
            else {
                if (p.finishOrder === 1)
                    payout = entryFee * 1.8;
                else if (p.finishOrder === 2)
                    payout = entryFee * 1.4;
            }
            results.push({
                name: p.name,
                color: p.color,
                position: p.finishOrder,
                payout,
                isBot: p.isBot,
                userId: p.userId,
            });
            if (payout > 0 && p.userId) {
                try {
                    await this.walletService.credit(p.userId, payout, 'BET_WIN', roomId);
                    this.sendToUser(p.userId, 'notification', {
                        type: 'success',
                        message: `Ludo: You won ${payout} coins! (${p.finishOrder === 1 ? '1st' : '2nd'} place)`,
                    });
                }
                catch (e) {
                    this.logger.error(`Failed to credit ${payout} to ${p.userId}: ${e}`);
                }
            }
            await this.prisma.ludoPlayer.updateMany({
                where: { roomId, color: p.color },
                data: { position: p.finishOrder, payout },
            });
        }
        const winner = sorted[0];
        const second = sorted.length >= 2 ? sorted[1] : null;
        await this.prisma.ludoRoom.update({
            where: { id: roomId },
            data: {
                status: 'FINISHED',
                winnerId: winner.userId,
                secondId: second?.userId || null,
                gameState: JSON.stringify(gs),
            },
        });
        this.broadcastToRoom(roomId, 'ludo:finish', {
            roomId,
            results,
            mode: roomData.mode,
            entryFee,
        });
        this.logger.log(`Game finished: Room ${roomId} — Winner: ${winner.name}`);
        setTimeout(() => {
            this.rooms.delete(roomId);
        }, 60000);
    }
    async saveState(roomId) {
        const roomData = this.rooms.get(roomId);
        if (!roomData)
            return;
        await this.prisma.ludoRoom.update({
            where: { id: roomId },
            data: { gameState: JSON.stringify(roomData.gameState) },
        }).catch(() => { });
    }
    sanitizeStateForPlayers(gs) {
        return {
            players: gs.players.map(p => ({
                name: p.name,
                color: p.color,
                tokens: p.tokens,
                finishOrder: p.finishOrder,
            })),
            currentTurn: gs.currentTurn,
            diceValue: gs.diceValue,
            diceRolled: gs.diceRolled,
            phase: gs.phase,
            turnTimer: gs.turnTimer,
            finishedCount: gs.finishedCount,
            lastMove: gs.lastMove,
        };
    }
    sanitizeStateForAdmin(gs) {
        return {
            ...this.sanitizeStateForPlayers(gs),
            players: gs.players.map(p => ({
                name: p.name,
                color: p.color,
                tokens: p.tokens,
                finishOrder: p.finishOrder,
                isBot: p.isBot,
                userId: p.userId,
            })),
        };
    }
    getRoomState(roomId) {
        const roomData = this.rooms.get(roomId);
        if (!roomData)
            return null;
        return {
            roomId,
            mode: roomData.mode,
            entryFee: roomData.entryFee,
            gameState: this.sanitizeStateForPlayers(roomData.gameState),
        };
    }
    getActiveRooms() {
        const rooms = [];
        for (const [id, data] of this.rooms) {
            rooms.push({
                roomId: id,
                mode: data.mode,
                entryFee: data.entryFee,
                phase: data.gameState.phase,
                players: data.gameState.players.map(p => ({
                    name: p.name,
                    color: p.color,
                    isBot: p.isBot,
                    finishOrder: p.finishOrder,
                })),
            });
        }
        return rooms;
    }
};
exports.LudoEngineService = LudoEngineService;
exports.LudoEngineService = LudoEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService])
], LudoEngineService);
//# sourceMappingURL=ludo-engine.service.js.map