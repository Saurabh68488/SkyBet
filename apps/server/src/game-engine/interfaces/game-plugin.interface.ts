// ============================================
// Game Plugin Interface
// All game modules must implement this contract
// ============================================

export interface IGamePlugin {
  /** Unique game type identifier */
  gameType: string;

  /** Display name */
  name: string;

  /** Initialize the plugin */
  initialize(): Promise<void>;

  /** Start a new round */
  startRound(roundId: string, forcedCrashPoint?: number): void;

  /** Get current round state */
  getMultiplier(): number;

  /** Get crash point (only after crash) */
  getCrashPoint(): number;

  /** Check if round is running */
  isRunning(): boolean;

  /** Get elapsed time in ms */
  getElapsed(): number;

  /** Stop the round (crash) */
  stop(): void;

  /** Cleanup resources */
  cleanup(): Promise<void>;
}

export interface GameRoundResult {
  crashPoint: number;
  duration: number; // ms
}
