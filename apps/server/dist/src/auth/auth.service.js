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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma.service");
const logs_service_1 = require("../logs/logs.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, logsService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.logsService = logsService;
        this.configService = configService;
    }
    async login(username, password, ip, userAgent) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            include: { wallet: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid username or password');
        }
        if (user.status !== 'ACTIVE') {
            throw new common_1.ForbiddenException('Your account has been deactivated. Contact admin.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid username or password');
        }
        const payload = { sub: user.id, username: user.username, role: user.role };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET', 'skybet-refresh-secret'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '7d'),
        });
        await this.prisma.session.create({
            data: {
                userId: user.id,
                token: refreshToken,
                ip: ip || null,
                userAgent: userAgent || null,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        await this.logsService.log({
            userId: user.id,
            action: 'User logged in',
            category: 'AUTH',
            details: { ip, userAgent },
            ip,
            userAgent,
        });
        const { password: _, ...userWithoutPassword } = user;
        return {
            accessToken,
            refreshToken,
            user: {
                ...userWithoutPassword,
                wallet: user.wallet ? { balance: Number(user.wallet.balance) } : null,
            },
        };
    }
    async refreshToken(token) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_REFRESH_SECRET', 'skybet-refresh-secret'),
            });
            const session = await this.prisma.session.findUnique({
                where: { token },
            });
            if (!session || session.expiresAt < new Date()) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user || user.status !== 'ACTIVE') {
                throw new common_1.UnauthorizedException('Account not found or deactivated');
            }
            const newPayload = { sub: user.id, username: user.username, role: user.role };
            const accessToken = this.jwtService.sign(newPayload);
            return { accessToken };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(userId, token) {
        if (token) {
            await this.prisma.session.deleteMany({
                where: { userId, token },
            });
        }
        else {
            await this.prisma.session.deleteMany({
                where: { userId },
            });
        }
        await this.logsService.log({
            userId,
            action: 'User logged out',
            category: 'AUTH',
        });
    }
    async validateUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true },
        });
        if (!user || user.status !== 'ACTIVE') {
            return null;
        }
        const { password, ...result } = user;
        return result;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        logs_service_1.LogsService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map