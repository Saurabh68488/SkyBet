const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.gameConfig.upsert({
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
  console.log('Created LUDO config:', config.id);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
