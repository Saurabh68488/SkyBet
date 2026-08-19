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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...\n');
    const adminPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456', 12);
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
            password: adminPassword,
            name: 'System Admin',
            role: 'ADMIN',
            status: 'ACTIVE',
            phone: null,
            wallet: {
                create: {
                    balance: 0,
                },
            },
        },
    });
    console.log(`✅ Admin user created: ${admin.username} (${admin.playerId})`);
    const playerPassword = await bcrypt.hash('Player@123456', 12);
    const player = await prisma.user.upsert({
        where: { username: 'player1' },
        update: {},
        create: {
            username: 'player1',
            password: playerPassword,
            name: 'Demo Player',
            role: 'PLAYER',
            status: 'ACTIVE',
            phone: '+1234567890',
            wallet: {
                create: {
                    balance: 1000,
                },
            },
        },
    });
    console.log(`✅ Demo player created: ${player.username} (${player.playerId}) - Balance: 1000 Coins`);
    const settings = await prisma.platformSettings.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            commissionRate: 0.10,
            countdownDuration: 15,
            maintenanceMode: false,
        },
    });
    console.log(`✅ Platform settings created: Commission ${Number(settings.commissionRate) * 100}%`);
    const aviationConfig = await prisma.gameConfig.upsert({
        where: { gameType: 'AVIATION' },
        update: {},
        create: {
            gameType: 'AVIATION',
            name: 'Aviation',
            description: 'Watch the plane fly and cash out before it crashes! The multiplier increases as the plane flies higher.',
            enabled: true,
            visible: true,
            minBet: 10,
            maxBet: 1000000,
            minMultiplier: 1.0,
            maxMultiplier: 1000.0,
            settings: JSON.stringify({
                multiplierSpeed: 0.00006,
                maxMultiplier: 1000,
                tickRate: 50,
            }),
        },
    });
    console.log(`✅ Aviation game config created: ${aviationConfig.name}`);
    const jetxConfig = await prisma.gameConfig.upsert({
        where: { gameType: 'JETX' },
        update: {},
        create: {
            gameType: 'JETX',
            name: 'JetX',
            description: 'Golden jet, bigger stakes! Cash out before the jet flies away!',
            enabled: true,
            visible: true,
            minBet: 10,
            maxBet: 1000000,
            minMultiplier: 1.0,
            maxMultiplier: 1000.0,
            settings: JSON.stringify({
                multiplierSpeed: 0.0001,
                maxMultiplier: 1000,
                tickRate: 50,
            }),
        },
    });
    console.log(`✅ JetX game config created: ${jetxConfig.name}`);
    const ludoConfig = await prisma.gameConfig.upsert({
        where: { gameType: 'LUDO' },
        update: {},
        create: {
            gameType: 'LUDO',
            name: 'Ludo',
            description: 'Classic Ludo board game. Play 2P or 4P matches and win coins!',
            enabled: true,
            visible: true,
            minBet: 10,
            maxBet: 500,
            minMultiplier: 1.0,
            maxMultiplier: 1.8,
        },
    });
    console.log(`✅ Ludo game config created: ${ludoConfig.name}`);
    await prisma.log.create({
        data: {
            userId: admin.id,
            action: 'Database seeded',
            category: 'SYSTEM',
            details: JSON.stringify({ message: 'Initial database seed completed' }),
        },
    });
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin:  admin / Admin@123456');
    console.log('   Player: player1 / Player@123456 (1000 Coins)');
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map