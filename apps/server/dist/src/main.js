"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setGlobalPrefix('api');
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('SkyBet API')
        .setDescription('SkyBet Real-Time Betting Platform API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3001;
    await app.listen(port);
    try {
        const { PrismaService } = require('./prisma.service');
        const prisma = app.get(PrismaService);
        await prisma.user.update({
            where: { username: 'admin' },
            data: { status: 'ACTIVE' },
        });
        console.log('✅ Admin account verified active');
    }
    catch (e) {
        console.log('Admin fix skipped:', e.message);
    }
    console.log(`\n🚀 SkyBet Server running on http://localhost:${port}`);
    console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
    console.log(`🎮 WebSocket: ws://localhost:${port}\n`);
}
bootstrap();
//# sourceMappingURL=main.js.map