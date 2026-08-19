// ============================================
// Bet Types
// ============================================

export enum BetStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  WON = 'WON',
  LOST = 'LOST',
  CANCELLED = 'CANCELLED',
}

export interface Bet {
  id: string;
  userId: string;
  roundId: string;
  amount: number;
  betSlot: number;
  autoCashout: number | null;
  cashoutAt: number | null;
  winAmount: number | null;
  status: BetStatus;
  commission: number;
  createdAt: string;
  updatedAt: string;
  round?: {
    roundNumber: number;
    crashPoint: number;
    gameType: string;
  };
  user?: {
    username: string;
    name: string;
  };
}

export interface PlaceBetDto {
  amount: number;
  autoCashout?: number;
  betSlot: number; // 1 or 2
}

export interface CashoutDto {
  betSlot: number;
}
