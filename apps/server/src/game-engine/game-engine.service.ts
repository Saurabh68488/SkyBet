// ============================================
// Game Engine Service
// The central orchestrator for game rounds.
// Manages: countdown → betting → running → crash → repeat
// ============================================

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { SettingsService } from '../settings/settings.service';
import { LogsService } from '../logs/logs.service';
import { AviationPlugin } from './plugins/aviation/aviation.plugin';

export interface ActiveBet {
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
export class GameEngineService implements OnModuleInit {
  private readonly logger = new Logger('GameEngine');
  private plugin: AviationPlugin;
  private phase: GamePhase = 'WAITING';
  private currentRoundId: string | null = null;
  private currentRoundNumber: number = 0;
  private countdown: number = 15;
  private countdownInterval: NodeJS.Timeout | null = null;
  private tickInterval: NodeJS.Timeout | null = null;
  private activeBets: Map<string, ActiveBet> = new Map(); // betId -> bet
  private nextRoundBets: Array<{ userId: string; username: string; amount: number; betSlot: number; autoCashout?: number }> = [];
  private startTime: number = 0;
  private crashPoint: number = 0;

  // Socket.IO server reference — set by the gateway
  private broadcastFn: ((event: string, data: any) => void) | null = null;
  private sendToUserFn: ((userId: string, event: string, data: any) => void) | null = null;

  private history: Array<{ roundNumber: number; crashPoint: number; createdAt: string }> = [];

  // ─── FAKE BETS SYSTEM (never touches DB) ──────
  private fakeBets: ActiveBet[] = [];
  private readonly FAKE_NAMES = [
    'Ravi_K', 'Priya_S', 'Amit_22', 'Sneha_M', 'Arjun_P', 'Divya_R', 'Karan_J',
    'Neha_99', 'Vikram_D', 'Pooja_L', 'Rahul_T', 'Anita_G', 'Suresh_B', 'Meena_V',
    'Rohit_N', 'Kavita_C', 'Deepak_H', 'Sunita_W', 'Manish_F', 'Rekha_X',
    'Lucky_777', 'King_Bet', 'Pro_Gamer', 'HighRoll', 'StarPlay', 'MegaWin',
    'Golden_7', 'BetKing1', 'WinnerX', 'CashPro', 'BigBoss_', 'RichPlay',
    'TopGun22', 'FastBet1', 'MoneyMvr', 'AllIn_99', 'JackPot1', 'SkyHigh_',
    'Diamond_', 'Royal_BT', 'Flash_77', 'Storm_99', 'Blaze_11', 'Thunder_',
    'Phantom_', 'Legend_X', 'NightOwl', 'FireBet_', 'IceKing_', 'ShadowBT',
  ];

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private settingsService: SettingsService,
    private logsService: LogsService,
  ) {
    this.plugin = new AviationPlugin();
  }

  async onModuleInit() {
    await this.plugin.initialize();

    // Load recent round history
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

    // Get last round number FOR THIS GAME TYPE
    const lastRound = await this.prisma.gameRound.findFirst({
      where: { gameType: 'AVIATION' },
      orderBy: { roundNumber: 'desc' },
    });
    this.currentRoundNumber = lastRound ? lastRound.roundNumber : 0;

    this.logger.log('Game engine initialized');

    // Start the game loop after a short delay (wait for socket gateway)
    setTimeout(() => this.startCountdown(), 3000);
  }


  // Called by the gateway to set broadcast functions
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

  // ─── ROUND LIFECYCLE ─────────────────────────

  private async startCountdown() {
    this.phase = 'COUNTDOWN';
    this.activeBets.clear();

    // Process queued next-round bets
    const queuedBets = [...this.nextRoundBets];
    this.nextRoundBets = [];
    this.currentRoundNumber++;

    const settings = await this.settingsService.getSettings();
    this.countdown = settings.countdownDuration || 15;

    // Check for forced round
    const forcedRound = await this.prisma.forcedRound.findFirst({
      where: { roundNumber: this.currentRoundNumber, executed: false, gameType: 'AVIATION' },
    });

    // Read multiplier limits from GameConfig
    const gameConfig = await this.prisma.gameConfig.findUnique({ where: { gameType: 'AVIATION' } });
    const minMult = gameConfig ? Number(gameConfig.minMultiplier) : 1.0;
    const maxMult = gameConfig ? Number(gameConfig.maxMultiplier) : 1000.0;

    // Generate crash point within admin-defined range
    let crashPoint: number;
    if (forcedRound) {
      crashPoint = Number(forcedRound.crashPoint);
    } else {
      // Keep regenerating until within [minMult, maxMult] range
      let attempts = 0;
      do {
        crashPoint = this.plugin.generateCrashPoint();
        attempts++;
      } while ((crashPoint < minMult || crashPoint > maxMult) && attempts < 100);
      // Final clamp as safety
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
    } catch (e: any) {
      if (e?.code === 'P2002') {
        // Duplicate round — find the actual max and retry
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
      this.logger.log(`Forced round ${this.currentRoundNumber}: crash at ${crashPoint}x`);
    }

    this.logger.log(`Round ${this.currentRoundNumber} countdown started (crash: ${crashPoint}x)`);

    // Auto-place queued bets from previous round
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
        const activeBet: ActiveBet = {
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
          message: `Queued bet placed: ${qb.amount} Coins (slot ${qb.betSlot})`,
        });
        this.logger.log(`Queued bet placed for ${qb.username}: ${qb.amount} Coins`);
      } catch (err) {
        // Refund if bet creation fails
        try {
          await this.walletService.credit(qb.userId, qb.amount, 'BET_REFUND', this.currentRoundId!);
          this.sendToUser(qb.userId, 'notification', { type: 'error', message: 'Queued bet failed, refunded.' });
        } catch {}
      }
    }

    // Generate fake bets for this round
    this.generateFakeBets();

    // Broadcast countdown
    this.broadcast('game:countdown', {
      secondsLeft: this.countdown,
      roundNumber: this.currentRoundNumber,
      roundId: this.currentRoundId,
    });

    // Broadcast initial bets (fake + any queued)
    this.broadcastBets();

    // Countdown timer
    this.countdownInterval = setInterval(() => {
      this.countdown--;

      this.broadcast('game:countdown', {
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

    // Start the plugin
    this.plugin.startRound(this.currentRoundId!, this.crashPoint);

    // Update DB
    await this.prisma.gameRound.update({
      where: { id: this.currentRoundId! },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    // Mark all pending bets as active
    for (const [betId, bet] of this.activeBets) {
      if (bet.status === 'PENDING') {
        bet.status = 'ACTIVE';
      }
    }
    this.activateFakeBets();

    // Broadcast start
    this.broadcast('game:start', {
      roundId: this.currentRoundId,
      roundNumber: this.currentRoundNumber,
      startTime: this.startTime,
    });

    // Broadcast updated bets
    this.broadcastBets();

    this.logger.log(`Round ${this.currentRoundNumber} STARTED`);

    // Start tick loop
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 50); // 20 ticks/sec
  }

  private async tick() {
    if (this.phase !== 'RUNNING') return;

    const multiplier = this.plugin.getMultiplier();
    const elapsed = this.plugin.getElapsed();

    // Check auto-cashouts (real bets)
    for (const [betId, bet] of this.activeBets) {
      const autoCashoutVal = bet.autoCashout ? Number(bet.autoCashout) : 0;
      if (
        bet.status === 'ACTIVE' &&
        autoCashoutVal > 0 &&
        multiplier >= autoCashoutVal
      ) {
        await this.processCashout(bet.userId, bet.betSlot, autoCashoutVal);
      }
    }

    // Simulate fake player cashouts
    const prevActive = this.fakeBets.filter(b => b.status === 'ACTIVE').length;
    this.simulateFakeCashouts(multiplier);
    const nowActive = this.fakeBets.filter(b => b.status === 'ACTIVE').length;
    if (prevActive !== nowActive) {
      this.broadcastBets(); // broadcast when fake players cash out
    }

    // Check if crashed
    if (!this.plugin.isRunning()) {
      this.handleCrash();
      return;
    }

    // Broadcast tick
    this.broadcast('game:tick', { multiplier, elapsed });
  }

  private async handleCrash() {
    if (this.phase === 'CRASHED') return; // Prevent double crash
    this.phase = 'CRASHED';

    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = null;

    // Crash all remaining fake bets
    this.crashFakeBets();

    const crashPoint = this.crashPoint;
    this.logger.log(`Round ${this.currentRoundNumber} CRASHED at ${crashPoint}x`);

    // Process all remaining active bets as losses
    let totalBets = 0;
    let totalPayouts = 0;
    let totalCommission = 0;

    for (const [betId, bet] of this.activeBets) {
      totalBets += bet.amount;

      if (bet.status === 'ACTIVE') {
        // Lost — didn't cash out in time
        bet.status = 'LOST';
        await this.prisma.bet.update({
          where: { id: bet.id },
          data: { status: 'LOST' },
        });
      } else if (bet.cashoutAt) {
        // Already cashed out
        totalPayouts += bet.winAmount || 0;
      }

      // Commission on all bets
      const settings = await this.settingsService.getSettings();
      const commission = bet.amount * settings.commissionRate;
      totalCommission += commission;
      await this.prisma.bet.update({
        where: { id: bet.id },
        data: { commission },
      });
    }

    // Update round
    await this.prisma.gameRound.update({
      where: { id: this.currentRoundId! },
      data: {
        status: 'CRASHED',
        crashedAt: new Date(),
        totalBets,
        totalPayouts,
        commission: totalCommission,
      },
    });

    // Add to history
    this.history.push({
      roundNumber: this.currentRoundNumber,
      crashPoint,
      createdAt: new Date().toISOString(),
    });
    if (this.history.length > 20) this.history.shift();

    // Broadcast crash
    this.broadcast('game:crash', {
      crashPoint,
      roundId: this.currentRoundId,
      roundNumber: this.currentRoundNumber,
    });

    // Broadcast final bets state
    this.broadcastBets();

    // Log
    await this.logsService.log({
      action: `Round ${this.currentRoundNumber} crashed at ${crashPoint}x`,
      category: 'GAME',
      details: { roundNumber: this.currentRoundNumber, crashPoint, totalBets, totalPayouts, totalCommission },
    });

    // Wait 4 seconds then start next round
    setTimeout(() => this.startCountdown(), 4000);
  }

  // ─── BET HANDLING ────────────────────────────

  async placeBet(userId: string, username: string, amount: number, betSlot: number, autoCashout?: number): Promise<{ success: boolean; message: string; bet?: any }> {
    // If game is RUNNING or CRASHED, queue bet for next round
    if (this.phase === 'RUNNING' || this.phase === 'CRASHED') {
      // Check duplicate in queue
      const alreadyQueued = this.nextRoundBets.find(b => b.userId === userId && b.betSlot === betSlot);
      if (alreadyQueued) {
        return { success: false, message: `Already queued a bet on slot ${betSlot} for next round.` };
      }
      // Validate amount
      if (amount < 10) return { success: false, message: 'Minimum bet is 10 Coins.' };
      // Pre-debit wallet now
      try {
        await this.walletService.debit(userId, amount, 'BET_PLACE', this.currentRoundId!);
      } catch (error: any) {
        return { success: false, message: error.message || 'Insufficient balance.' };
      }
      this.nextRoundBets.push({ userId, username, amount, betSlot, autoCashout });
      // Send balance update
      const balance = await this.walletService.getBalance(userId);
      this.sendToUser(userId, 'player:balance', { balance });
      this.sendToUser(userId, 'notification', { type: 'success', message: `Bet queued for next round: ${amount} Coins (slot ${betSlot})` });
      return { success: true, message: 'Bet queued for next round' };
    }

    // Validate phase - must be COUNTDOWN
    if (this.phase !== 'COUNTDOWN') {
      return { success: false, message: 'Betting is closed. Wait for next round.' };
    }

    // Validate bet slot (1 or 2)
    if (betSlot !== 1 && betSlot !== 2) {
      return { success: false, message: 'Invalid bet slot.' };
    }

    // Check if already bet on this slot
    for (const [_, bet] of this.activeBets) {
      if (bet.userId === userId && bet.betSlot === betSlot) {
        return { success: false, message: `You already placed a bet on slot ${betSlot}.` };
      }
    }

    // Validate amount
    if (amount < 10) {
      return { success: false, message: 'Minimum bet is 10 Coins.' };
    }

    // Debit wallet
    try {
      await this.walletService.debit(userId, amount, 'BET_PLACE', this.currentRoundId!);
    } catch (error: any) {
      return { success: false, message: error.message || 'Insufficient balance.' };
    }

    // Create bet in DB
    const bet = await this.prisma.bet.create({
      data: {
        userId,
        roundId: this.currentRoundId!,
        amount,
        betSlot,
        autoCashout: autoCashout || null,
        status: 'PENDING',
      },
    });

    // Add to active bets
    const activeBet: ActiveBet = {
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

    // Broadcast updated bets
    this.broadcastBets();

    // Send balance update to user
    const balance = await this.walletService.getBalance(userId);
    this.sendToUser(userId, 'player:balance', { balance });

    // Notification
    this.sendToUser(userId, 'notification', {
      type: 'success',
      message: `Bet placed: ${amount} Coins on slot ${betSlot}`,
    });

    await this.logsService.log({
      userId,
      action: `Placed bet: ${amount} Coins (slot ${betSlot})`,
      category: 'BET',
      details: { amount, betSlot, autoCashout, roundNumber: this.currentRoundNumber },
    });

    return { success: true, message: 'Bet placed successfully', bet: activeBet };
  }

  async processCashout(userId: string, betSlot: number, forcedMultiplier?: number): Promise<{ success: boolean; message: string; cashout?: any }> {
    if (this.phase !== 'RUNNING') {
      return { success: false, message: 'Game is not running.' };
    }

    // Find the user's active bet on this slot
    let targetBet: ActiveBet | null = null;
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

    // Update bet
    targetBet.cashoutAt = multiplier;
    targetBet.winAmount = winAmount;
    targetBet.status = 'WON';

    // Credit wallet
    await this.walletService.credit(userId, winAmount, 'BET_WIN', this.currentRoundId!);

    // Update DB
    await this.prisma.bet.update({
      where: { id: targetBet.id },
      data: {
        cashoutAt: multiplier,
        winAmount,
        status: 'WON',
      },
    });

    // Broadcast cashout
    this.broadcast('game:cashout', {
      userId,
      username: targetBet.username,
      multiplier,
      winAmount,
      betSlot,
    });

    // Broadcast updated bets list
    this.broadcastBets();

    // Send balance update
    const balance = await this.walletService.getBalance(userId);
    this.sendToUser(userId, 'player:balance', { balance });

    // Notification
    this.sendToUser(userId, 'notification', {
      type: 'success',
      message: `Cashed out at ${multiplier.toFixed(2)}x! Won ${winAmount.toFixed(2)} Coins`,
    });

    await this.logsService.log({
      userId,
      action: `Cashed out at ${multiplier}x: won ${winAmount} Coins`,
      category: 'CASHOUT',
      details: { multiplier, winAmount, betSlot, roundNumber: this.currentRoundNumber },
    });

    return {
      success: true,
      message: 'Cashout successful',
      cashout: { multiplier, winAmount },
    };
  }

  // ─── FAKE BETS MANAGEMENT ─────────────────────

  private generateFakeBets() {
    this.fakeBets = [];
    const numFake = Math.floor(Math.random() * 13) + 8; // 8 to 20 fake players
    const usedNames = new Set<string>();

    for (let i = 0; i < numFake; i++) {
      let name: string;
      do {
        name = this.FAKE_NAMES[Math.floor(Math.random() * this.FAKE_NAMES.length)];
      } while (usedNames.has(name));
      usedNames.add(name);

      // Random amount: 300 to 25000 (weighted toward lower amounts)
      const rand = Math.random();
      let amount: number;
      if (rand < 0.5) amount = Math.floor(Math.random() * 1700) + 300;         // 300-2000 (50%)
      else if (rand < 0.8) amount = Math.floor(Math.random() * 3000) + 2000;    // 2000-5000 (30%)
      else if (rand < 0.95) amount = Math.floor(Math.random() * 5000) + 5000;   // 5000-10000 (15%)
      else amount = Math.floor(Math.random() * 15000) + 10000;                  // 10000-25000 (5%)

      // Round to nearest 50
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

  private simulateFakeCashouts(multiplier: number) {
    for (const fake of this.fakeBets) {
      if (fake.status !== 'ACTIVE') continue;

      // Random chance to cash out each tick based on multiplier
      const cashoutChance = 0.005 + (multiplier - 1) * 0.008;
      if (Math.random() < cashoutChance) {
        fake.status = 'WON';
        fake.cashoutAt = multiplier;
        fake.winAmount = Math.floor(fake.amount * multiplier * 100) / 100;
      }
    }
  }

  private crashFakeBets() {
    for (const fake of this.fakeBets) {
      if (fake.status === 'ACTIVE') {
        fake.status = 'LOST';
      }
    }
  }

  private activateFakeBets() {
    for (const fake of this.fakeBets) {
      if (fake.status === 'PENDING') {
        fake.status = 'ACTIVE';
      }
    }
  }

  // ─── BROADCAST HELPERS ───────────────────────

  private getAllBetsForBroadcast() {
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
    // Mix real + fake and sort by amount descending
    return [...realBets, ...fakeBetsData].sort((a, b) => b.amount - a.amount);
  }

  private broadcastBets() {
    this.broadcast('game:bets', { bets: this.getAllBetsForBroadcast() });
  }

  // ─── STATE GETTERS ───────────────────────────

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

  // ─── ADMIN CONTROLS ──────────────────────────

  async forceRound(roundNumber: number, crashPoint: number, adminId: string) {
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

  async deleteForcedRound(id: string, adminId: string) {
    await this.prisma.forcedRound.delete({ where: { id } });
    await this.logsService.log({
      userId: adminId,
      action: `Deleted forced round: ${id}`,
      category: 'ADMIN',
    });
    return { message: 'Forced round deleted' };
  }
}
