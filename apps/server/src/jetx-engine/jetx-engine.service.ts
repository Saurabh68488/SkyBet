// ============================================
// JetX Game Engine Service
// Completely independent from Aviation engine
// Own rounds, own crash points, own event prefix
// ============================================

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { SettingsService } from '../settings/settings.service';
import { LogsService } from '../logs/logs.service';
import * as crypto from 'crypto';

export interface JetXBet {
  id: string;
  userId: string;
  username: string;
  amount: number;
  betSlot: number;
  autoCashout: number | null;
  cashoutAt: number | null;
  winAmount: number | null;
  status: string;
}

type GamePhase = 'WAITING' | 'COUNTDOWN' | 'RUNNING' | 'CRASHED';

@Injectable()
export class JetXEngineService implements OnModuleInit {
  private readonly logger = new Logger('JetXEngine');
  private phase: GamePhase = 'WAITING';
  private currentRoundId: string | null = null;
  private currentRoundNumber: number = 0;
  private countdown: number = 10;
  private countdownInterval: NodeJS.Timeout | null = null;
  private tickInterval: NodeJS.Timeout | null = null;
  private activeBets: Map<string, JetXBet> = new Map();
  private nextRoundBets: Array<{ userId: string; username: string; amount: number; betSlot: number; autoCashout?: number }> = [];
  private startTime: number = 0;
  private crashPoint: number = 0;
  private speed: number = 0.0001; // same linear speed

  private broadcastFn: ((event: string, data: any) => void) | null = null;
  private sendToUserFn: ((userId: string, event: string, data: any) => void) | null = null;

  private history: Array<{ roundNumber: number; crashPoint: number; createdAt: string }> = [];

  // Fake bets
  private fakeBets: JetXBet[] = [];
  private readonly FAKE_NAMES = [
    'Ace_High', 'JetFan_1', 'Turbo_X', 'Blitz_99', 'NitroB', 'Falcon_7',
    'Storm_R', 'Eagle_22', 'Dash_Pro', 'Rocket_M', 'Phoenix_', 'Viper_K',
    'Bolt_777', 'Striker_', 'Mavrick_', 'Hunter_X', 'Sniper_9', 'Cobra_11',
    'Wolf_Bet', 'Tiger_GO', 'Shark_33', 'Dragon_Z', 'Panther_', 'Raptor_7',
    'Stealth_', 'Nitro_55', 'Blaze_22', 'Inferno_', 'Cyclone_', 'Titan_88',
    'Alpha_BT', 'Bravo_99', 'Delta_77', 'Echo_555', 'Foxtrot_', 'Golf_123',
    'Hotel_BT', 'India_99', 'Juliet_X', 'Kilo_777', 'Lima_BET', 'Mike_PRO',
    'Nova_555', 'Oscar_88', 'Papa_WIN', 'Quebec_1', 'Romeo_BT', 'Sierra_X',
  ];

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private settingsService: SettingsService,
    private logsService: LogsService,
  ) {}

  async onModuleInit() {
    // Load recent JetX round history
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

    // Get last JetX round number
    const lastRound = await this.prisma.gameRound.findFirst({
      where: { gameType: 'JETX' },
      orderBy: { roundNumber: 'desc' },
    });
    this.currentRoundNumber = lastRound ? lastRound.roundNumber : 0;

    this.logger.log('JetX engine initialized');

    // Start with slight offset from Aviation (5s delay)
    setTimeout(() => this.startCountdown(), 5000);
  }

  setBroadcast(broadcastFn: (event: string, data: any) => void, sendToUserFn: (userId: string, event: string, data: any) => void) {
    this.broadcastFn = broadcastFn;
    this.sendToUserFn = sendToUserFn;
  }

  private broadcast(event: string, data: any) {
    if (this.broadcastFn) this.broadcastFn(event, data);
  }

  private sendToUser(userId: string, event: string, data: any) {
    if (this.sendToUserFn) this.sendToUserFn(userId, event, data);
  }

  // ─── CRASH POINT GENERATION ────────────────────
  private generateCrashPoint(): number {
    const houseEdge = 0.04; // 4% house edge for JetX (slightly different from Aviation)
    const randomBytes = crypto.randomBytes(4);
    const random = randomBytes.readUInt32BE(0) / 0xffffffff;

    if (random < houseEdge) return 1.0;

    const crashPoint = Math.floor((1 / (1 - random)) * 100) / 100;
    return Math.min(crashPoint, 1000);
  }

  // ─── ROUND LIFECYCLE ─────────────────────────

  private async startCountdown() {
    this.phase = 'COUNTDOWN';
    this.activeBets.clear();

    const queuedBets = [...this.nextRoundBets];
    this.nextRoundBets = [];
    this.currentRoundNumber++;

    const settings = await this.settingsService.getSettings();
    this.countdown = settings.countdownDuration || 10;

    // Check for forced round
    const forcedRound = await this.prisma.forcedRound.findFirst({
      where: { roundNumber: this.currentRoundNumber, executed: false, gameType: 'JETX' },
    });

    // Read multiplier limits from GameConfig
    const gameConfig = await this.prisma.gameConfig.findUnique({ where: { gameType: 'JETX' } });
    const minMult = gameConfig ? Number(gameConfig.minMultiplier) : 1.0;
    const maxMult = gameConfig ? Number(gameConfig.maxMultiplier) : 1000.0;

    // Generate crash point within admin-defined range
    let crashPoint: number;
    if (forcedRound) {
      crashPoint = Number(forcedRound.crashPoint);
    } else {
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
    } catch (e: any) {
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
      } else {
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

    // Process queued bets
    for (const qb of queuedBets) {
      try {
        const bet = await this.prisma.bet.create({
          data: {
            userId: qb.userId,
            roundId: this.currentRoundId!,
            amount: qb.amount,
            betSlot: qb.betSlot,
            autoCashout: qb.autoCashout || null,
            status: 'PENDING',
          },
        });
        const activeBet: JetXBet = {
          id: bet.id, userId: qb.userId, username: qb.username,
          amount: qb.amount, betSlot: qb.betSlot, autoCashout: qb.autoCashout || null,
          cashoutAt: null, winAmount: null, status: 'PENDING',
        };
        this.activeBets.set(bet.id, activeBet);
        this.sendToUser(qb.userId, 'notification', { type: 'success', message: `JetX queued bet placed: ${qb.amount} ₹` });
      } catch (err) {
        try {
          await this.walletService.credit(qb.userId, qb.amount, 'BET_REFUND', this.currentRoundId!);
          this.sendToUser(qb.userId, 'notification', { type: 'error', message: 'JetX queued bet failed, refunded.' });
        } catch {}
      }
    }

    this.generateFakeBets();

    // Broadcast with jetx: prefix
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
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        this.startRound();
      }
    }, 1000);
  }

  private async startRound() {
    this.phase = 'RUNNING';
    this.startTime = Date.now();

    await this.prisma.gameRound.update({
      where: { id: this.currentRoundId! },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    for (const [_, bet] of this.activeBets) {
      if (bet.status === 'PENDING') bet.status = 'ACTIVE';
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

  private getMultiplier(): number {
    if (this.phase !== 'RUNNING') return 1.0;
    const elapsed = Date.now() - this.startTime;
    const multiplier = 1 + elapsed * this.speed;
    if (multiplier >= this.crashPoint) return this.crashPoint;
    return Math.floor(multiplier * 100) / 100;
  }

  private isRunning(): boolean {
    if (this.phase !== 'RUNNING') return false;
    const elapsed = Date.now() - this.startTime;
    return (1 + elapsed * this.speed) < this.crashPoint;
  }

  private async tick() {
    if (this.phase !== 'RUNNING') return;

    try {
      const multiplier = this.getMultiplier();
      const elapsed = Date.now() - this.startTime;

      // Auto-cashouts
      for (const [_, bet] of this.activeBets) {
        const acVal = bet.autoCashout ? Number(bet.autoCashout) : 0;
        if (bet.status === 'ACTIVE' && acVal > 0 && multiplier >= acVal) {
          try {
            await this.processCashout(bet.userId, bet.betSlot, acVal);
          } catch (e) {
            this.logger.error(`JetX auto-cashout error: ${e}`);
          }
        }
      }

      // Fake cashouts
      try {
        const prevActive = this.fakeBets.filter(b => b.status === 'ACTIVE').length;
        this.simulateFakeCashouts(multiplier);
        if (this.fakeBets.filter(b => b.status === 'ACTIVE').length !== prevActive) {
          this.broadcastBets();
        }
      } catch (e) {
        this.logger.error(`JetX fake cashout error: ${e}`);
      }

      if (!this.isRunning()) {
        this.handleCrash();
        return;
      }

      this.broadcast('jetx:tick', { multiplier, elapsed });
    } catch (e) {
      this.logger.error(`JetX tick error: ${e}`);
    }
  }

  private async handleCrash() {
    if (this.phase === 'CRASHED') return;
    this.phase = 'CRASHED';

    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = null;

    const crashPoint = this.crashPoint;
    this.logger.log(`JetX Round ${this.currentRoundNumber} CRASHED at ${crashPoint}x`);

    // ALWAYS broadcast crash first
    this.broadcast('jetx:crash', { crashPoint, roundId: this.currentRoundId, roundNumber: this.currentRoundNumber });

    // DB operations in try-catch
    try {
      this.crashFakeBets();

      let totalBets = 0, totalPayouts = 0, totalCommission = 0;

      for (const [_, bet] of this.activeBets) {
        totalBets += bet.amount;
        if (bet.status === 'ACTIVE') {
          bet.status = 'LOST';
          try {
            await this.prisma.bet.update({ where: { id: bet.id }, data: { status: 'LOST' } });
          } catch (e) {
            this.logger.error(`JetX bet update error: ${e}`);
          }
        } else if (bet.cashoutAt) {
          totalPayouts += bet.winAmount || 0;
        }
        try {
          const settings = await this.settingsService.getSettings();
          const commission = bet.amount * settings.commissionRate;
          totalCommission += commission;
          await this.prisma.bet.update({ where: { id: bet.id }, data: { commission } });
        } catch (e) {
          this.logger.error(`JetX commission error: ${e}`);
        }
      }

      await this.prisma.gameRound.update({
        where: { id: this.currentRoundId! },
        data: { status: 'CRASHED', crashedAt: new Date(), totalBets, totalPayouts, commission: totalCommission },
      });

      this.history.push({ roundNumber: this.currentRoundNumber, crashPoint, createdAt: new Date().toISOString() });
      if (this.history.length > 20) this.history.shift();

      this.broadcastBets();

      await this.logsService.log({
        action: `JetX Round ${this.currentRoundNumber} crashed at ${crashPoint}x`,
        category: 'GAME',
        details: { gameType: 'JETX', roundNumber: this.currentRoundNumber, crashPoint, totalBets, totalPayouts, totalCommission },
      });
    } catch (e) {
      this.logger.error(`JetX handleCrash DB error (game loop continues): ${e}`);
    }

    // ALWAYS start next round
    setTimeout(() => this.startCountdown(), 4000);
  }


  // ─── BET HANDLING ────────────────────────────

  async placeBet(userId: string, username: string, amount: number, betSlot: number, autoCashout?: number): Promise<{ success: boolean; message: string; bet?: any }> {
    if (this.phase === 'RUNNING' || this.phase === 'CRASHED') {
      const alreadyQueued = this.nextRoundBets.find(b => b.userId === userId && b.betSlot === betSlot);
      if (alreadyQueued) return { success: false, message: `Already queued on slot ${betSlot}.` };
      if (amount < 10) return { success: false, message: 'Minimum bet is 10 ₹.' };
      try {
        await this.walletService.debit(userId, amount, 'BET_PLACE', this.currentRoundId!);
      } catch (error: any) {
        return { success: false, message: error.message || 'Insufficient balance.' };
      }
      this.nextRoundBets.push({ userId, username, amount, betSlot, autoCashout });
      const balance = await this.walletService.getBalance(userId);
      this.sendToUser(userId, 'player:balance', { balance });
      this.sendToUser(userId, 'notification', { type: 'success', message: `JetX bet queued: ${amount} ₹` });
      return { success: true, message: 'Bet queued for next round' };
    }

    if (this.phase !== 'COUNTDOWN') return { success: false, message: 'Betting is closed.' };
    if (betSlot !== 1 && betSlot !== 2) return { success: false, message: 'Invalid bet slot.' };

    for (const [_, bet] of this.activeBets) {
      if (bet.userId === userId && bet.betSlot === betSlot) {
        return { success: false, message: `Already bet on slot ${betSlot}.` };
      }
    }

    if (amount < 10) return { success: false, message: 'Minimum bet is 10 ₹.' };

    try {
      await this.walletService.debit(userId, amount, 'BET_PLACE', this.currentRoundId!);
    } catch (error: any) {
      return { success: false, message: error.message || 'Insufficient balance.' };
    }

    const bet = await this.prisma.bet.create({
      data: { userId, roundId: this.currentRoundId!, amount, betSlot, autoCashout: autoCashout || null, status: 'PENDING' },
    });

    const activeBet: JetXBet = {
      id: bet.id, userId, username, amount, betSlot,
      autoCashout: autoCashout || null, cashoutAt: null, winAmount: null, status: 'PENDING',
    };
    this.activeBets.set(bet.id, activeBet);
    this.broadcastBets();

    const balance = await this.walletService.getBalance(userId);
    this.sendToUser(userId, 'player:balance', { balance });
    this.sendToUser(userId, 'notification', { type: 'success', message: `JetX bet placed: ${amount} ₹` });

    return { success: true, message: 'Bet placed', bet: activeBet };
  }

  async processCashout(userId: string, betSlot: number, forcedMultiplier?: number): Promise<{ success: boolean; message: string }> {
    if (this.phase !== 'RUNNING') return { success: false, message: 'Game not running.' };

    let targetBet: JetXBet | null = null;
    for (const [_, bet] of this.activeBets) {
      if (bet.userId === userId && bet.betSlot === betSlot && bet.status === 'ACTIVE') {
        targetBet = bet;
        break;
      }
    }
    if (!targetBet) return { success: false, message: 'No active bet on this slot.' };

    const multiplier = forcedMultiplier || this.getMultiplier();
    const winAmount = Math.floor(targetBet.amount * multiplier * 100) / 100;

    targetBet.cashoutAt = multiplier;
    targetBet.winAmount = winAmount;
    targetBet.status = 'WON';

    await this.walletService.credit(userId, winAmount, 'BET_WIN', this.currentRoundId!);
    await this.prisma.bet.update({
      where: { id: targetBet.id },
      data: { cashoutAt: multiplier, winAmount, status: 'WON' },
    });

    this.broadcast('jetx:cashout', { userId, username: targetBet.username, multiplier, winAmount, betSlot });
    this.broadcastBets();

    const balance = await this.walletService.getBalance(userId);
    this.sendToUser(userId, 'player:balance', { balance });
    this.sendToUser(userId, 'notification', { type: 'success', message: `JetX cashout at ${multiplier.toFixed(2)}x! Won ${winAmount.toFixed(2)} ₹` });

    return { success: true, message: 'Cashout successful' };
  }

  // ─── FAKE BETS ─────────────────────────────
  private generateFakeBets() {
    this.fakeBets = [];
    const num = Math.floor(Math.random() * 15) + 10;
    const used = new Set<string>();
    for (let i = 0; i < num; i++) {
      let name: string;
      do { name = this.FAKE_NAMES[Math.floor(Math.random() * this.FAKE_NAMES.length)]; } while (used.has(name));
      used.add(name);
      const r = Math.random();
      let amount: number;
      if (r < 0.5) amount = Math.floor(Math.random() * 1700) + 300;
      else if (r < 0.8) amount = Math.floor(Math.random() * 3000) + 2000;
      else if (r < 0.95) amount = Math.floor(Math.random() * 5000) + 5000;
      else amount = Math.floor(Math.random() * 15000) + 10000;
      amount = Math.round(amount / 50) * 50;
      this.fakeBets.push({
        id: `jfake-${i}-${Date.now()}`, userId: `jfake-${name}`, username: name,
        amount, betSlot: 1, autoCashout: null, cashoutAt: null, winAmount: null, status: 'PENDING',
      });
    }
  }

  private simulateFakeCashouts(multiplier: number) {
    for (const f of this.fakeBets) {
      if (f.status !== 'ACTIVE') continue;
      if (Math.random() < 0.005 + (multiplier - 1) * 0.008) {
        f.status = 'WON';
        f.cashoutAt = multiplier;
        f.winAmount = Math.floor(f.amount * multiplier * 100) / 100;
      }
    }
  }

  private crashFakeBets() { for (const f of this.fakeBets) { if (f.status === 'ACTIVE') f.status = 'LOST'; } }
  private activateFakeBets() { for (const f of this.fakeBets) { if (f.status === 'PENDING') f.status = 'ACTIVE'; } }

  private getAllBetsForBroadcast() {
    const real = Array.from(this.activeBets.values()).map(b => ({ ...b }));
    const fake = this.fakeBets.map(b => ({ ...b }));
    return [...real, ...fake].sort((a, b) => b.amount - a.amount);
  }

  private broadcastBets() {
    this.broadcast('jetx:bets', { bets: this.getAllBetsForBroadcast() });
  }

  // ─── STATE GETTERS ───────────────────────────
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

  // ─── ADMIN CONTROLS ──────────────────────────
  async forceRound(roundNumber: number, crashPoint: number, adminId: string) {
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

  async deleteForcedRound(id: string, adminId: string) {
    await this.prisma.forcedRound.delete({ where: { id } });
    await this.logsService.log({ userId: adminId, action: `Deleted JetX forced round: ${id}`, category: 'ADMIN' });
    return { message: 'Forced round deleted' };
  }
}
