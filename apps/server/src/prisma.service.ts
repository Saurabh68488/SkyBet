// ============================================
// Prisma Database Service — Driver Adapter
// Uses better-sqlite3 (pure JS) to avoid Rust
// thread issues on CloudLinux shared hosting
// ============================================

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client/wasm';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Database path — resolve relative to the project's prisma directory
    // __dirname = apps/server/dist/src → go up 2 levels to apps/server/
    const prismaDir = path.join(__dirname, '..', '..', 'prisma');
    const dbPath = path.resolve(prismaDir, 'dev.db');

    console.log(`📂 Database path: ${dbPath}`);

    // Create Prisma adapter using URL-based config (pure JS, no Rust threads)
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

    // Initialize PrismaClient with the adapter
    super({ adapter } as any);
  }

  async onModuleInit() {
    await this.$connect();
    console.log('📦 Database connected (driver adapter)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
