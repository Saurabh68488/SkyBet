// ============================================
// Aviation (Crash) Game Plugin
// Core game logic — LINEAR multiplier,
// crash point generation, round lifecycle
// ============================================

import { IGamePlugin } from '../../interfaces/game-plugin.interface';
import * as crypto from 'crypto';

export class AviationPlugin implements IGamePlugin {
  gameType = 'AVIATION';
  name = 'Aviation';

  private crashPoint: number = 1.0;
  private startTime: number = 0;
  private running: boolean = false;
  // Linear speed: 0.1x per second = 0.0001x per ms
  // 2x at 10s, 5x at 40s, 10x at 90s
  private speed: number = 0.0001;

  async initialize(): Promise<void> {
    // No special initialization needed
  }

  /**
   * Generate a provably fair crash point
   * House edge ~3.5% — crash at 1.00x ~3.5% of the time
   */
  generateCrashPoint(): number {
    const houseEdge = 0.035;
    const randomBytes = crypto.randomBytes(4);
    const random = randomBytes.readUInt32BE(0) / 0xffffffff;

    // ~3.5% chance of instant crash at 1.00x
    if (random < houseEdge) {
      return 1.0;
    }

    // Inverse function for exponential distribution
    const crashPoint = Math.floor((1 / (1 - random)) * 100) / 100;

    // Cap at 1000x for safety
    return Math.min(crashPoint, 1000);
  }

  startRound(roundId: string, forcedCrashPoint?: number): void {
    this.crashPoint = forcedCrashPoint || this.generateCrashPoint();
    this.startTime = Date.now();
    this.running = true;
  }

  /**
   * Calculate current multiplier from elapsed time
   * LINEAR formula: multiplier = 1 + elapsed * speed
   * Constant rate of increase throughout the round
   */
  getMultiplier(): number {
    if (!this.running) return 1.0;

    const elapsed = Date.now() - this.startTime;
    const multiplier = 1 + elapsed * this.speed;

    // Check if we've hit the crash point
    if (multiplier >= this.crashPoint) {
      this.running = false;
      return this.crashPoint;
    }

    return Math.floor(multiplier * 100) / 100;
  }

  getCrashPoint(): number {
    return this.crashPoint;
  }

  isRunning(): boolean {
    if (!this.running) return false;

    // Also check if multiplier has exceeded crash point
    const elapsed = Date.now() - this.startTime;
    const multiplier = 1 + elapsed * this.speed;
    if (multiplier >= this.crashPoint) {
      this.running = false;
      return false;
    }

    return true;
  }

  getElapsed(): number {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime;
  }

  getStartTime(): number {
    return this.startTime;
  }

  stop(): void {
    this.running = false;
  }

  async cleanup(): Promise<void> {
    this.running = false;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }
}
