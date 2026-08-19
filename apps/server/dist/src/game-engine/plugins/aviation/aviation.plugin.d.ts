import { IGamePlugin } from '../../interfaces/game-plugin.interface';
export declare class AviationPlugin implements IGamePlugin {
    gameType: string;
    name: string;
    private crashPoint;
    private startTime;
    private running;
    private speed;
    initialize(): Promise<void>;
    generateCrashPoint(): number;
    startRound(roundId: string, forcedCrashPoint?: number): void;
    getMultiplier(): number;
    getCrashPoint(): number;
    isRunning(): boolean;
    getElapsed(): number;
    getStartTime(): number;
    stop(): void;
    cleanup(): Promise<void>;
    setSpeed(speed: number): void;
}
