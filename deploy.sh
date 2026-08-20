#!/bin/bash
# ============================================
# SkyBet Deploy Script — CloudLinux/Plesk
# Run: bash deploy.sh
# ============================================
set -e

export PATH=/opt/plesk/node/25/bin:$PATH
APP_DIR="$(pwd)"

echo "=== 1/6 Installing dependencies ==="
npm install --ignore-scripts

echo "=== 2/6 Building better-sqlite3 ==="
cd node_modules/better-sqlite3
npx node-gyp rebuild --python=/opt/alt/python310/bin/python3.10 || npx node-gyp rebuild || echo "WARN: using prebuilds"
cd "$APP_DIR"

echo "=== 3/6 Fixing symlinks ==="
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

echo "=== 4/6 Generating Prisma ==="
npx prisma generate --schema apps/server/prisma/schema.prisma

echo "=== 5/6 Patching WASM loader for Node.js ==="
# Prisma's default WASM loader uses edge-only import() syntax.
# Replace it with a Node.js-compatible loader that uses fs.readFileSync.
cat > node_modules/.prisma/client/wasm-worker-loader.mjs << 'WASMFIX'
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const buf = readFileSync(join(__dirname, 'query_engine_bg.wasm'));
export default Promise.resolve({ default: new WebAssembly.Module(buf) });
WASMFIX
echo "  -> WASM loader patched for Node.js"

echo "=== 6/6 Starting server ==="
pkill -f "apps/server/dist/src/main.js" 2>/dev/null || true
sleep 1
nohup /opt/plesk/node/25/bin/node apps/server/dist/src/main.js >> backend.log 2>&1 &
echo "PID: $!"
sleep 4

if pgrep -f "apps/server/dist/src/main.js" > /dev/null; then
  echo ""
  echo "========================================="
  echo "  SUCCESS! Server is running!"
  echo "========================================="
  tail -5 backend.log
else
  echo "FAILED — check backend.log:"
  tail -20 backend.log
fi
