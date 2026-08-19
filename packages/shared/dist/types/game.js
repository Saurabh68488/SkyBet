"use strict";
// ============================================
// Game Types
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamePhase = exports.RoundStatus = exports.GameType = void 0;
var GameType;
(function (GameType) {
    GameType["AVIATION"] = "AVIATION";
    GameType["MINES"] = "MINES";
    GameType["PLINKO"] = "PLINKO";
    GameType["DICE"] = "DICE";
    GameType["ROULETTE"] = "ROULETTE";
    GameType["COINFLIP"] = "COINFLIP";
    GameType["LUCKYWHEEL"] = "LUCKYWHEEL";
    GameType["DRAGONTIGER"] = "DRAGONTIGER";
    GameType["LIMBO"] = "LIMBO";
    GameType["HILO"] = "HILO";
})(GameType || (exports.GameType = GameType = {}));
var RoundStatus;
(function (RoundStatus) {
    RoundStatus["WAITING"] = "WAITING";
    RoundStatus["BETTING"] = "BETTING";
    RoundStatus["RUNNING"] = "RUNNING";
    RoundStatus["CRASHED"] = "CRASHED";
})(RoundStatus || (exports.RoundStatus = RoundStatus = {}));
var GamePhase;
(function (GamePhase) {
    GamePhase["WAITING"] = "WAITING";
    GamePhase["COUNTDOWN"] = "COUNTDOWN";
    GamePhase["RUNNING"] = "RUNNING";
    GamePhase["CRASHED"] = "CRASHED";
})(GamePhase || (exports.GamePhase = GamePhase = {}));
