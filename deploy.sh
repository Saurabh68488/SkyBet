#!/bin/bash
# ============================================
# SkyBet Deploy Script — CloudLinux/Plesk
# Run: bash deploy.sh
# ============================================
set -e

export PATH=/opt/plesk/node/25/bin:$PATH
APP_DIR="$(pwd)"

echo "=== 1/5 Installing dependencies ==="
npm install --ignore-scripts

echo "=== 2/5 Building better-sqlite3 ==="
cd node_modules/better-sqlite3
npx node-gyp rebuild --python=/opt/alt/python310/bin/python3.10 || npx node-gyp rebuild || echo "WARN: using prebuilds"
cd "$APP_DIR"

echo "=== 3/5 Fixing symlinks ==="
# Symlink better-sqlite3 into adapter
if [ -d "node_modules/@prisma/adapter-better-sqlite3/node_modules" ]; then
  rm -rf node_modules/@prisma/adapter-better-sqlite3/node_modules/better-sqlite3
  ln -s "$APP_DIR/node_modules/better-sqlite3" \
    node_modules/@prisma/adapter-better-sqlite3/node_modules/better-sqlite3
  echo "  -> adapter better-sqlite3 symlinked"
fi

# Symlink @prisma/client into server
mkdir -p apps/server/node_modules/@prisma
rm -rf apps/server/node_modules/@prisma/client
ln -s "$APP_DIR/node_modules/@prisma/client" \
  apps/server/node_modules/@prisma/client
echo "  -> server @prisma/client symlinked"

echo "=== 4/5 Generating Prisma ==="
npx prisma generate --schema apps/server/prisma/schema.prisma

echo "=== 5/5 Starting server ==="
pkill -f "apps/server/dist/src/main.js" 2>/dev/null || true
sleep 1
nohup /opt/plesk/node/25/bin/node --experimental-wasm-modules apps/server/dist/src/main.js >> backend.log 2>&1 &
echo "PID: $!"
sleep 3

if pgrep -f "apps/server/dist/src/main.js" > /dev/null; then
  echo ""
  echo "========================================="
  echo "  SUCCESS! Server is running!"
  echo "  API: http://skybetall.com/api/docs"
  echo "========================================="
else
  echo "FAILED — check backend.log:"
  tail -20 backend.log
fi
