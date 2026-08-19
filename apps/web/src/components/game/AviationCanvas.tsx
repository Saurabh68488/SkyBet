// ============================================
// Aviation Canvas — Continuous scrolling,
// bigger plane, dramatic crash animation
// ============================================
'use client';

import { useRef, useEffect, useCallback } from 'react';

interface AviationCanvasProps {
  phase: string;
  multiplier: number;
  countdown: number;
}

export default function AviationCanvas({ phase, multiplier, countdown }: AviationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const starsRef = useRef<{ x: number; y: number; r: number; a: number; speed: number; depth: number }[]>([]);
  const crashTimeRef = useRef<number>(0);
  const crashMultRef = useRef<number>(1);
  const prevPhaseRef = useRef<string>('');

  // Track crash moment
  useEffect(() => {
    if (phase === 'CRASHED' && prevPhaseRef.current !== 'CRASHED') {
      crashTimeRef.current = Date.now();
      crashMultRef.current = multiplier;
    }
    prevPhaseRef.current = phase;
  }, [phase, multiplier]);

  // Initialize stars once — with depth layers for parallax
  useEffect(() => {
    starsRef.current = Array.from({ length: 150 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.8 + 0.3,
      a: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.008 + 0.002,
      depth: Math.random() * 0.8 + 0.2,  // parallax layer (0.2 = far, 1.0 = close)
    }));
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    }

    const W = rect?.width || canvas.width;
    const H = rect?.height || canvas.height;

    // ── Background ──
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#070714');
    bgGrad.addColorStop(0.5, '#0a0a22');
    bgGrad.addColorStop(1, '#0e0e2a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Animated Stars (with parallax motion during RUNNING) ──
    const isRunning = phase === 'RUNNING';
    starsRef.current.forEach((star) => {
      star.a += star.speed;
      const twinkle = Math.sin(star.a) * 0.4 + 0.5;

      // Move stars backward (right-to-left) during RUNNING — CONSTANT speed
      if (isRunning) {
        const moveSpeed = star.depth * 0.004; // constant, no multiplier scaling
        star.x -= moveSpeed;
        star.y += star.depth * 0.0003;
        // Wrap around
        if (star.x < -0.02) {
          star.x = 1.02;
          star.y = Math.random();
        }
        if (star.y > 1.02) star.y = -0.02;
      }

      const sx = star.x * W;
      const sy = star.y * H;
      const sr = star.r * twinkle * (isRunning ? (0.8 + star.depth * 0.5) : 1);

      // Draw star with streak effect during running
      if (isRunning && star.depth > 0.5) {
        const streakLen = star.depth * 8; // constant streak length
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + streakLen, sy);
        ctx.strokeStyle = `rgba(255, 255, 255, ${twinkle * 0.15})`;
        ctx.lineWidth = sr * 0.6;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * (isRunning ? 0.6 : 0.5)})`;
      ctx.fill();
    });

    // ── Subtle grid ──
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (H * i) / 6);
      ctx.lineTo(W, (H * i) / 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((W * i) / 6, 0);
      ctx.lineTo((W * i) / 6, H);
      ctx.stroke();
    }

    const pad = 50;

    if (phase === 'COUNTDOWN') {
      drawCountdown(ctx, W, H, countdown);
    } else if (phase === 'RUNNING') {
      drawRunning(ctx, W, H, pad, multiplier);
    } else if (phase === 'CRASHED') {
      drawCrashed(ctx, W, H, pad, crashMultRef.current, crashTimeRef.current);
    } else {
      // WAITING
      ctx.textAlign = 'center';
      ctx.font = '500 15px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillText('WAITING FOR NEXT ROUND...', W / 2, H / 2);
    }

    frameRef.current = requestAnimationFrame(draw);
  }, [phase, multiplier, countdown]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ─────────────────────────────────────────────
// COUNTDOWN
// ─────────────────────────────────────────────
function drawCountdown(ctx: CanvasRenderingContext2D, W: number, H: number, countdown: number) {
  ctx.textAlign = 'center';

  // Label
  ctx.font = '600 13px Inter, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('NEXT ROUND IN', W / 2, H / 2 - 35);

  // Timer
  ctx.font = '900 72px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(`${Math.ceil(countdown)}s`, W / 2, H / 2 + 30);

  // Animated ring
  const pulse = Math.sin(Date.now() * 0.004) * 0.3 + 0.6;
  const progress = 1 - countdown / 15;

  // Outer pulse
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 85 + pulse * 12, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(34, 197, 94, ${pulse * 0.15})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Progress arc
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 80, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.strokeStyle = `rgba(34, 197, 94, 0.7)`;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineCap = 'butt';
}

// ─────────────────────────────────────────────
// RUNNING — Scrolling viewport, plane always moves
// ─────────────────────────────────────────────
function drawRunning(ctx: CanvasRenderingContext2D, W: number, H: number, pad: number, multiplier: number) {
  const graphW = W - pad * 2;
  const graphH = H - pad * 2;

  // The key: use a SCROLLING VIEWPORT
  // The visible Y range grows with multiplier
  // The plane stays at ~70% X, moving smoothly upward
  const visibleMaxMult = Math.max(multiplier * 1.35, 2); // Always show some headroom
  const elapsed = (multiplier - 1); // How far along we are

  // Plane position: always at ~70% of the screen width
  const planeScreenX = pad + graphW * 0.7;
  // Y position: maps multiplier into the visible range
  const yRatio = (multiplier - 1) / (visibleMaxMult - 1);
  const planeScreenY = H - pad - Math.pow(yRatio, 2.0) * graphH;

  // Build curve from origin (1.00x) to plane
  const numPoints = 120;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Each point represents a multiplier value along the curve
    const pointMult = 1 + t * elapsed;
    // X scrolls — older points move left as time progresses
    const xRatio = t * 0.7; // spread across 0 to 0.7 of screen
    const x = pad + xRatio * graphW;
    // Y maps the multiplier into the visible range
    const yR = (pointMult - 1) / (visibleMaxMult - 1);
    // Concave-up curve: starts gradual, then curves upward steeply
    const y = H - pad - Math.pow(yR, 2.0) * graphH;
    points.push({ x, y });
  }

  // ── Fill area under curve (red gradient) ──
  ctx.beginPath();
  ctx.moveTo(points[0].x, H - pad);
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.lineTo(planeScreenX, H - pad);
  ctx.closePath();

  const fillGrad = ctx.createLinearGradient(0, planeScreenY, 0, H - pad);
  fillGrad.addColorStop(0, 'rgba(220, 38, 38, 0.4)');
  fillGrad.addColorStop(0.6, 'rgba(220, 38, 38, 0.15)');
  fillGrad.addColorStop(1, 'rgba(220, 38, 38, 0.02)');
  ctx.fillStyle = fillGrad;
  ctx.fill();

  // ── Curve line ──
  ctx.beginPath();
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── Y-axis labels ──
  ctx.textAlign = 'right';
  ctx.font = '500 10px Inter, system-ui, sans-serif';
  const yLabels = [1, 1.5, 2, 3, 5, 10, 20, 50];
  yLabels.forEach((label) => {
    if (label >= visibleMaxMult) return;
    const yR = (label - 1) / (visibleMaxMult - 1);
    const y = H - pad - Math.pow(yR, 2.0) * graphH;
    if (y < pad || y > H - pad) return;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillText(`${label}x`, pad - 8, y + 3);
    // Dashed grid line
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(W - pad, y);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // ── Draw Airplane (bigger, detailed) ──
  drawPlane(ctx, planeScreenX, planeScreenY, multiplier);

  // ── Multiplier Text (large, centered) ──
  ctx.textAlign = 'center';
  const fontSize = Math.min(88, W * 0.13);
  ctx.font = `900 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.shadowColor = 'rgba(255,255,255,0.25)';
  ctx.shadowBlur = 25;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${multiplier.toFixed(2)}x`, W / 2, H * 0.38);
  ctx.shadowBlur = 0;
}

// ─────────────────────────────────────────────
// DRAW PLANE — Red propeller biplane (Aviator-style)
// ─────────────────────────────────────────────
function drawPlane(ctx: CanvasRenderingContext2D, x: number, y: number, mult: number) {
  const scale = 2.2;
  const angle = -0.3 - Math.sin(Date.now() * 0.002) * 0.04;
  const t = Date.now();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  // ── Engine exhaust trail ──
  const trailLen = 45 + Math.sin(t * 0.012) * 12;
  for (let i = 0; i < 5; i++) {
    const offset = Math.sin(t * 0.015 + i * 2) * 3;
    const alpha = 0.4 - i * 0.07;
    const len = trailLen - i * 6;
    const grad = ctx.createLinearGradient(-len - 20, 0, -20, 0);
    grad.addColorStop(0, `rgba(255, 100, 30, 0)`);
    grad.addColorStop(0.4, `rgba(255, 160, 50, ${alpha * 0.5})`);
    grad.addColorStop(0.8, `rgba(255, 220, 100, ${alpha})`);
    grad.addColorStop(1, `rgba(255, 255, 200, ${alpha * 0.6})`);
    ctx.beginPath();
    ctx.moveTo(-20, -2 + offset);
    ctx.quadraticCurveTo(-20 - len * 0.5, offset, -20 - len, offset * 1.5);
    ctx.quadraticCurveTo(-20 - len * 0.5, offset, -20, 2 + offset);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // ── Fuselage (body) ──
  ctx.beginPath();
  ctx.moveTo(22, 0);        // nose
  ctx.bezierCurveTo(20, -4, 10, -5.5, -5, -5);
  ctx.lineTo(-20, -3.5);    // tail top
  ctx.lineTo(-22, -2);
  ctx.lineTo(-22, 2);
  ctx.lineTo(-20, 3.5);     // tail bottom
  ctx.lineTo(-5, 5);
  ctx.bezierCurveTo(10, 5.5, 20, 4, 22, 0);
  ctx.fillStyle = '#dc2626';
  ctx.fill();
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Fuselage highlight stripe
  ctx.beginPath();
  ctx.moveTo(18, -1.5);
  ctx.lineTo(-16, -1.5);
  ctx.lineTo(-16, -0.5);
  ctx.lineTo(18, -0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();

  // ── Cockpit ──
  ctx.beginPath();
  ctx.ellipse(6, -4, 5, 3, -0.15, Math.PI, 0);
  ctx.fillStyle = '#1e3a5f';
  ctx.fill();
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  // Cockpit shine
  ctx.beginPath();
  ctx.ellipse(7, -5, 2.5, 1, -0.2, Math.PI, 0);
  ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
  ctx.fill();

  // ── Top wing ──
  ctx.beginPath();
  ctx.moveTo(-6, -5);
  ctx.lineTo(-10, -16);
  ctx.lineTo(10, -16);
  ctx.lineTo(8, -5);
  ctx.closePath();
  ctx.fillStyle = '#b91c1c';
  ctx.fill();
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  // Wing stripe
  ctx.beginPath();
  ctx.moveTo(-8, -14);
  ctx.lineTo(8, -14);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Bottom wing ──
  ctx.beginPath();
  ctx.moveTo(-6, 5);
  ctx.lineTo(-10, 14);
  ctx.lineTo(10, 14);
  ctx.lineTo(8, 5);
  ctx.closePath();
  ctx.fillStyle = '#b91c1c';
  ctx.fill();
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // ── Wing struts (connecting top and bottom wings) ──
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-4, -5);
  ctx.lineTo(-6, 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, -5);
  ctx.lineTo(6, 5);
  ctx.stroke();

  // ── Tail fin (vertical stabilizer) ──
  ctx.beginPath();
  ctx.moveTo(-18, -3.5);
  ctx.lineTo(-24, -12);
  ctx.lineTo(-16, -12);
  ctx.lineTo(-14, -3.5);
  ctx.fillStyle = '#dc2626';
  ctx.fill();
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // ── Horizontal stabilizer (tail wings) ──
  ctx.beginPath();
  ctx.moveTo(-18, -2);
  ctx.lineTo(-26, -6);
  ctx.lineTo(-26, -4);
  ctx.lineTo(-18, 0);
  ctx.fillStyle = '#b91c1c';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-18, 2);
  ctx.lineTo(-26, 6);
  ctx.lineTo(-26, 4);
  ctx.lineTo(-18, 0);
  ctx.fillStyle = '#b91c1c';
  ctx.fill();

  // ── Propeller (spinning) ──
  const propAngle = t * 0.03;
  ctx.save();
  ctx.translate(22, 0);
  // Prop hub
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#374151';
  ctx.fill();
  // Prop blades (spinning)
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate(propAngle + (i * Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.ellipse(0, -8, 1.5, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(150, 150, 150, ${0.5 + Math.sin(propAngle + i) * 0.2})`;
    ctx.fill();
    ctx.restore();
  }
  // Prop blur circle (motion blur effect)
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.12)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // ── Landing gear ──
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(2, 5);
  ctx.lineTo(0, 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(6, 5);
  ctx.lineTo(8, 18);
  ctx.stroke();
  // Wheels
  ctx.beginPath();
  ctx.arc(0, 19, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#333';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, 19, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#333';
  ctx.fill();

  // ── Outer glow ──
  ctx.beginPath();
  ctx.arc(0, 0, 35, 0, Math.PI * 2);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 35);
  glow.addColorStop(0, 'rgba(239, 68, 68, 0.12)');
  glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = glow;
  ctx.fill();

  ctx.restore();
}

// ─────────────────────────────────────────────
// CRASHED — Dramatic explosion + debris
// ─────────────────────────────────────────────
function drawCrashed(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  pad: number,
  crashMult: number,
  crashTime: number
) {
  const elapsed = (Date.now() - crashTime) / 1000; // seconds since crash
  const cx = W / 2;
  const cy = H / 2 - 20;

  // ── Phase 1: Explosion flash (first 0.3s) ──
  if (elapsed < 0.3) {
    const flash = 1 - elapsed / 0.3;
    ctx.fillStyle = `rgba(255, 200, 50, ${flash * 0.3})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Phase 2: Expanding explosion rings ──
  const numRings = 3;
  for (let i = 0; i < numRings; i++) {
    const delay = i * 0.15;
    const ringElapsed = Math.max(0, elapsed - delay);
    const radius = ringElapsed * 120;
    const alpha = Math.max(0, 0.4 - ringElapsed * 0.3);
    if (alpha <= 0) continue;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
    ctx.lineWidth = 3 - i;
    ctx.stroke();
  }

  // ── Phase 3: Debris particles flying outward ──
  const numDebris = 20;
  for (let i = 0; i < numDebris; i++) {
    const angle = (i / numDebris) * Math.PI * 2 + i * 0.5;
    const speed = 60 + (i % 5) * 30;
    const gravity = 40;
    const px = cx + Math.cos(angle) * speed * elapsed;
    const py = cy + Math.sin(angle) * speed * elapsed + gravity * elapsed * elapsed;
    const alpha = Math.max(0, 1 - elapsed * 0.5);
    const size = 2 + (i % 3);

    if (alpha <= 0) continue;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(elapsed * (i % 2 === 0 ? 3 : -3));

    // Mix of red and orange debris
    const colors = ['#ef4444', '#f97316', '#fbbf24', '#dc2626'];
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = alpha;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Smoke puffs ──
  const numSmoke = 8;
  for (let i = 0; i < numSmoke; i++) {
    const delay = i * 0.1;
    const smokeElapsed = Math.max(0, elapsed - delay);
    const angle = (i / numSmoke) * Math.PI * 2;
    const dist = smokeElapsed * 40;
    const sx = cx + Math.cos(angle) * dist;
    const sy = cy + Math.sin(angle) * dist - smokeElapsed * 20;
    const radius = 8 + smokeElapsed * 25;
    const alpha = Math.max(0, 0.2 - smokeElapsed * 0.08);
    if (alpha <= 0) continue;

    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
    ctx.fill();
  }

  // ── "FLEW AWAY!" text ──
  ctx.textAlign = 'center';
  const textAlpha = Math.min(1, elapsed * 2);

  ctx.font = '700 16px Inter, system-ui, sans-serif';
  ctx.fillStyle = `rgba(239, 68, 68, ${textAlpha * 0.7})`;
  ctx.fillText('FLEW AWAY!', cx, cy - 55);

  // ── Crash multiplier (scales in) ──
  const textScale = Math.min(1, elapsed * 3);
  const fontSize = 80 * textScale;
  ctx.font = `900 ${Math.max(fontSize, 20)}px Inter, system-ui, sans-serif`;
  ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#ef4444';
  ctx.fillText(`${crashMult.toFixed(2)}x`, cx, cy + 25);
  ctx.shadowBlur = 0;

  // ── Pulsing red glow behind text ──
  const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.15;
  ctx.beginPath();
  ctx.arc(cx, cy - 10, 100, 0, Math.PI * 2);
  const textGlow = ctx.createRadialGradient(cx, cy - 10, 0, cx, cy - 10, 100);
  textGlow.addColorStop(0, `rgba(239, 68, 68, ${pulse})`);
  textGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = textGlow;
  ctx.fill();
}
