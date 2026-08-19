// ============================================
// Auth Guards
// ============================================

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// JWT Auth Guard - requires valid JWT token
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}

// Admin Guard - requires admin role
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }
    return true;
  }
}
