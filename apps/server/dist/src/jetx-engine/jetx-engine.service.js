"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JetXEngineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const settings_service_1 = require("../settings/settings.service");
const logs_service_1 = require("../logs/logs.service");
const crypto = __importStar(require("crypto"));
let JetXEngineService = class JetXEngineService {
    constructor(prisma, walletService, settingsService, logsService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.settingsService = settingsService;
        this.logsService = logsService;
        this.logger = new common_1.Logger('JetXEngine');
        this.phase = 'WAITING';
        this.currentRoundId = null;
        this.currentRoundNumber = 0;
        this.countdown = 10;
        this.countdownInterval = null;
        this.tickInterval = null;
        this.activeBets = new Map();
        this.nextRoundBets = [];
        this.startTime = 0;
        this.crashPoint = 0;
        this.speed = 0.0001;
        this.broadcastFn = null;
        this.sendToUserFn = null;
        this.history = [];
        this.fakeBets = [];
        this.FAKE_NAMES = [
            'Ace_High', 'JetFan_1', 'Turbo_X', 'Blitz_99', 'NitroB', 'Falcon_7',
            'Storm_R', 'Eagle_22', 'Dash_Pro', 'Rocket_M', 'Phoenix_', 'Viper_K',
            'Bolt_777', 'Striker_', 'Mavrick_', 'Hunter_X', 'Sniper_9', 'Cobra_11',
            'Wolf_Bet', 'Tiger_GO', 'Shark_33', 'Dragon_Z', 'Panther_', 'Raptor_7',
            'Stealth_', 'Nitro_55', 'Blaze_22', 'Inferno_', 'Cyclone_', 'Titan_88',
            'Alpha_BT', 'Bravo_99', 'Delta_77', 'Echo_555', 'Foxtrot_', 'Golf_123',
            'Hotel_BT', 'India_99', 'Juliet_X', 'Kilo_777', 'Lima_BET', 'Mike_PRO',
            'Nova_555', 'Oscar_88', 'Papa_WIN', 'Quebec_1', 'Romeo_BT', 'Sierra_X',
        ];
    }
    async onModuleInit() {
        const recentRounds = await this.prisma.gameRound.findMany({
            where: { status: 'CRASHED', gameType: 'JETX' },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        this.history = recentRounds
            .map((r) => ({
            roundNumber: r.roundNumber,
            crashPoint: Number(r.crashPoint),
            createdAt: r.createdAt.toISOString(),
        }))
            .reverse();
        const lastRound = await this.prisma.gameRound.findFirst({
            where: { gameType: 'JETX' },
            orderBy: { roundNumber: 'desc' },
        });
        this.currentRoundNumber = lastRound ? lastRound.roundNumber : 0;
        this.logger.log('JetX engine initialized');
        setTimeout(() => this.startCountdown(), 5000);
    }
    setBroadcast(broadcastFn, sendToUserFn) {
        this.broadcastFn = broadcastFn;
        this.sendToUserFn = sendToUserFn;
    }
    broadcast(event, data) {
        if (this.broadcastFn)
            this.broadcastFn(event, data);
    }
    sendToUser(userId, event, data) {
        if (this.sendToUserFn)
            this.sendToUserFn(userId, event, data);
    }
    generateCrashPoint() {
        const houseEdge = 0.04;
        const randomBytes = crypto.randomBytes(4);
        const random = randomBytes.readUInt32BE(0) / 0xffffffff;
        if (random < houseEdge)
            return 1.0;
        const crashPoint = Math.floor((1 / (1 - random)) * 100) / 100;
        return Math.min(crashPoint, 1000);
    }
    async startCountdown() {
        this.phase = 'COUNTDOWN';
        this.activeBets.clear();
        const queuedBets = [...this.nextRoundBets];
        this.nextRoundBets = [];
        this.currentRoundNumber++;
        const settings = await this.settingsService.getSettings();
        this.countdown = settings.countdownDuration || 10;
        const forcedRound = await this.prisma.forcedRound.findFirst({
            where: { roundNumber: this.currentRoundNumber, executed: false, gameType: 'JETX' },
        });
        const gameConfig = await this.prisma.gameConfig.findUnique({ where: { gameType: 'JETX' } });
        const minMult = gameConfig ? Number(gameConfig.minMultiplier) : 1.0;
        const maxMult = gameConfig ? Number(gameConfig.maxMultiplier) : 1000.0;
        let crashPoint;
        if (forcedRound) {
            crashPoint = Number(forcedRound.crashPoint);
        }
        else {
            let attempts = 0;
            do {
                crashPoint = this.generateCrashPoint();
                attempts++;
            } while ((crashPoint < minMult || crashPoint > maxMult) && attempts < 100);
            crashPoint = Math.max(minMult, Math.min(maxMult, crashPoint));
            crashPoint = Math.floor(crashPoint * 100) / 100;
        }
        let round;
        try {
            round = await this.prisma.gameRound.create({
                data: {
                    roundNumber: this.currentRoundNumber,
                    gameType: 'JETX',
                    crashPoint,
                    status: 'WAITING',
                    isForced: !!forcedRound,
                },
            });
        }
        catch (e) {
            if (e?.code === 'P2002') {
                const maxRound = await this.prisma.gameRound.findFirst({
                    where: { gameType: 'JETX' },
                    orderBy: { roundNumber: 'desc' },
                });
                this.currentRoundNumber = (maxRound?.roundNumber || 0) + 1;
                this.logger.warn(`Duplicate round detected, jumping to round ${this.currentRoundNumber}`);
                round = await this.prisma.gameRound.create({
                    data: {
                        roundNumber: this.currentRoundNumber,
                        gameType: 'JETX',
                        crashPoint,
                        status: 'WAITING',
                        isForced: !!forcedRound,
                    },
                });
            }
            else {
                throw e;
            }
        }
        this.currentRoundId = round.id;
        this.crashPoint = crashPoint;
        if (forcedRound) {
            await this.prisma.forcedRound.update({
                where: { id: forcedRound.id },
                data: { executed: true },
            });
            this.logger.log(`JetX forced round ${this.currentRoundNumber}: crash at ${crashPoint}x`);
        }
        this.logger.log(`JetX Round ${this.currentRoundNumber} countdown (crash: ${crashPoint}x)`);
        for (const qb of queuedBets) {
            try {
                const bet = await this.prisma.bet.create({
                    data: {
                        userId: qb.userId,
                        roundId: this.currentRoundId,
                        amount: qb.amount,
                        betSlot: qb.betSlot,
                        autoCashout: qb.autoCashout || null,
                        status: 'PENDING',
                    },
                });
                const activeBet = {
                    id: bet.id, userId: qb.userId, username: qb.username,
                    amount: qb.amount, betSlot: qb.betSlot, autoCashout: qb.autoCashout || null,
                    cashoutAt: null, winAmount: null, status: 'PENDING',
                };
                this.activeBets.set(bet.id, activeBet);
                this.sendToUser(qb.userId, 'notification', { type: 'success', message: `JetX queued bet placed: ${qb.amount} Coins` });
            }
            catch (err) {
                try {
                    await this.walletService.credit(qb.userId, qb.amount, 'BET_REFUND', this.currentRoundId);
                    this.sendToUser(qb.userId, 'notification', { type: 'error', message: 'JetX queued bet failed, refunded.' });
                }
                catch { }
            }
        }
        this.generateFakeBets();
        this.broadcast('jetx:countdown', {
            secondsLeft: this.countdown,
            roundNumber: this.currentRoundNumber,
            roundId: this.currentRoundId,
        });
        this.broadcastBets();
        this.countdownInterval = setInterval(() => {
            this.countdown--;
            this.broadcast('jetx:countdown', {
                secondsLeft: this.countdown,
                roundNumber: this.currentRoundNumber,
                roundId: this.currentRoundId,
            });
            if (this.countdown <= 0) {
                if (this.countdownInterval)
                    clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                this.startRound();
            }
        }, 1000);
    }
    async startRound() {
        this.phase = 'RUNNING';
        this.startTime = Date.now();
        await this.prisma.gameRound.update({
            where: { id: this.currentRoundId },
            data: { status: 'RUNNING', startedAt: new Date() },
        });
        for (const [_, bet] of this.activeBets) {
            if (bet.status === 'PENDING')
                bet.status = 'ACTIVE';
        }
        this.activateFakeBets();
        this.broadcast('jetx:start', {
            roundId: this.currentRoundId,
            roundNumber: this.currentRoundNumber,
            startTime: this.startTime,
        });
        this.broadcastBets();
        this.logger.log(`JetX Round ${this.currentRoundNumber} STARTED`);
        this.tickInterval = setInterval(() => this.tick(), 50);
    }
    getMultiplier() {
        if (this.phase !== 'RUNNING')
            return 1.0;
        const elapsed = Date.now() - this.startTime;
        const multiplier = 1 + elapsed * this.speed;
        if (multiplier >= this.crashPoint)
            return this.crashPoint;
        return Math.floor(multiplier * 100) / 100;
    }
    isRunning() {
        if (this.phase !== 'RUNNING')
            return false;
        const elapsed = Date.now() - this.startTime;
        return (1 + elapsed * this.speed) < this.crashPoint;
    }
    async tick() {
        if (this.phase !== 'RUNNING')
            return;
        const multiplier = this.getMultiplier();
        const elapsed = Date.now() - this.startTime;
        for (const [_, bet] of this.activeBets) {
            const acVal = bet.autoCashout ? Number(bet.autoCashout) : 0;
            if (bet.status === 'ACTIVE' && acVal > 0 && multiplier >= acVal) {
                await this.processCashout(bet.userId, bet.betSlot, acVal);
            }
        }
        const prevActive = this.fakeBets.filter(b => b.status === 'ACTIVE').length;
        this.simulateFakeCashouts(multiplier);
        if (this.fakeBets.filter(b => b.status === 'ACTIVE').length !== prevActive) {
            this.broadcastBets();
        }
        if (!this.isRunning()) {
            this.handleCrash();
            return;
        }
        this.broadcast('jetx:tick', { multiplier, elapsed });
    }
    async handleCrash() {
        if (this.phase === 'CRASHED')
            return;
        this.phase = 'CRASHED';
        if (this.tickInterval)
            clearInterval(this.tickInterval);
        this.tickInterval = null;
        this.crashFakeBets();
        const crashPoint = this.crashPoint;
        this.logger.log(`JetX Round ${this.currentRoundNumber} CRASHED at ${crashPoint}x`);
        let totalBets = 0, totalPayouts = 0, totalCommission = 0;
        for (const [_, bet] of this.activeBets) {
            totalBets += bet.amount;
            if (bet.status === 'ACTIVE') {
                bet.status = 'LOST';
                await this.prisma.bet.update({ where: { id: bet.id }, data: { status: 'LOST' } });
            }
            else if (bet.cashoutAt) {
                totalPayouts += bet.winAmount || 0;
            }
            const settings = await this.settingsService.getSettings();
            const commission = bet.amount * settings.commissionRate;
            totalCommission += commission;
            await this.prisma.bet.update({ where: { id: bet.id }, data: { commission } });
        }
        await this.prisma.gameRound.update({
            where: { id: this.currentRoundId },
            data: { status: 'CRASHED', crashedAt: new Date(), totalBets, totalPayouts, commission: totalCommission },
        });
        this.history.push({ roundNumber: this.currentRoundNumber, crashPoint, createdAt: new Date().toISOString() });
        if (this.history.length > 20)
            this.history.shift();
        this.broadcast('jetx:crash', { crashPoint, roundId: this.currentRoundId, roundNumber: this.currentRoundNumber });
        this.broadcastBets();
        await this.logsService.log({
            action: `JetX Round ${this.currentRoundNumber} crashed at ${crashPoint}x`,
            category: 'GAME',
            details: { gameType: 'JETX', roundNumber: this.currentRoundNumber, crashPoint, totalBets, totalPayouts, totalCommission },
        });
        setTimeout(() => this.startCountdown(), 4000);
    }
    async placeBet(userId, username, amount, betSlot, autoCashout) {
        if (this.phase === 'RUNNING' || this.phase === 'CRASHED') {
            const alreadyQueued = this.nextRoundBets.find(b => b.userId === userId && b.betSlot === betSlot);
            if (alreadyQueued)
                return { success: false, message: `Already queued on slot ${betSlot}.` };
            if (amount < 10)
                return { success: false, message: 'Minimum bet is 10 Coins.' };
            try {
                await this.walletService.debit(userId, amount, 'BET_PLACE', this.currentRoundId);
            }
            catch (error) {
                return { success: false, message: error.message || 'Insufficient balance.' };
            }
            this.nextRoundBets.push({ userId, username, amount, betSlot, autoCashout });
            const balance = await this.walletService.getBalance(userId);
            this.sendToUser(userId, 'player:balance', { balance });
            this.sendToUser(userId, 'notification', { type: 'success', message: `JetX bet queued: ${amount} Coins` });
            return { success: true, message: 'Bet queued for next round' };
        }
        if (this.phase !== 'COUNTDOWN')
            return { success: false, message: 'Betting is closed.' };
        if (betSlot !== 1 && betSlot !== 2)
            return { success: false, message: 'Invalid bet slot.' };
        for (const [_, bet] of this.activeBets) {
            if (bet.userId === userId && bet.betSlot === betSlot) {
                return { success: false, message: `Already bet on slot ${betSlot}.` };
            }
        }
        if (amount < 10)
            return { success: false, message: 'Minimum bet is 10 Coins.' };
        try {
            await this.walletService.debit(userId, amount, 'BET_PLACE', this.currentRoundId);
        }
        catch (error) {
            return { success: false, message: error.message || 'Insufficient balance.' };
        }
        const bet = await this.prisma.bet.create({
            data: { userId, roundId: this.currentRoundId, amount, betSlot, autoCashout: autoCashout || null, status: 'PENDING' },
        });
        const activeBet = {
            id: bet.id, userId, username, amount, betSlot,
            autoCashout: autoCashout || null, cashoutAt: null, winAmount: null, status: 'PENDING',
        };
        this.activeBets.set(bet.id, activeBet);
        this.broadcastBets();
        const balance = await this.walletService.getBalance(userId);
        this.sendToUser(userId, 'player:balance', { balance });
        this.sendToUser(userId, 'notification', { type: 'success', message: `JetX bet placed: ${amount} Coins` });
        return { success: true, message: 'Bet placed', bet: activeBet };
    }
    async processCashout(userId, betSlot, forcedMultiplier) {
        if (this.phase !== 'RUNNING')
            return { success: false, message: 'Game not running.' };
        let targetBet = null;
        for (const [_, bet] of this.activeBets) {
            if (bet.userId === userId && bet.betSlot === betSlot && bet.status === 'ACTIVE') {
                targetBet = bet;
                break;
            }
        }
        if (!targetBet)
            return { success: false, message: 'No active bet on this slot.' };
        const multiplier = forcedMultiplier || this.getMultiplier();
        const winAmount = Math.floor(targetBet.amount * multiplier * 100) / 100;
        targetBet.cashoutAt = multiplier;
        targetBet.winAmount = winAmount;
        targetBet.status = 'WON';
        await this.walletService.credit(userId, winAmount, 'BET_WIN', this.currentRoundId);
        await this.prisma.bet.update({
            where: { id: targetBet.id },
            data: { cashoutAt: multiplier, winAmount, status: 'WON' },
        });
        this.broadcast('jetx:cashout', { userId, username: targetBet.username, multiplier, winAmount, betSlot });
        this.broadcastBets();
        const balance = await this.walletService.getBalance(userId);
        this.sendToUser(userId, 'player:balance', { balance });
        this.sendToUser(userId, 'notification', { type: 'success', message: `JetX cashout at ${multiplier.toFixed(2)}x! Won ${winAmount.toFixed(2)} Coins` });
        return { success: true, message: 'Cashout successful' };
    }
    generateFakeBets() {
        this.fakeBets = [];
        const num = Math.floor(Math.random() * 15) + 10;
        const used = new Set();
        for (let i = 0; i < num; i++) {
            let name;
            do {
                name = this.FAKE_NAMES[Math.floor(Math.random() * this.FAKE_NAMES.length)];
            } while (used.has(name));
            used.add(name);
            const r = Math.random();
            let amount;
            if (r < 0.5)
                amount = Math.floor(Math.random() * 1700) + 300;
            else if (r < 0.8)
                amount = Math.floor(Math.random() * 3000) + 2000;
            else if (r < 0.95)
                amount = Math.floor(Math.random() * 5000) + 5000;
            else
                amount = Math.floor(Math.random() * 15000) + 10000;
            amount = Math.round(amount / 50) * 50;
            this.fakeBets.push({
                id: `jfake-${i}-${Date.now()}`, userId: `jfake-${name}`, username: name,
                amount, betSlot: 1, autoCashout: null, cashoutAt: null, winAmount: null, status: 'PENDING',
            });
        }
    }
    simulateFakeCashouts(multiplier) {
        for (const f of this.fakeBets) {
            if (f.status !== 'ACTIVE')
                continue;
            if (Math.random() < 0.005 + (multiplier - 1) * 0.008) {
                f.status = 'WON';
                f.cashoutAt = multiplier;
                f.winAmount = Math.floor(f.amount * multiplier * 100) / 100;
            }
        }
    }
    crashFakeBets() { for (const f of this.fakeBets) {
        if (f.status === 'ACTIVE')
            f.status = 'LOST';
    } }
    activateFakeBets() { for (const f of this.fakeBets) {
        if (f.status === 'PENDING')
            f.status = 'ACTIVE';
    } }
    getAllBetsForBroadcast() {
        const real = Array.from(this.activeBets.values()).map(b => ({ ...b }));
        const fake = this.fakeBets.map(b => ({ ...b }));
        return [...real, ...fake].sort((a, b) => b.amount - a.amount);
    }
    broadcastBets() {
        this.broadcast('jetx:bets', { bets: this.getAllBetsForBroadcast() });
    }
    getGameState() {
        return {
            phase: this.phase,
            roundId: this.currentRoundId,
            roundNumber: this.currentRoundNumber,
            multiplier: this.phase === 'RUNNING' ? this.getMultiplier() : 1.0,
            countdown: this.countdown,
            startTime: this.startTime || null,
            crashPoint: this.phase === 'CRASHED' ? this.crashPoint : null,
            bets: this.getAllBetsForBroadcast(),
            history: this.history,
        };
    }
    getPhase() { return this.phase; }
    getCurrentRoundNumber() { return this.currentRoundNumber; }
    getHistory() { return this.history; }
    async forceRound(roundNumber, crashPoint, adminId) {
        await this.prisma.forcedRound.create({
            data: { roundNumber, crashPoint, gameType: 'JETX', createdBy: adminId },
        });
        await this.logsService.log({
            userId: adminId, action: `JetX forced round ${roundNumber} to crash at ${crashPoint}x`,
            category: 'ADMIN', details: { gameType: 'JETX', roundNumber, crashPoint },
        });
        return { message: `JetX Round ${roundNumber} will crash at ${crashPoint}x` };
    }
    async getForcedRounds() {
        return this.prisma.forcedRound.findMany({
            where: { executed: false, gameType: 'JETX' },
            orderBy: { roundNumber: 'asc' },
        });
    }
    async deleteForcedRound(id, adminId) {
        await this.prisma.forcedRound.delete({ where: { id } });
        await this.logsService.log({ userId: adminId, action: `Deleted JetX forced round: ${id}`, category: 'ADMIN' });
        return { message: 'Forced round deleted' };
    }
};
exports.JetXEngineService = JetXEngineService;
exports.JetXEngineService = JetXEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        settings_service_1.SettingsService,
        logs_service_1.LogsService])
], JetXEngineService);
//# sourceMappingURL=jetx-engine.service.js.map