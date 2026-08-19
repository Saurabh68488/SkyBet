// ============================================
// Ludo Board — Complete Rewrite
// Proper coordinates, smooth animations, rich UI
// ============================================
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

// ─── TYPES ────────────────────────────────────
interface TokenState { pos: number; }
interface PlayerState {
  name: string; color: string; tokens: TokenState[]; finishOrder: number;
}
interface GameState {
  players: PlayerState[];
  currentTurn: number;
  diceValue: number;
  diceRolled: boolean;
  phase: string;
  turnTimer: number;
  finishedCount: number;
  lastMove: any;
}

interface LudoBoardProps {
  gameState: GameState;
  myPlayerIdx: number;
  validMoves: number[];
  diceAnimating: boolean;
  isMyTurn: boolean;
  onRollDice: () => void;
  onMoveToken: (tokenIdx: number) => void;
}

// ─── COLORS ───────────────────────────────────
const COLORS: Record<string, string> = {
  RED: '#E53935', GREEN: '#43A047', YELLOW: '#FDD835', BLUE: '#1E88E5',
};
const COLORS_DARK: Record<string, string> = {
  RED: '#B71C1C', GREEN: '#1B5E20', YELLOW: '#F9A825', BLUE: '#0D47A1',
};
const COLORS_LIGHT: Record<string, string> = {
  RED: '#EF9A9A', GREEN: '#A5D6A7', YELLOW: '#FFF59D', BLUE: '#90CAF9',
};
const COLORS_BG: Record<string, string> = {
  RED: '#C62828', GREEN: '#2E7D32', YELLOW: '#F9A825', BLUE: '#1565C0',
};

// ─── BOARD COORDINATE SYSTEM ──────────────────
// 15x15 grid. All positions as [col, row] where (0,0) = top-left.
// The 52-cell clockwise track starting from RED start:
const TRACK: [number, number][] = [
  [6,13],[6,12],[6,11],[6,10],[6, 9], // RED goes UP
  [5, 8],[4, 8],[3, 8],[2, 8],[1, 8],[0, 8], // LEFT along bottom-left arm
  [0, 7], // corner
  [0, 6], // turn
  [1, 6],[2, 6],[3, 6],[4, 6],[5, 6], // GREEN goes RIGHT
  [6, 5],[6, 4],[6, 3],[6, 2],[6, 1],[6, 0], // UP along top-left arm
  [7, 0], // corner
  [8, 0], // turn
  [8, 1],[8, 2],[8, 3],[8, 4],[8, 5], // YELLOW goes DOWN
  [9, 6],[10,6],[11,6],[12,6],[13,6],[14,6], // RIGHT along top-right arm
  [14,7], // corner
  [14,8], // turn
  [13,8],[12,8],[11,8],[10,8],[9, 8], // BLUE goes LEFT
  [8, 9],[8,10],[8,11],[8,12],[8,13],[8,14], // DOWN along bottom-right arm
  [7,14], // corner
  [6,14], // turn
];

const COLOR_START_OFFSET: Record<string, number> = { RED: 0, GREEN: 13, YELLOW: 26, BLUE: 39 };

// Home columns (local positions 52-56) — leading to center
const HOME_COLUMNS: Record<string, [number, number][]> = {
  RED:    [[7,13],[7,12],[7,11],[7,10],[7,9]],
  GREEN:  [[1,7],[2,7],[3,7],[4,7],[5,7]],
  YELLOW: [[7,1],[7,2],[7,3],[7,4],[7,5]],
  BLUE:   [[13,7],[12,7],[11,7],[10,7],[9,7]],
};

// Home position (57) — center
const HOME_POS: Record<string, [number, number]> = {
  RED: [6.5, 8], GREEN: [6, 6.5], YELLOW: [8, 6.5], BLUE: [8, 8],
};

// Base positions (4 tokens per color when pos=-1)
const BASE_POS: Record<string, [number, number][]> = {
  RED:    [[1.5,10.5],[3.5,10.5],[1.5,12.5],[3.5,12.5]],
  GREEN:  [[1.5,1.5],[3.5,1.5],[1.5,3.5],[3.5,3.5]],
  YELLOW: [[10.5,1.5],[12.5,1.5],[10.5,3.5],[12.5,3.5]],
  BLUE:   [[10.5,10.5],[12.5,10.5],[10.5,12.5],[12.5,12.5]],
};

// Safe star positions on global track
const SAFE_GLOBAL = [0, 8, 13, 21, 26, 34, 39, 47];

// ─── POSITION HELPER ──────────────────────────
function getTokenCoords(
  color: string, localPos: number, tokenIdx: number, boardSize: number
): { x: number; y: number } {
  const cell = boardSize / 15;

  if (localPos === -1) {
    const bp = BASE_POS[color][tokenIdx];
    return { x: bp[0] * cell, y: bp[1] * cell };
  }
  if (localPos === 57) {
    const hp = HOME_POS[color];
    return { x: hp[0] * cell, y: hp[1] * cell };
  }
  if (localPos >= 52 && localPos <= 56) {
    const hc = HOME_COLUMNS[color][localPos - 52];
    return { x: (hc[0] + 0.5) * cell, y: (hc[1] + 0.5) * cell };
  }
  // Main track
  const globalPos = (localPos + COLOR_START_OFFSET[color]) % 52;
  const tc = TRACK[globalPos];
  return { x: (tc[0] + 0.5) * cell, y: (tc[1] + 0.5) * cell };
}

// ─── DICE FACES ───────────────────────────────
function drawDiceFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, value: number) {
  const r = size / 2;
  const dotR = size * 0.08;
  // Background
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  const rr = size * 0.15;
  ctx.beginPath();
  ctx.roundRect(cx - r, cy - r, size, size, rr);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.roundRect(cx - r, cy - r, size, size, rr);
  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#222';
  const positions: [number, number][][] = [
    [],
    [[0,0]],
    [[-0.3,-0.3],[0.3,0.3]],
    [[-0.3,-0.3],[0,0],[0.3,0.3]],
    [[-0.3,-0.3],[0.3,-0.3],[-0.3,0.3],[0.3,0.3]],
    [[-0.3,-0.3],[0.3,-0.3],[0,0],[-0.3,0.3],[0.3,0.3]],
    [[-0.3,-0.3],[0.3,-0.3],[-0.3,0],[0.3,0],[-0.3,0.3],[0.3,0.3]],
  ];
  const dots = positions[value] || [];
  for (const [dx, dy] of dots) {
    ctx.beginPath();
    ctx.arc(cx + dx * size * 0.6, cy + dy * size * 0.6, dotR, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── COMPONENT ────────────────────────────────
export default function LudoBoard({
  gameState, myPlayerIdx, validMoves, diceAnimating, isMyTurn, onRollDice, onMoveToken,
}: LudoBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);

  // Token animation positions — lerp toward target
  const tokenPosRef = useRef<Record<string, { x: number; y: number }>>({});
  const prevStateRef = useRef<string>('');

  // Dice animation
  const diceAnimFrame = useRef(0);
  const diceDisplayVal = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) { animRef.current = requestAnimationFrame(draw); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { animRef.current = requestAnimationFrame(draw); return; }
    const parent = canvas.parentElement;
    if (!parent) { animRef.current = requestAnimationFrame(draw); return; }

    const size = Math.min(parent.clientWidth, parent.clientHeight, 500);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = (size + 80) * dpr; // extra space for dice + info
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size + 80}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const S = size;
    const cell = S / 15;
    frameRef.current++;

    // ════════════════════════════════════════════
    // 1. BOARD BACKGROUND
    // ════════════════════════════════════════════

    // Overall background
    ctx.fillStyle = '#263238';
    ctx.fillRect(0, 0, S, S + 80);

    // Board outline
    ctx.fillStyle = '#37474F';
    ctx.fillRect(0, 0, S, S);

    // ── Colored quadrant bases ──
    // GREEN (top-left)
    ctx.fillStyle = COLORS_BG['GREEN'];
    ctx.fillRect(0, 0, 6 * cell, 6 * cell);
    // YELLOW (top-right)
    ctx.fillStyle = COLORS_BG['YELLOW'];
    ctx.fillRect(9 * cell, 0, 6 * cell, 6 * cell);
    // RED (bottom-left)
    ctx.fillStyle = COLORS_BG['RED'];
    ctx.fillRect(0, 9 * cell, 6 * cell, 6 * cell);
    // BLUE (bottom-right)
    ctx.fillStyle = COLORS_BG['BLUE'];
    ctx.fillRect(9 * cell, 9 * cell, 6 * cell, 6 * cell);

    // ── White circles in bases (token home areas) ──
    for (const color of ['RED', 'GREEN', 'YELLOW', 'BLUE']) {
      const cx = color === 'RED' || color === 'GREEN' ? 3 * cell : 12 * cell;
      const cy = color === 'RED' || color === 'BLUE' ? 12 * cell : 3 * cell;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = COLORS_DARK[color];
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw 4 token spots in base
      for (let i = 0; i < 4; i++) {
        const bp = BASE_POS[color][i];
        ctx.beginPath();
        ctx.arc(bp[0] * cell, bp[1] * cell, cell * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = COLORS_LIGHT[color];
        ctx.fill();
        ctx.strokeStyle = COLORS[color];
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // ════════════════════════════════════════════
    // 2. TRACK CELLS
    // ════════════════════════════════════════════

    // Draw all track cells as white squares with borders
    for (let i = 0; i < 52; i++) {
      const [c, r] = TRACK[i];
      const x = c * cell, y = r * cell;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, cell, cell);
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, cell, cell);
    }

    // Color start cells
    const starts: [string, number][] = [['RED',0],['GREEN',13],['YELLOW',26],['BLUE',39]];
    for (const [color, gp] of starts) {
      const [c, r] = TRACK[gp];
      ctx.fillStyle = COLORS[color];
      ctx.fillRect(c * cell, r * cell, cell, cell);
      ctx.strokeStyle = COLORS_DARK[color];
      ctx.lineWidth = 1;
      ctx.strokeRect(c * cell, r * cell, cell, cell);

      // Arrow
      ctx.fillStyle = '#fff';
      ctx.font = `${cell * 0.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const arrows: Record<string, string> = { RED: '↑', GREEN: '→', YELLOW: '↓', BLUE: '←' };
      ctx.fillText(arrows[color], (c + 0.5) * cell, (r + 0.5) * cell);
    }

    // ── Home columns (colored) ──
    for (const color of ['RED', 'GREEN', 'YELLOW', 'BLUE'] as const) {
      const cols = HOME_COLUMNS[color];
      for (const [c, r] of cols) {
        ctx.fillStyle = COLORS_LIGHT[color];
        ctx.fillRect(c * cell, r * cell, cell, cell);
        ctx.strokeStyle = COLORS[color];
        ctx.lineWidth = 0.5;
        ctx.strokeRect(c * cell, r * cell, cell, cell);
      }
    }

    // ── Safe position stars ──
    ctx.fillStyle = '#888';
    ctx.font = `${cell * 0.55}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const gp of SAFE_GLOBAL) {
      const [c, r] = TRACK[gp];
      // Only draw star if not a start cell
      if (![0, 13, 26, 39].includes(gp)) {
        ctx.fillStyle = '#bbb';
        ctx.fillText('★', (c + 0.5) * cell, (r + 0.5) * cell);
      }
    }

    // ── Center triangles ──
    const center = 7.5 * cell;
    // RED triangle (bottom-left)
    ctx.fillStyle = COLORS['RED'];
    ctx.beginPath();
    ctx.moveTo(6 * cell, 9 * cell);
    ctx.lineTo(center, center);
    ctx.lineTo(6 * cell, 6 * cell);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    // GREEN triangle (top-left)
    ctx.fillStyle = COLORS['GREEN'];
    ctx.beginPath();
    ctx.moveTo(6 * cell, 6 * cell);
    ctx.lineTo(center, center);
    ctx.lineTo(9 * cell, 6 * cell);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // YELLOW triangle (top-right)
    ctx.fillStyle = COLORS['YELLOW'];
    ctx.beginPath();
    ctx.moveTo(9 * cell, 6 * cell);
    ctx.lineTo(center, center);
    ctx.lineTo(9 * cell, 9 * cell);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // BLUE triangle (bottom-right)
    ctx.fillStyle = COLORS['BLUE'];
    ctx.beginPath();
    ctx.moveTo(9 * cell, 9 * cell);
    ctx.lineTo(center, center);
    ctx.lineTo(6 * cell, 9 * cell);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Border around cross path
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1.5;
    // Top arm
    ctx.strokeRect(6 * cell, 0, 3 * cell, 6 * cell);
    // Bottom arm
    ctx.strokeRect(6 * cell, 9 * cell, 3 * cell, 6 * cell);
    // Left arm
    ctx.strokeRect(0, 6 * cell, 6 * cell, 3 * cell);
    // Right arm
    ctx.strokeRect(9 * cell, 6 * cell, 6 * cell, 3 * cell);

    // Board border
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, S, S);

    // ════════════════════════════════════════════
    // 3. TOKENS (with smooth animation)
    // ════════════════════════════════════════════

    if (gameState.players) {
      for (let pi = 0; pi < gameState.players.length; pi++) {
        const player = gameState.players[pi];
        const color = player.color;

        for (let ti = 0; ti < player.tokens.length; ti++) {
          const token = player.tokens[ti];
          const target = getTokenCoords(color, token.pos, ti, S);
          const key = `${pi}_${ti}`;

          // Initialize or lerp toward target
          if (!tokenPosRef.current[key]) {
            tokenPosRef.current[key] = { x: target.x, y: target.y };
          } else {
            const cur = tokenPosRef.current[key];
            const speed = 0.15; // lerp speed
            cur.x += (target.x - cur.x) * speed;
            cur.y += (target.y - cur.y) * speed;
            // Snap if close enough
            if (Math.abs(cur.x - target.x) < 0.5 && Math.abs(cur.y - target.y) < 0.5) {
              cur.x = target.x;
              cur.y = target.y;
            }
          }

          const pos = tokenPosRef.current[key];
          const isValid = pi === myPlayerIdx && validMoves.includes(ti);
          const isCurrentPlayer = pi === gameState.currentTurn;
          const radius = cell * 0.38;

          // Glow for valid moves (pulsing)
          if (isValid) {
            const pulse = Math.sin(frameRef.current * 0.08) * 0.5 + 0.5;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius + 4 + pulse * 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 0, ${0.3 + pulse * 0.3})`;
            ctx.fill();
            // Ring
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.5})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          // Token shadow
          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 2;

          // Token body (pin shape)
          // Draw a pin: circle on top, pointed bottom
          const pinTop = pos.y - radius * 0.3;
          const pinBottom = pos.y + radius * 0.6;

          // Main circle
          ctx.beginPath();
          ctx.arc(pos.x, pinTop, radius, 0, Math.PI * 2);
          ctx.fillStyle = COLORS[color];
          ctx.fill();
          ctx.restore();

          // Pin point
          ctx.beginPath();
          ctx.moveTo(pos.x - radius * 0.5, pinTop + radius * 0.6);
          ctx.lineTo(pos.x, pinBottom);
          ctx.lineTo(pos.x + radius * 0.5, pinTop + radius * 0.6);
          ctx.fillStyle = COLORS[color];
          ctx.fill();

          // Circle border
          ctx.beginPath();
          ctx.arc(pos.x, pinTop, radius, 0, Math.PI * 2);
          ctx.strokeStyle = COLORS_DARK[color];
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Inner white circle
          ctx.beginPath();
          ctx.arc(pos.x, pinTop, radius * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();

          // Token number
          ctx.fillStyle = COLORS_DARK[color];
          ctx.font = `bold ${cell * 0.25}px 'Inter', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${ti + 1}`, pos.x, pinTop);

          // Finished token — checkmark
          if (token.pos === 57) {
            ctx.fillStyle = '#fff';
            ctx.font = `${cell * 0.3}px sans-serif`;
            ctx.fillText('✓', pos.x, pinTop);
          }
        }
      }
    }

    // ════════════════════════════════════════════
    // 4. DICE + INFO BAR (below board)
    // ════════════════════════════════════════════

    const barY = S + 5;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, S, S, 80);

    // Current turn indicator
    if (gameState.phase === 'PLAYING' && gameState.players[gameState.currentTurn]) {
      const cp = gameState.players[gameState.currentTurn];
      const isMe = gameState.currentTurn === myPlayerIdx;

      // Player indicators on left and right
      for (let pi = 0; pi < gameState.players.length; pi++) {
        const p = gameState.players[pi];
        const isActive = pi === gameState.currentTurn;
        const cols = Math.min(gameState.players.length, 4);
        const spacing = S / (cols + 1);
        const px = spacing * (pi + 1);
        const py = barY + 40;

        // Background pill
        ctx.beginPath();
        ctx.roundRect(px - 35, py - 15, 70, 30, 8);
        ctx.fillStyle = isActive ? COLORS[p.color] : 'rgba(255,255,255,0.1)';
        ctx.fill();
        if (isActive) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Name
        ctx.fillStyle = isActive ? '#fff' : '#888';
        ctx.font = `bold ${11}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const name = pi === myPlayerIdx ? 'You' : p.name.substring(0, 8);
        ctx.fillText(name, px, py - 2);

        // Finish indicator
        if (p.finishOrder > 0) {
          ctx.fillStyle = '#FFD700';
          ctx.font = `8px sans-serif`;
          ctx.fillText(`#${p.finishOrder}`, px, py + 10);
        }
      }

      // Dice in center
      const diceCx = S / 2;
      const diceCy = barY + 15;
      const diceSize = 30;

      if (diceAnimating) {
        diceAnimFrame.current++;
        diceDisplayVal.current = (diceAnimFrame.current % 6) + 1;
        drawDiceFace(ctx, diceCx, diceCy, diceSize, diceDisplayVal.current);
      } else if (gameState.diceValue > 0) {
        drawDiceFace(ctx, diceCx, diceCy, diceSize, gameState.diceValue);
      } else {
        // Empty dice
        drawDiceFace(ctx, diceCx, diceCy, diceSize, 1);
        if (isMe) {
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.font = `bold 8px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('TAP', diceCx, diceCy + diceSize / 2 + 10);
        }
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, [gameState, myPlayerIdx, validMoves, diceAnimating, isMyTurn]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  // ─── CLICK HANDLING ─────────────────────────
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const parent = canvas.parentElement;
    if (!parent) return;
    const S = Math.min(parent.clientWidth, parent.clientHeight, 500);

    // Check if clicking on dice area
    if (y > S && y < S + 80) {
      if (isMyTurn && !gameState.diceRolled && !diceAnimating) {
        onRollDice();
      }
      return;
    }

    // Check if clicking on a valid token
    if (validMoves.length > 0 && myPlayerIdx >= 0 && gameState.players[myPlayerIdx]) {
      const player = gameState.players[myPlayerIdx];
      let closest = -1;
      let closestDist = Infinity;

      for (const ti of validMoves) {
        const key = `${myPlayerIdx}_${ti}`;
        const pos = tokenPosRef.current[key];
        if (!pos) continue;
        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (dist < S / 15 * 1.5 && dist < closestDist) {
          closestDist = dist;
          closest = ti;
        }
      }

      if (closest >= 0) {
        onMoveToken(closest);
      }
    }
  }, [gameState, myPlayerIdx, validMoves, isMyTurn, diceAnimating, onRollDice, onMoveToken]);

  return (
    <div className="w-full flex flex-col items-center gap-0">
      <div className="w-full max-w-[500px]" style={{ aspectRatio: '500 / 580' }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-pointer"
          style={{ borderRadius: '12px' }}
        />
      </div>

      {/* Roll button — mobile friendly large tap target */}
      <button
        onClick={onRollDice}
        disabled={!isMyTurn || gameState.diceRolled || diceAnimating}
        className={`mt-3 px-8 py-3 rounded-2xl font-bold text-sm transition-all active:scale-90 ${
          isMyTurn && !gameState.diceRolled
            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60 animate-bounce'
            : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
        }`}
      >
        {diceAnimating
          ? '🎲 Rolling...'
          : isMyTurn
            ? (gameState.diceRolled ? '👆 Pick a token to move' : '🎲 ROLL DICE')
            : `⏳ ${gameState.players[gameState.currentTurn]?.name || 'Opponent'}'s turn`
        }
      </button>

      {/* Valid move hints */}
      {validMoves.length > 0 && (
        <p className="text-xs text-yellow-400 mt-1 animate-pulse">
          Tap a glowing token to move it!
        </p>
      )}
    </div>
  );
}
