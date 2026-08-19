// ============================================
// Payments Controller
// ============================================

import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, AdminGuard } from '../auth/auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // ─── PLAYER ENDPOINTS ──────────────────────────

  @Post('deposit')
  @ApiOperation({ summary: 'Request deposit (add money)' })
  async createDeposit(
    @Body() body: { amount: number; playerTxnId: string },
    @Req() req: any,
  ) {
    return this.paymentsService.createDeposit(req.user.id, body.amount, body.playerTxnId);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Request withdrawal' })
  async createWithdraw(
    @Body() body: { amount: number; upiId: string },
    @Req() req: any,
  ) {
    return this.paymentsService.createWithdraw(req.user.id, body.amount, body.upiId);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get my payment requests' })
  async getMyRequests(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('type') type?: string,
  ) {
    return this.paymentsService.getMyRequests(
      req.user.id,
      page ? parseInt(page) : 1,
      type || undefined,
    );
  }
}

// ─── ADMIN PAYMENT ENDPOINTS ─────────────────────

@ApiTags('Admin')
@Controller('admin/payments')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminPaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payment requests' })
  async getAllRequests(
    @Query('page') page?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.paymentsService.getAllRequests(
      page ? parseInt(page) : 1,
      status || undefined,
      type || undefined,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment stats' })
  async getStats() {
    return this.paymentsService.getStats();
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve a payment request' })
  async approveRequest(
    @Param('id') id: string,
    @Body() body: { adminTxnId?: string },
    @Req() req: any,
  ) {
    return this.paymentsService.approveRequest(id, req.user.id, body.adminTxnId);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject a payment request' })
  async rejectRequest(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    return this.paymentsService.rejectRequest(id, req.user.id, body.reason);
  }
}
