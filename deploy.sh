#!/bin/bash
# ============================================
# SkyBet Deployment Script for Plesk/CloudLinux
# ============================================
set -e

export PATH=/opt/plesk/node/25/bin:$PATH
APP_DIR="/var/www/vhosts/skybetall.com/httpdocs"

echo "=== Step 1: Install dependencies ==="
cd "$APP_DIR"
npm install --ignore-scripts 2>/dev/null || true

echo "=== Step 2: Compile better-sqlite3 ==="
cd "$APP_DIR/node_modules/better-sqlite3"
npx node-gyp rebuild --python=/opt/alt/python310/bin/python3.10 2>/dev/null || \
npx node-gyp rebuild 2>/dev/null || echo "WARN: node-gyp failed, using prebuilds"
cd "$APP_DIR"

echo "=== Step 3: Fix nested better-sqlite3 ==="
if [ -d "node_modules/@prisma/adapter-better-sqlite3/node_modules/better-sqlite3" ]; then
  rm -rf node_modules/@prisma/adapter-better-sqlite3/node_modules/better-sqlite3
  ln -s "$APP_DIR/node_modules/better-sqlite3" \
    node_modules/@prisma/adapter-better-sqlite3/node_modules/better-sqlite3
  echo "Symlinked adapter better-sqlite3"
fi

echo "=== Step 4: Fix nested @prisma/client ==="
if [ -d "apps/server/node_modules/@prisma/client" ] && [ ! -L "apps/server/node_modules/@prisma/client" ]; then
  rm -rf apps/server/node_modules/@prisma/client
  mkdir -p apps/server/node_modules/@prisma
  ln -s "$APP_DIR/node_modules/@prisma/client" \
    apps/server/node_modules/@prisma/client
  echo "Symlinked server @prisma/client"
fi

echo "=== Step 5: Generate Prisma client ==="
npx prisma generate --schema apps/server/prisma/schema.prisma

echo "=== Step 6: Kill old process ==="
pkill -f "apps/server/dist/src/main.js" 2>/dev/null || true
sleep 2

echo "=== Step 7: Start server ==="
nohup /opt/plesk/node/25/bin/node apps/server/dist/src/main.js >> backend.log 2>&1 &
echo "Server started with PID: $!"

sleep 3
if pgrep -f "apps/server/dist/src/main.js" > /dev/null; then
  echo "=== SUCCESS: Server is running! ==="
else
  echo "=== FAILED: Check backend.log ==="
  tail -20 backend.log
fi
