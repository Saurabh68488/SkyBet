// ============================================
// NestJS Main Entry Point
// ============================================

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet({ contentSecurityPolicy: false }));

  // CORS - allow frontend
  app.enableCors({
    origin: true, // Allow all origins in dev; restrict in production via env
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SkyBet API')
    .setDescription('SkyBet Real-Time Betting Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  // Auto-fix: ensure admin account is always active
  try {
    const { PrismaService } = require('./prisma.service');
    const prisma = app.get(PrismaService);
    await prisma.user.update({
      where: { username: 'admin' },
      data: { status: 'ACTIVE' },
    });
    console.log('✅ Admin account verified active');
  } catch (e) {
    console.log('Admin fix skipped:', e.message);
  }

  console.log(`\n🚀 SkyBet Server running on http://localhost:${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
  console.log(`🎮 WebSocket: ws://localhost:${port}\n`);
}

bootstrap();
