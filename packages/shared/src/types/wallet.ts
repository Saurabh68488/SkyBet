// ============================================
// Wallet Types
// ============================================

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  BET_PLACE = 'BET_PLACE',
  BET_WIN = 'BET_WIN',
  BET_REFUND = 'BET_REFUND',
  COMMISSION = 'COMMISSION',
  MANUAL_ADJUST = 'MANUAL_ADJUST',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
}

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface AdjustBalanceDto {
  userId: string;
  amount: number;
  type: 'add' | 'remove';
  note?: string;
}
