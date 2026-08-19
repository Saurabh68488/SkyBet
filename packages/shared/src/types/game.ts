// ============================================
// Game Types
// ============================================

export enum GameType {
  AVIATION = 'AVIATION',
  MINES = 'MINES',
  PLINKO = 'PLINKO',
  DICE = 'DICE',
  ROULETTE = 'ROULETTE',
  COINFLIP = 'COINFLIP',
  LUCKYWHEEL = 'LUCKYWHEEL',
  DRAGONTIGER = 'DRAGONTIGER',
  LIMBO = 'LIMBO',
  HILO = 'HILO',
}

export enum RoundStatus {
  WAITING = 'WAITING',
  BETTING = 'BETTING',
  RUNNING = 'RUNNING',
  CRASHED = 'CRASHED',
}

export enum GamePhase {
  WAITING = 'WAITING',
  COUNTDOWN = 'COUNTDOWN',
  RUNNING = 'RUNNING',
  CRASHED = 'CRASHED',
}

export interface GameRound {
  id: string;
  roundNumber: number;
  gameType: GameType;
  crashPoint: number;
  status: RoundStatus;
  isForced: boolean;
  totalBets: number;
  totalPayouts: number;
  commission: number;
  startedAt: string | null;
  crashedAt: string | null;
  createdAt: string;
}

export interface GameState {
  phase: GamePhase;
  roundId: string | null;
  roundNumber: number;
  multiplier: number;
  countdown: number;
  startTime: number | null;
  crashPoint: number | null; // Only revealed after crash
  bets: LiveBet[];
  history: RoundHistory[];
}

export interface LiveBet {
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

export interface RoundHistory {
  roundNumber: number;
  crashPoint: number;
  createdAt: string;
}

export interface GameConfig {
  id: string;
  gameType: GameType;
  name: string;
  description: string | null;
  enabled: boolean;
  visible: boolean;
  minBet: number;
  maxBet: number;
  settings: Record<string, any> | null;
}

export interface ForcedRound {
  id: string;
  roundNumber: number;
  crashPoint: number;
  gameType: GameType;
  executed: boolean;
  createdBy: string;
  createdAt: string;
}
