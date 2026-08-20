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
exports.GameEngineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const settings_service_1 = require("../settings/settings.service");
const logs_service_1 = require("../logs/logs.service");
const aviation_plugin_1 = require("./plugins/aviation/aviation.plugin");
let GameEngineService = class GameEngineService {
    constructor(prisma, walletService, settingsService, logsService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.settingsService = settingsService;
        this.logsService = logsService;
        this.logger = new common_1.Logger('GameEngine');
        this.phase = 'WAITING';
        this.currentRoundId = null;
        this.currentRoundNumber = 0;
        this.countdown = 15;
        this.countdownInterval = null;
        this.tickInterval = null;
        this.activeBets = new Map();
        this.nextRoundBets = [];
        this.startTime = 0;
        this.crashPoint = 0;
        this.broadcastFn = null;
        this.sendToUserFn = null;
        this.history = [];
        this.fakeBets = [];
        this.FAKE_NAMES = [
            'Ravi_K', 'Priya_S', 'Amit_22', 'Sneha_M', 'Arjun_P', 'Divya_R', 'Karan_J',
            'Neha_99', 'Vikram_D', 'Pooja_L', 'Rahul_T', 'Anita_G', 'Suresh_B', 'Meena_V',
            'Rohit_N', 'Kavita_C', 'Deepak_H', 'Sunita_W', 'Manish_F', 'Rekha_X',
            'Lucky_777', 'King_Bet', 'Pro_Gamer', 'HighRoll', 'StarPlay', 'MegaWin',
            'Golden_7', 'BetKing1', 'WinnerX', 'CashPro', 'BigBoss_', 'RichPlay',
            'TopGun22', 'FastBet1', 'MoneyMvr', 'AllIn_99', 'JackPot1', 'SkyHigh_',
            'Diamond_', 'Royal_BT', 'Flash_77', 'Storm_99', 'Blaze_11', 'Thunder_',
            'Phantom_', 'Legend_X', 'NightOwl', 'FireBet_', 'IceKing_', 'ShadowBT',
        ];
        this.plugin = new aviation_plugin_1.AviationPlugin();
    }
    async onModuleInit() {
        await this.plugin.initialize();
        const recentRounds = await this.prisma.gameRound.findMany({
            where: { status: 'CRASHED', gameType: 'AVIATION' },
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
            where: { gameType: 'AVIATION' },
            orderBy: { roundNumber: 'desc' },
        });
        this.currentRoundNumber = lastRound ? lastRound.roundNumber : 0;
        this.logger.log('Game engine initialized');
        setTimeout(() => this.startCountdown(), 3000);
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
    async startCountdown() {
        this.phase = 'COUNTDOWN';
        this.activeBets.clear();
        const queuedBets = [...this.nextRoundBets];
        this.nextRoundBets = [];
        this.currentRoundNumber++;
        const settings = await this.settingsService.getSettings();
        this.countdown = settings.countdownDuration || 15;
        const forcedRound = await this.prisma.forcedRound.findFirst({
            where: { roundNumber: this.currentRoundNumber, executed: false, gameType: 'AVIATION' },
        });
        const gameConfig = await this.prisma.gameConfig.findUnique({ where: { gameType: 'AVIATION' } });
        const minMult = gameConfig ? Number(gameConfig.minMultiplier) : 1.0;
        const maxMult = gameConfig ? Number(gameConfig.maxMultiplier) : 1000.0;
        let crashPoint;
        if (forcedRound) {
            crashPoint = Number(forcedRound.crashPoint);
        }
        else {
            let attempts = 0;
            do {
                crashPoint = this.plugin.generateCrashPoint();
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
                    gameType: 'AVIATION',
                    crashPoint,
                    status: 'WAITING',
                    isForced: !!forcedRound,
                },
            });
        }
        catch (e) {
            if (e?.code === 'P2002') {
                const maxRound = await this.prisma.gameRound.findFirst({
                    where: { gameType: 'AVIATION' },
                    orderBy: { roundNumber: 'desc' },
                });
                this.currentRoundNumber = (maxRound?.roundNumber || 0) + 1;
                this.logger.warn(`Duplicate round detected, jumping to round ${this.currentRoundNumber}`);
                round = await this.prisma.gameRound.create({
                    data: {
                        roundNumber: this.currentRoundNumber,
                        gameType: 'AVIATION',
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
            this.logger.log(`Forced round ${this.currentRoundNumber}: crash at ${crashPoint}x`);
        }
        this.logger.log(`Round ${this.currentRoundNumber} countdown started (crash: ${crashPoint}x)`);
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
                    id: bet.id,
                    userId: qb.userId,
                    username: qb.username,
                    amount: qb.amount,
                    betSlot: qb.betSlot,
                    autoCashout: qb.autoCashout || null,
                    cashoutAt: null,
                    winAmount: null,
                    status: 'PENDING',
                };
                this.activeBets.set(bet.id, activeBet);
                this.sendToUser(qb.userId, 'notification', {
                    type: 'success',
                    message: `Queued bet placed: ${qb.amount} ₹ (slot ${qb.betSlot})`,
                });
                this.logger.log(`Queued bet placed for ${qb.username}: ${qb.amount} ₹`);
            }
            catch (err) {
                try {
                    await this.walletService.credit(qb.userId, qb.amount, 'BET_REFUND', this.currentRoundId);
                    this.sendToUser(qb.userId, 'notification', { type: 'error', message: 'Queued bet failed, refunded.' });
                }
                catch { }
            }
        }
        this.generateFakeBets();
        this.broadcast('game:countdown', {
            secondsLeft: this.countdown,
            roundNumber: this.currentRoundNumber,
            roundId: this.currentRoundId,
        });
        this.broadcastBets();
        this.countdownInterval = setInterval(() => {
            this.countdown--;
            this.broadcast('game:countdown', {
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
        this.plugin.startRound(this.currentRoundId, this.crashPoint);
        await this.prisma.gameRound.update({
            where: { id: this.currentRoundId },
            data: { status: 'RUNNING', startedAt: new Date() },
        });
        for (const [betId, bet] of this.activeBets) {
            if (bet.status === 'PENDING') {
                bet.status = 'ACTIVE';
            }
        }
        this.activateFakeBets();
        this.broadcast('game:start', {
            roundId: this.currentRoundId,
            roundNumber: this.currentRoundNumber,
            startTime: this.startTime,
        });
        this.broadcastBets();
        this.logger.log(`Round ${this.currentRoundNumber} STARTED`);
        this.tickInterval = setInterval(() => {
            this.tick();
        }, 50);
    }
    async tick() {
        if (this.phase !== 'RUNNING')
            return;
        try {
            const multiplier = this.plugin.getMultiplier();
            const elapsed = this.plugin.getElapsed();
            for (const [betId, bet] of this.activeBets) {
                const autoCashoutVal = bet.autoCashout ? Number(bet.autoCashout) : 0;
                if (bet.status === 'ACTIVE' &&
                    autoCashoutVal > 0 &&
                    multiplier >= autoCashoutVal) {
                    try {
                        await this.processCashout(bet.userId, bet.betSlot, autoCashoutVal);
                    }
                    catch (e) {
                        this.logger.error(`Auto-cashout error: ${e}`);
                    }
                }
            }
            try {
                const prevActive = this.fakeBets.filter(b => b.status === 'ACTIVE').length;
                this.simulateFakeCashouts(multiplier);
                const nowActive = this.fakeBets.filter(b => b.status === 'ACTIVE').length;
                if (prevActive !== nowActive) {
                    this.broadcastBets();
                }
            }
            catch (e) {
                this.logger.error(`Fake cashout error: ${e}`);
            }
            if (!this.plugin.isRunning()) {
                this.handleCrash();
                return;
            }
            this.broadcast('game:tick', { multiplier, elapsed });
        }
        catch (e) {
            this.logger.error(`Tick error: ${e}`);
        }
    }
    async handleCrash() {
        if (this.phase === 'CRASHED')
            return;
        this.phase = 'CRASHED';
        if (this.tickInterval)
            clearInterval(this.tickInterval);
        this.tickInterval = null;
        const crashPoint = this.crashPoint;
        this.logger.log(`Round ${this.currentRoundNumber} CRASHED at ${crashPoint}x`);
        this.broadcast('game:crash', {
            crashPoint,
            roundId: this.currentRoundId,
            roundNumber: this.currentRoundNumber,
        });
        try {
            this.crashFakeBets();
            let totalBets = 0;
            let totalPayouts = 0;
            let totalCommission = 0;
            for (const [betId, bet] of this.activeBets) {
                totalBets += bet.amount;
                if (bet.status === 'ACTIVE') {
                    bet.status = 'LOST';
                    try {
                        await this.prisma.bet.update({
                            where: { id: bet.id },
                            data: { status: 'LOST' },
                        });
                    }
                    catch (e) {
                        this.logger.error(`Bet update error: ${e}`);
                    }
                }
                else if (bet.cashoutAt) {
                    totalPayouts += bet.winAmount || 0;
                }
                try {
                    const settings = await this.settingsService.getSettings();
                    const commission = bet.amount * settings.commissionRate;
                    totalCommission += commission;
                    await this.prisma.bet.update({
                        where: { id: bet.id },
                        data: { commission },
                    });
                }
                catch (e) {
                    this.logger.error(`Commission update error: ${e}`);
                }
            }
            await this.prisma.gameRound.update({
                where: { id: this.currentRoundId },
                data: {
                    status: 'CRASHED',
                    crashedAt: new Date(),
                    totalBets,
                    totalPayouts,
                    commission: totalCommission,
                },
            });
            this.history.push({
                roundNumber: this.currentRoundNumber,
                crashPoint,
                createdAt: new Date().toISOString(),
            });
            if (this.history.length > 20)
                this.history.shift();
            this.broadcastBets();
            await this.logsService.log({
                action: `Round ${this.currentRoundNumber} crashed at ${crashPoint}x`,
                category: 'GAME',
                details: { roundNumber: this.currentRoundNumber, crashPoint, totalBets, totalPayouts, totalCommission },
            });
        }
        catch (e) {
            this.logger.error(`HandleCrash DB error (game loop continues): ${e}`);
        }
        setTimeout(() => this.startCountdown(), 4000);
    }
    async placeBet(userId, username, amount, betSlot, autoCashout) {
        if (this.phase === 'RUNNING' || this.phase === 'CRASHED') {
            const alreadyQueued = this.nextRoundBets.find(b => b.userId === userId && b.betSlot === betSlot);
            if (alreadyQueued) {
                return { success: false, message: `Already queued a bet on slot ${betSlot} for next round.` };
            }
            if (amount < 10)
                return { success: false, message: 'Minimum bet is 10 ₹.' };
            try {
                await this.walletService.debit(userId, amount, 'BET_PLACE', this.currentRoundId);
            }
            catch (error) {
                return { success: false, message: error.message || 'Insufficient balance.' };
            }
            this.nextRoundBets.push({ userId, username, amount, betSlot, autoCashout });
            const balance = await this.walletService.getBalance(userId);
            this.sendToUser(userId, 'player:balance', { balance });
            this.sendToUser(userId, 'notification', { type: 'success', message: `Bet queued for next round: ${amount} ₹ (slot ${betSlot})` });
            return { success: true, message: 'Bet queued for next round' };
        }
        if (this.phase !== 'COUNTDOWN') {
            return { success: false, message: 'Betting is closed. Wait for next round.' };
        }
        if (betSlot !== 1 && betSlot !== 2) {
            return { success: false, message: 'Invalid bet slot.' };
        }
        for (const [_, bet] of this.activeBets) {
            if (bet.userId === userId && bet.betSlot === betSlot) {
                return { success: false, message: `You already placed a bet on slot ${betSlot}.` };
            }
        }
        if (amount < 10) {
            return { success: false, message: 'Minimum bet is 10 ₹.' };
        }
        try {
            await this.walletService.debit(userId, amount, 'BET_PLACE', this.currentRoundId);
        }
        catch (error) {
            return { success: false, message: error.message || 'Insufficient balance.' };
        }
        const bet = await this.prisma.bet.create({
            data: {
                userId,
                roundId: this.currentRoundId,
                amount,
                betSlot,
                autoCashout: autoCashout || null,
                status: 'PENDING',
            },
        });
        const activeBet = {
            id: bet.id,
            userId,
            username,
            amount,
            betSlot,
            autoCashout: autoCashout || null,
            cashoutAt: null,
            winAmount: null,
            status: 'PENDING',
        };
        this.activeBets.set(bet.id, activeBet);
        this.broadcastBets();
        const balance = await this.walletService.getBalance(userId);
        this.sendToUser(userId, 'player:balance', { balance });
        this.sendToUser(userId, 'notification', {
            type: 'success',
            message: `Bet placed: ${amount} ₹ on slot ${betSlot}`,
        });
        await this.logsService.log({
            userId,
            action: `Placed bet: ${amount} ₹ (slot ${betSlot})`,
            category: 'BET',
            details: { amount, betSlot, autoCashout, roundNumber: this.currentRoundNumber },
        });
        return { success: true, message: 'Bet placed successfully', bet: activeBet };
    }
    async processCashout(userId, betSlot, forcedMultiplier) {
        if (this.phase !== 'RUNNING') {
            return { success: false, message: 'Game is not running.' };
        }
        let targetBet = null;
        for (const [_, bet] of this.activeBets) {
            if (bet.userId === userId && bet.betSlot === betSlot && bet.status === 'ACTIVE') {
                targetBet = bet;
                break;
            }
        }
        if (!targetBet) {
            return { success: false, message: 'No active bet found on this slot.' };
        }
        const multiplier = forcedMultiplier || this.plugin.getMultiplier();
        const winAmount = Math.floor(targetBet.amount * multiplier * 100) / 100;
        targetBet.cashoutAt = multiplier;
        targetBet.winAmount = winAmount;
        targetBet.status = 'WON';
        await this.walletService.credit(userId, winAmount, 'BET_WIN', this.currentRoundId);
        await this.prisma.bet.update({
            where: { id: targetBet.id },
            data: {
                cashoutAt: multiplier,
                winAmount,
                status: 'WON',
            },
        });
        this.broadcast('game:cashout', {
            userId,
            username: targetBet.username,
            multiplier,
            winAmount,
            betSlot,
        });
        this.broadcastBets();
        const balance = await this.walletService.getBalance(userId);
        this.sendToUser(userId, 'player:balance', { balance });
        this.sendToUser(userId, 'notification', {
            type: 'success',
            message: `Cashed out at ${multiplier.toFixed(2)}x! Won ${winAmount.toFixed(2)} ₹`,
        });
        await this.logsService.log({
            userId,
            action: `Cashed out at ${multiplier}x: won ${winAmount} ₹`,
            category: 'CASHOUT',
            details: { multiplier, winAmount, betSlot, roundNumber: this.currentRoundNumber },
        });
        return {
            success: true,
            message: 'Cashout successful',
            cashout: { multiplier, winAmount },
        };
    }
    generateFakeBets() {
        this.fakeBets = [];
        const numFake = Math.floor(Math.random() * 13) + 8;
        const usedNames = new Set();
        for (let i = 0; i < numFake; i++) {
            let name;
            do {
                name = this.FAKE_NAMES[Math.floor(Math.random() * this.FAKE_NAMES.length)];
            } while (usedNames.has(name));
            usedNames.add(name);
            const rand = Math.random();
            let amount;
            if (rand < 0.5)
                amount = Math.floor(Math.random() * 1700) + 300;
            else if (rand < 0.8)
                amount = Math.floor(Math.random() * 3000) + 2000;
            else if (rand < 0.95)
                amount = Math.floor(Math.random() * 5000) + 5000;
            else
                amount = Math.floor(Math.random() * 15000) + 10000;
            amount = Math.round(amount / 50) * 50;
            this.fakeBets.push({
                id: `fake-${i}-${Date.now()}`,
                userId: `fake-${name}`,
                username: name,
                amount,
                betSlot: 1,
                autoCashout: null,
                cashoutAt: null,
                winAmount: null,
                status: 'PENDING',
            });
        }
    }
    simulateFakeCashouts(multiplier) {
        for (const fake of this.fakeBets) {
            if (fake.status !== 'ACTIVE')
                continue;
            const cashoutChance = 0.005 + (multiplier - 1) * 0.008;
            if (Math.random() < cashoutChance) {
                fake.status = 'WON';
                fake.cashoutAt = multiplier;
                fake.winAmount = Math.floor(fake.amount * multiplier * 100) / 100;
            }
        }
    }
    crashFakeBets() {
        for (const fake of this.fakeBets) {
            if (fake.status === 'ACTIVE') {
                fake.status = 'LOST';
            }
        }
    }
    activateFakeBets() {
        for (const fake of this.fakeBets) {
            if (fake.status === 'PENDING') {
                fake.status = 'ACTIVE';
            }
        }
    }
    getAllBetsForBroadcast() {
        const realBets = Array.from(this.activeBets.values()).map((b) => ({
            id: b.id,
            userId: b.userId,
            username: b.username,
            amount: b.amount,
            betSlot: b.betSlot,
            autoCashout: b.autoCashout,
            cashoutAt: b.cashoutAt,
            winAmount: b.winAmount,
            status: b.status,
        }));
        const fakeBetsData = this.fakeBets.map((b) => ({
            id: b.id,
            userId: b.userId,
            username: b.username,
            amount: b.amount,
            betSlot: b.betSlot,
            autoCashout: b.autoCashout,
            cashoutAt: b.cashoutAt,
            winAmount: b.winAmount,
            status: b.status,
        }));
        return [...realBets, ...fakeBetsData].sort((a, b) => b.amount - a.amount);
    }
    broadcastBets() {
        this.broadcast('game:bets', { bets: this.getAllBetsForBroadcast() });
    }
    getGameState() {
        return {
            phase: this.phase,
            roundId: this.currentRoundId,
            roundNumber: this.currentRoundNumber,
            multiplier: this.phase === 'RUNNING' ? this.plugin.getMultiplier() : 1.0,
            countdown: this.countdown,
            startTime: this.startTime || null,
            crashPoint: this.phase === 'CRASHED' ? this.crashPoint : null,
            bets: this.getAllBetsForBroadcast(),
            history: this.history,
        };
    }
    getPhase() {
        return this.phase;
    }
    getCurrentRoundNumber() {
        return this.currentRoundNumber;
    }
    getHistory() {
        return this.history;
    }
    async forceRound(roundNumber, crashPoint, adminId) {
        await this.prisma.forcedRound.create({
            data: {
                roundNumber,
                crashPoint,
                gameType: 'AVIATION',
                createdBy: adminId,
            },
        });
        await this.logsService.log({
            userId: adminId,
            action: `Forced round ${roundNumber} to crash at ${crashPoint}x`,
            category: 'ADMIN',
            details: { roundNumber, crashPoint },
        });
        return { message: `Round ${roundNumber} will crash at ${crashPoint}x` };
    }
    async getForcedRounds() {
        return this.prisma.forcedRound.findMany({
            where: { executed: false },
            orderBy: { roundNumber: 'asc' },
        });
    }
    async deleteForcedRound(id, adminId) {
        await this.prisma.forcedRound.delete({ where: { id } });
        await this.logsService.log({
            userId: adminId,
            action: `Deleted forced round: ${id}`,
            category: 'ADMIN',
        });
        return { message: 'Forced round deleted' };
    }
};
exports.GameEngineService = GameEngineService;
exports.GameEngineService = GameEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        settings_service_1.SettingsService,
        logs_service_1.LogsService])
], GameEngineService);
//# sourceMappingURL=game-engine.service.js.map