// ============================================
// Socket.IO Event Types
// ============================================

// Server -> Client events
export interface ServerToClientEvents {
  'game:countdown': (data: CountdownPayload) => void;
  'game:start': (data: GameStartPayload) => void;
  'game:tick': (data: GameTickPayload) => void;
  'game:crash': (data: GameCrashPayload) => void;
  'game:bets': (data: GameBetsPayload) => void;
  'game:cashout': (data: GameCashoutPayload) => void;
  'game:state': (data: GameStatePayload) => void;
  'player:balance': (data: BalancePayload) => void;
  'notification': (data: NotificationPayload) => void;
  'online:count': (data: { count: number }) => void;
}

// Client -> Server events
export interface ClientToServerEvents {
  'bet:place': (data: PlaceBetPayload, callback: (res: BetResponse) => void) => void;
  'bet:cashout': (data: CashoutPayload, callback: (res: CashoutResponse) => void) => void;
  'game:join': (data: { gameType: string }) => void;
}

// Payload types
export interface CountdownPayload {
  secondsLeft: number;
  roundNumber: number;
  roundId: string;
}

export interface GameStartPayload {
  roundId: string;
  roundNumber: number;
  startTime: number; // Unix timestamp ms
}

export interface GameTickPayload {
  multiplier: number;
  elapsed: number; // ms since start
}

export interface GameCrashPayload {
  crashPoint: number;
  roundId: string;
  roundNumber: number;
}

export interface GameBetsPayload {
  bets: Array<{
    id: string;
    userId: string;
    username: string;
    amount: number;
    betSlot: number;
    autoCashout: number | null;
    cashoutAt: number | null;
    winAmount: number | null;
    status: string;
  }>;
}

export interface GameCashoutPayload {
  userId: string;
  username: string;
  multiplier: number;
  winAmount: number;
  betSlot: number;
}

export interface GameStatePayload {
  phase: string;
  roundId: string | null;
  roundNumber: number;
  multiplier: number;
  countdown: number;
  startTime: number | null;
  crashPoint: number | null;
  bets: Array<{
    id: string;
    userId: string;
    username: string;
    amount: number;
    betSlot: number;
    autoCashout: number | null;
    cashoutAt: number | null;
    winAmount: number | null;
    status: string;
  }>;
  history: Array<{
    roundNumber: number;
    crashPoint: number;
    createdAt: string;
  }>;
}

export interface BalancePayload {
  balance: number;
}

export interface NotificationPayload {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export interface PlaceBetPayload {
  amount: number;
  autoCashout?: number;
  betSlot: number;
}

export interface CashoutPayload {
  betSlot: number;
}

export interface BetResponse {
  success: boolean;
  message: string;
  bet?: any;
}

export interface CashoutResponse {
  success: boolean;
  message: string;
  cashout?: {
    multiplier: number;
    winAmount: number;
  };
}
