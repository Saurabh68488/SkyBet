"use strict";
// ============================================
// Bet Types
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetStatus = void 0;
var BetStatus;
(function (BetStatus) {
    BetStatus["PENDING"] = "PENDING";
    BetStatus["ACTIVE"] = "ACTIVE";
    BetStatus["WON"] = "WON";
    BetStatus["LOST"] = "LOST";
    BetStatus["CANCELLED"] = "CANCELLED";
})(BetStatus || (exports.BetStatus = BetStatus = {}));
