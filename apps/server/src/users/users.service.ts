// ============================================
// Users Service
// ============================================

import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  async createUser(data: {
    username: string;
    password: string;
    name: string;
    phone?: string;
    role?: string;
    status?: string;
    initialBalance?: number;
  }, createdByAdminId?: string) {
    // Check for duplicate username
    const existing = await this.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const role = data.role === 'ADMIN' ? 'ADMIN' : 'PLAYER';

    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        plainPassword: data.password, // Store plain password for admin viewing
        name: data.name,
        phone: data.phone || null,
        role,
        status: data.status || 'ACTIVE',
        wallet: {
          create: {
            balance: data.initialBalance || 0,
          },
        },
      },
      include: { wallet: true },
    });

    await this.logsService.log({
      userId: createdByAdminId,
      action: `Created ${role.toLowerCase()}: ${user.username}`,
      category: 'ADMIN',
      details: { newUserId: user.id, username: user.username, role },
    });

    const { password, plainPassword, ...result } = user;
    return {
      ...result,
      wallet: user.wallet ? { balance: Number(user.wallet.balance) } : null,
    };
  }

  async findAll(options: { page?: number; limit?: number; search?: string; status?: string }) {
    const { page = 1, limit = 20, search, status } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { name: { contains: search } },
        { playerId: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { wallet: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map(({ password, plainPassword, ...user }) => ({
        ...user,
        // Only include plain password for PLAYER accounts, never for ADMIN
        plainPassword: user.role === 'PLAYER' ? plainPassword : null,
        wallet: user.wallet ? { balance: Number(user.wallet.balance) } : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { wallet: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { password, plainPassword, ...result } = user;
    return {
      ...result,
      wallet: user.wallet ? { balance: Number(user.wallet.balance) } : null,
    };
  }

  async updateUser(id: string, data: { name?: string; phone?: string; status?: string }, adminId?: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { wallet: true },
    });

    await this.logsService.log({
      userId: adminId,
      action: `Updated user: ${user.username}`,
      category: 'ADMIN',
      details: { targetUserId: id, changes: data },
    });

    const { password, plainPassword, ...result } = user;
    return {
      ...result,
      wallet: user.wallet ? { balance: Number(user.wallet.balance) } : null,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new ConflictException('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, plainPassword: newPassword },
    });

    await this.logsService.log({
      userId,
      action: 'Password changed',
      category: 'AUTH',
    });

    return { message: 'Password changed successfully' };
  }

  // Admin changes a PLAYER's password (no current password required)
  async adminChangePassword(targetUserId: string, newPassword: string, adminId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');

    // Block changing other admin passwords
    if (target.role === 'ADMIN') {
      throw new ForbiddenException('Cannot change another admin\'s password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { password: hashedPassword, plainPassword: newPassword },
    });

    await this.logsService.log({
      userId: adminId,
      action: `Changed password for player: ${target.username}`,
      category: 'ADMIN',
      details: { targetUserId, targetUsername: target.username },
    });

    return { message: `Password changed for ${target.username}` };
  }

  // Admin views a PLAYER's password
  async adminGetPassword(targetUserId: string, adminId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');

    // Block viewing other admin passwords
    if (target.role === 'ADMIN') {
      throw new ForbiddenException('Cannot view another admin\'s password');
    }

    await this.logsService.log({
      userId: adminId,
      action: `Viewed password for player: ${target.username}`,
      category: 'ADMIN',
      details: { targetUserId, targetUsername: target.username },
    });

    return {
      userId: target.id,
      username: target.username,
      plainPassword: target.plainPassword || '(not stored — password was set before this feature)',
    };
  }

  async toggleStatus(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });

    await this.logsService.log({
      userId: adminId,
      action: `${newStatus === 'ACTIVE' ? 'Activated' : 'Deactivated'} user: ${user.username}`,
      category: 'ADMIN',
      details: { targetUserId: id, newStatus },
    });

    return { id: updated.id, status: updated.status };
  }
}
