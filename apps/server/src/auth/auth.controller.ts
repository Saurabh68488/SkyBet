// ============================================
// Auth Controller
// ============================================

import { Controller, Post, Body, Req, UseGuards, Get, HttpCode, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { Request } from 'express';

class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with username and password' })
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Headers('user-agent') userAgent: string,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '';
    return this.authService.login(body.username, body.password, ip, userAgent);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() body: RefreshDto) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout and invalidate session' })
  async logout(@Req() req: any) {
    await this.authService.logout(req.user.id);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Req() req: any) {
    const user = await this.authService.validateUser(req.user.id);
    if (!user) {
      return { error: 'User not found' };
    }
    return {
      ...user,
      wallet: user.wallet ? { balance: Number(user.wallet.balance) } : null,
    };
  }
}
