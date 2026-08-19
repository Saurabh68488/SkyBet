import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService, configService: ConfigService);
    validate(payload: {
        sub: string;
        username: string;
        role: string;
    }): Promise<{
        id: string;
        username: string;
        role: string;
    }>;
}
export {};
