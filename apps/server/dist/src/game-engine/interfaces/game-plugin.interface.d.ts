export interface IGamePlugin {
    gameType: string;
    name: string;
    initialize(): Promise<void>;
    startRound(roundId: string, forcedCrashPoint?: number): void;
    getMultiplier(): number;
    getCrashPoint(): number;
    isRunning(): boolean;
    getElapsed(): number;
    stop(): void;
    cleanup(): Promise<void>;
}
export interface GameRoundResult {
    crashPoint: number;
    duration: number;
}
