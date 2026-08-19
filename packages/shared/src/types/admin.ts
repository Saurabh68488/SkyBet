// ============================================
// Admin Types
// ============================================

export interface PlatformSettings {
  id: string;
  commissionRate: number;
  countdownDuration: number;
  maintenanceMode: boolean;
}

export interface UpdateSettingsDto {
  commissionRate?: number;
  countdownDuration?: number;
  maintenanceMode?: boolean;
}

export interface DashboardStats {
  onlineUsers: number;
  totalUsers: number;
  activeUsers: number;
  todayBets: number;
  todayBetAmount: number;
  todayWins: number;
  todayWinAmount: number;
  todayLosses: number;
  todayCommission: number;
  currentRound: number;
  gamePhase: string;
  pendingForcedRounds: number;
}

export interface ForceRoundDto {
  roundNumber: number;
  crashPoint: number;
  gameType?: string;
}

export enum LogCategory {
  AUTH = 'AUTH',
  BET = 'BET',
  CASHOUT = 'CASHOUT',
  BALANCE = 'BALANCE',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
  GAME = 'GAME',
}

export interface Log {
  id: string;
  userId: string | null;
  action: string;
  category: LogCategory;
  details: Record<string, any> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    username: string;
    name: string;
  };
}
