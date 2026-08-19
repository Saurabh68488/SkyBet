"use strict";
// ============================================
// Shared Constants
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGINATION = exports.AUTH = exports.CURRENCY = exports.GAME_DEFAULTS = void 0;
exports.GAME_DEFAULTS = {
    COUNTDOWN_DURATION: 15, // seconds
    MIN_BET: 10,
    MAX_BET: 1000000,
    COMMISSION_RATE: 0.10, // 10%
    TICK_RATE: 50, // ms between ticks (20 ticks/sec)
    MULTIPLIER_SPEED: 0.00006, // exponential growth speed
    MAX_MULTIPLIER: 1000, // safety cap
    BET_SLOTS: 2, // support dual betting
};
exports.CURRENCY = {
    NAME: 'Coins',
    SYMBOL: '🪙',
    DECIMAL_PLACES: 2,
};
exports.AUTH = {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    MIN_PASSWORD_LENGTH: 6,
    MAX_USERNAME_LENGTH: 30,
};
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
