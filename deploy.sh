#!/bin/bash
# ============================================
# SkyBet Complete Deploy Script — CloudLinux/Plesk
# Handles: deps, build patches, frontend, server, auto-restart
# Run: bash deploy.sh
# ============================================
set -e

export PATH=/opt/plesk/node/25/bin:$PATH
APP_DIR="$(pwd)"

echo "========================================="
echo "  SkyBet Deployment"
echo "========================================="

# ─── 1. Dependencies ──────────────────────────
echo ""
echo "=== 1/7 Installing dependencies ==="
npm install --ignore-scripts

# ─── 2. Build better-sqlite3 ──────────────────
echo ""
echo "=== 2/7 Building better-sqlite3 ==="
cd node_modules/better-sqlite3
npx node-gyp rebuild --python=/opt/alt/python310/bin/python3.10 2>/dev/null || \
npx node-gyp rebuild 2>/dev/null || \
echo "WARN: native build failed, using prebuilds"
cd "$APP_DIR"

# ─── 3. Symlinks ─────────────────────────────
echo ""
echo "=== 3/7 Fixing symlinks ==="
if [ -d "node_modules/@prisma/adapter-better-sqlite3/node_modules" ]; then
  rm -rf node_modules/@prisma/adapter-better-sqlite3/node_modules/better-sqlite3
  ln -s "$APP_DIR/node_modules/better-sqlite3" \
    node_modules/@prisma/adapter-better-sqlite3/node_modules/better-sqlite3
  echo "  -> adapter better-sqlite3 symlinked"
fi

mkdir -p apps/server/node_modules/@prisma
rm -rf apps/server/node_modules/@prisma/client
ln -s "$APP_DIR/node_modules/@prisma/client" \
  apps/server/node_modules/@prisma/client
echo "  -> server @prisma/client symlinked"

# ─── 4. Prisma generate ──────────────────────
echo ""
echo "=== 4/7 Generating Prisma client ==="
npx prisma generate --schema apps/server/prisma/schema.prisma

# ─── 5. Patch WASM loader for Node.js ────────
echo ""
echo "=== 5/7 Patching WASM loader for Node.js ==="
cat > node_modules/.prisma/client/wasm-worker-loader.mjs << 'WASMFIX'
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const buf = readFileSync(join(__dirname, 'query_engine_bg.wasm'));
export default Promise.resolve({ default: new WebAssembly.Module(buf) });
WASMFIX
echo "  -> WASM loader patched for Node.js"

# ─── 6. Auto-restart cron ───────────────────
echo ""
echo "=== 6/7 Setting up auto-restart ==="
CRON_CMD="* * * * * pgrep -f 'apps/server/dist/src/main.js' > /dev/null || cd $APP_DIR && /opt/plesk/node/25/bin/node apps/server/dist/src/main.js >> backend.log 2>&1 &"
(crontab -l 2>/dev/null | grep -v "apps/server/dist/src/main.js"; echo "$CRON_CMD") | crontab -
echo "  -> Cron auto-restart configured (checks every minute)"

# ─── 7. Start server ────────────────────────
echo ""
echo "=== 7/7 Starting server ==="
pkill -f "apps/server/dist/src/main.js" 2>/dev/null || true
sleep 2
nohup /opt/plesk/node/25/bin/node apps/server/dist/src/main.js >> backend.log 2>&1 &
SERVER_PID=$!
echo "  -> PID: $SERVER_PID"
sleep 4

if pgrep -f "apps/server/dist/src/main.js" > /dev/null; then
  echo ""
  echo "========================================="
  echo "  ✅ DEPLOYMENT SUCCESSFUL!"
  echo "========================================="
  echo ""
  echo "  Server:    http://localhost:3001"
  echo "  Frontend:  http://localhost:3001"
  echo "  API Docs:  http://localhost:3001/api/docs"
  echo "  WebSocket: ws://localhost:3001"
  echo ""
  echo "  Auto-restart: ✅ (cron every minute)"
  echo "  Database: apps/server/prisma/dev.db"
  echo ""
  echo "  Admin:  admin / Admin@123456"
  echo "  Player: player1 / Player@123456"
  echo ""
  echo "========================================="
  echo ""
  echo "  NEXT: Configure Plesk proxy to forward"
  echo "  port 80/443 -> localhost:3001"
  echo ""
  echo "========================================="
  tail -5 backend.log
else
  echo ""
  echo "========================================="
  echo "  ❌ DEPLOYMENT FAILED"
  echo "========================================="
  echo ""
  tail -20 backend.log
fi
