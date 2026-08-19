"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AviationPlugin = void 0;
const crypto = __importStar(require("crypto"));
class AviationPlugin {
    constructor() {
        this.gameType = 'AVIATION';
        this.name = 'Aviation';
        this.crashPoint = 1.0;
        this.startTime = 0;
        this.running = false;
        this.speed = 0.0001;
    }
    async initialize() {
    }
    generateCrashPoint() {
        const houseEdge = 0.035;
        const randomBytes = crypto.randomBytes(4);
        const random = randomBytes.readUInt32BE(0) / 0xffffffff;
        if (random < houseEdge) {
            return 1.0;
        }
        const crashPoint = Math.floor((1 / (1 - random)) * 100) / 100;
        return Math.min(crashPoint, 1000);
    }
    startRound(roundId, forcedCrashPoint) {
        this.crashPoint = forcedCrashPoint || this.generateCrashPoint();
        this.startTime = Date.now();
        this.running = true;
    }
    getMultiplier() {
        if (!this.running)
            return 1.0;
        const elapsed = Date.now() - this.startTime;
        const multiplier = 1 + elapsed * this.speed;
        if (multiplier >= this.crashPoint) {
            this.running = false;
            return this.crashPoint;
        }
        return Math.floor(multiplier * 100) / 100;
    }
    getCrashPoint() {
        return this.crashPoint;
    }
    isRunning() {
        if (!this.running)
            return false;
        const elapsed = Date.now() - this.startTime;
        const multiplier = 1 + elapsed * this.speed;
        if (multiplier >= this.crashPoint) {
            this.running = false;
            return false;
        }
        return true;
    }
    getElapsed() {
        if (!this.startTime)
            return 0;
        return Date.now() - this.startTime;
    }
    getStartTime() {
        return this.startTime;
    }
    stop() {
        this.running = false;
    }
    async cleanup() {
        this.running = false;
    }
    setSpeed(speed) {
        this.speed = speed;
    }
}
exports.AviationPlugin = AviationPlugin;
//# sourceMappingURL=aviation.plugin.js.map