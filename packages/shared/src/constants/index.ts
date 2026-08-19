// ============================================
// Shared Constants
// ============================================

export const GAME_DEFAULTS = {
  COUNTDOWN_DURATION: 15, // seconds
  MIN_BET: 10,
  MAX_BET: 1000000,
  COMMISSION_RATE: 0.10, // 10%
  TICK_RATE: 50, // ms between ticks (20 ticks/sec)
  MULTIPLIER_SPEED: 0.00006, // exponential growth speed
  MAX_MULTIPLIER: 1000, // safety cap
  BET_SLOTS: 2, // support dual betting
} as const;

export const CURRENCY = {
  NAME: 'Coins',
  SYMBOL: '🪙',
  DECIMAL_PLACES: 2,
} as const;

export const AUTH = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  MIN_PASSWORD_LENGTH: 6,
  MAX_USERNAME_LENGTH: 30,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
