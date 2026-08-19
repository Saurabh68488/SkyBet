// ============================================
// Auth Service - Login, Token Management
// ============================================

import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private logsService: LogsService,
    private configService: ConfigService,
  ) {}

  async login(username: string, password: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { wallet: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Your account has been deactivated. Contact admin.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Generate tokens
    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', 'skybet-refresh-secret'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '7d'),
    });

    // Store session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        ip: ip || null,
        userAgent: userAgent || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Log login
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

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'skybet-refresh-secret'),
      });

      const session = await this.prisma.session.findUnique({
        where: { token },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Account not found or deactivated');
      }

      const newPayload = { sub: user.id, username: user.username, role: user.role };
      const accessToken = this.jwtService.sign(newPayload);

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, token?: string) {
    if (token) {
      await this.prisma.session.deleteMany({
        where: { userId, token },
      });
    } else {
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

  async validateUser(userId: string) {
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
}
