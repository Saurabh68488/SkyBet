"use strict";
// ============================================
// Wallet Types
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionStatus = exports.TransactionType = void 0;
var TransactionType;
(function (TransactionType) {
    TransactionType["DEPOSIT"] = "DEPOSIT";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
    TransactionType["BET_PLACE"] = "BET_PLACE";
    TransactionType["BET_WIN"] = "BET_WIN";
    TransactionType["BET_REFUND"] = "BET_REFUND";
    TransactionType["COMMISSION"] = "COMMISSION";
    TransactionType["MANUAL_ADJUST"] = "MANUAL_ADJUST";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["COMPLETED"] = "COMPLETED";
    TransactionStatus["FAILED"] = "FAILED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
