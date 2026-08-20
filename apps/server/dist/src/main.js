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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const express = __importStar(require("express"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
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
    const frontendPath = path.resolve(process.cwd(), 'apps/web/out');
    if (fs.existsSync(frontendPath)) {
        app.use(express.static(frontendPath, { maxAge: '1d' }));
        app.use((req, res, next) => {
            if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
                return next();
            }
            const indexFile = path.join(frontendPath, 'index.html');
            if (fs.existsSync(indexFile)) {
                res.sendFile(indexFile);
            }
            else {
                next();
            }
        });
        console.log('📁 Serving frontend from apps/web/out');
    }
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