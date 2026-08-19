// ============================================
// JetX Canvas — Smooth animation via refs
// No arc trail, bigger jet, diagonal scroll,
// sky darkens with altitude
// ============================================
'use client';

import { useRef, useEffect, useCallback } from 'react';

interface JetXCanvasProps {
  phase: string;
  multiplier: number;
  countdown: number;
}

export default function JetXCanvas({ phase, multiplier, countdown }: JetXCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const crashTimeRef = useRef(0);
  const prevPhaseRef = useRef('');
  const animIdRef = useRef<number>(0);

  // Use REFS for rapidly changing values so draw() never needs to be re-created
  const phaseRef = useRef(phase);
  const multiplierRef = useRef(multiplier);
  const countdownRef = useRef(countdown);

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { multiplierRef.current = multiplier; }, [multiplier]);
  useEffect(() => { countdownRef.current = countdown; }, [countdown]);

  useEffect(() => {
    if (phase === 'CRASHED' && prevPhaseRef.current !== 'CRASHED') {
      crashTimeRef.current = Date.now();
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  // Stars & clouds (persistent across frames)
  const starsRef = useRef<{ x: number; y: number; size: number; brightness: number }[]>([]);
  const cloudsRef = useRef<{ x: number; y: number; w: number; h: number; speed: number; opacity: number }[]>([]);
  const smokeRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; type: string }[]>([]);

  // Initialize once
  useEffect(() => {
    starsRef.current = Array.from({ length: 50 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.5 + Math.random() * 1.5,
      brightness: 0.3 + Math.random() * 0.7,
    }));
    cloudsRef.current = Array.from({ length: 10 }, () => ({
      x: Math.random() * 1.4,
      y: Math.random() * 0.8 + 0.1,
      w: 0.1 + Math.random() * 0.18,
      h: 0.03 + Math.random() * 0.05,
      speed: 0.00012 + Math.random() * 0.00018,
      opacity: 0.25 + Math.random() * 0.35,
    }));
  }, []);

  // ── Draw jet (stable function, no deps) ──
  const drawJet = useCallback((ctx: CanvasRenderingContext2D, s: number) => {
    ctx.fillStyle = '#f0c830';
    ctx.beginPath();
    ctx.moveTo(s * 1.3, 0);
    ctx.lineTo(s * 0.8, -s * 0.06);
    ctx.lineTo(s * 0.3, -s * 0.1);
    ctx.lineTo(-s * 0.3, -s * 0.1);
    ctx.lineTo(-s * 0.55, -s * 0.06);
    ctx.lineTo(-s * 0.55, s * 0.06);
    ctx.lineTo(-s * 0.3, s * 0.1);
    ctx.lineTo(s * 0.3, s * 0.1);
    ctx.lineTo(s * 0.8, s * 0.06);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#d4a820';
    ctx.fillRect(-s * 0.45, -s * 0.015, s * 1.45, s * 0.03);

    ctx.fillStyle = '#88ddff';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(s * 0.6, -s * 0.02, s * 0.1, s * 0.04, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#a08a20';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Top wing
    ctx.fillStyle = '#c8c8d0';
    ctx.beginPath();
    ctx.moveTo(s * 0.15, -s * 0.1);
    ctx.lineTo(-s * 0.15, -s * 0.42);
    ctx.lineTo(-s * 0.35, -s * 0.38);
    ctx.lineTo(-s * 0.15, -s * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e6b800';
    ctx.beginPath();
    ctx.moveTo(s * 0.05, -s * 0.11);
    ctx.lineTo(-s * 0.1, -s * 0.28);
    ctx.lineTo(-s * 0.18, -s * 0.26);
    ctx.lineTo(-s * 0.05, -s * 0.11);
    ctx.closePath();
    ctx.fill();

    // Bottom wing
    ctx.fillStyle = '#c8c8d0';
    ctx.beginPath();
    ctx.moveTo(s * 0.15, s * 0.1);
    ctx.lineTo(-s * 0.15, s * 0.42);
    ctx.lineTo(-s * 0.35, s * 0.38);
    ctx.lineTo(-s * 0.15, s * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e6b800';
    ctx.beginPath();
    ctx.moveTo(s * 0.05, s * 0.11);
    ctx.lineTo(-s * 0.1, s * 0.28);
    ctx.lineTo(-s * 0.18, s * 0.26);
    ctx.lineTo(-s * 0.05, s * 0.11);
    ctx.closePath();
    ctx.fill();

    // Tail fins
    ctx.fillStyle = '#e0c030';
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.08);
    ctx.lineTo(-s * 0.6, -s * 0.25);
    ctx.lineTo(-s * 0.55, -s * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, s * 0.08);
    ctx.lineTo(-s * 0.6, s * 0.25);
    ctx.lineTo(-s * 0.55, s * 0.08);
    ctx.closePath();
    ctx.fill();

    // Nose highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(s * 1.25, -s * 0.01);
    ctx.lineTo(s * 0.8, -s * 0.05);
    ctx.lineTo(s * 0.8, 0);
    ctx.closePath();
    ctx.fill();
  }, []);

  // ── Single stable draw loop — reads refs, never re-created ──
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) { animIdRef.current = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { animIdRef.current = requestAnimationFrame(draw); return; }

      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
          canvas.width = Math.floor(rect.width * dpr);
          canvas.height = Math.floor(rect.height * dpr);
          canvas.style.width = `${rect.width}px`;
          canvas.style.height = `${rect.height}px`;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const W = rect?.width || canvas.width;
      const H = rect?.height || canvas.height;
      frameRef.current++;

      // Read current values from refs
      const curPhase = phaseRef.current;
      const curMult = multiplierRef.current;
      const curCountdown = countdownRef.current;

      const altitude = curPhase === 'RUNNING' ? Math.min((curMult - 1) / 8, 1) : 0;

      // ── BACKGROUND (darkens with altitude) ──
      const df = altitude;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, `rgb(${26 - df * 16 | 0}, ${30 - df * 20 | 0}, ${46 - df * 30 | 0})`);
      skyGrad.addColorStop(0.35, `rgb(${42 - df * 25 | 0}, ${37 - df * 22 | 0}, ${64 - df * 35 | 0})`);
      skyGrad.addColorStop(0.65, `rgb(${61 - df * 35 | 0}, ${45 - df * 28 | 0}, ${77 - df * 40 | 0})`);
      skyGrad.addColorStop(0.85, `rgb(${196 * (1 - df * 0.7) | 0}, ${136 * (1 - df * 0.7) | 0}, ${138 * (1 - df * 0.6) | 0})`);
      skyGrad.addColorStop(1, `rgb(${212 * (1 - df * 0.6) | 0}, ${160 * (1 - df * 0.6) | 0}, ${144 * (1 - df * 0.5) | 0})`);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // ── STARS (top-right → bottom-left, always) ──
      const sSp = curPhase === 'RUNNING' ? 0.0006 : 0.0002;
      for (const star of starsRef.current) {
        star.x -= sSp;
        star.y += sSp * 0.6;
        if (star.x < -0.05 || star.y > 1.05) {
          star.x = 1 + Math.random() * 0.1;
          star.y = Math.random() * 0.3;
        }
        const tw = 0.5 + Math.sin(frameRef.current * 0.04 + star.y * 15) * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * tw * (0.5 + df * 0.5)})`;
        ctx.beginPath();
        ctx.arc(star.x * W, star.y * H, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── CLOUDS (top-right → bottom-left, always) ──
      const cSp = curPhase === 'RUNNING' ? 1.8 : 0.6;
      for (const cloud of cloudsRef.current) {
        cloud.x -= cloud.speed * cSp;
        cloud.y += cloud.speed * cSp * 0.5;
        if (cloud.x + cloud.w < -0.15 || cloud.y > 1.1) {
          cloud.x = 1.1 + Math.random() * 0.3;
          cloud.y = Math.random() * 0.4;
        }
        const cx = cloud.x * W, cy = cloud.y * H;
        const cw = cloud.w * W, ch = cloud.h * H;
        ctx.save();
        ctx.globalAlpha = cloud.opacity * (1 - df * 0.6);
        const cg = ctx.createRadialGradient(cx, cy, cw * 0.1, cx, cy, cw);
        cg.addColorStop(0, 'rgba(210,160,170,0.6)');
        cg.addColorStop(0.4, 'rgba(190,130,150,0.3)');
        cg.addColorStop(1, 'rgba(160,100,130,0)');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + cw * 0.35, cy - ch * 0.25, cw * 0.6, ch * 0.7, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── PHASE RENDERING ──
      if (curPhase === 'COUNTDOWN') {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = `bold ${Math.min(W * 0.045, 26)}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('NEXT ROUND IN', W / 2, H * 0.38);
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold ${Math.min(W * 0.12, 64)}px 'Inter', sans-serif`;
        ctx.fillText(`${curCountdown}s`, W / 2, H * 0.54);
        const pulse = Math.sin(frameRef.current * 0.06) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255,215,0,${pulse * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(W / 2, H * 0.46, 40 + pulse * 8, 0, Math.PI * 2);
        ctx.stroke();

      } else if (curPhase === 'RUNNING') {
        // ── JET: moves from bottom-left to top-right ──
        // Match Aviator speed: use multiplier directly with viewport scaling
        const visibleMax = Math.max(curMult * 1.35, 2);
        const yRatio = (curMult - 1) / (visibleMax - 1);
        // X moves rightward proportional to multiplier
        const xProgress = Math.min(yRatio * 1.2, 0.85);

        // Start: bottom-left, moves toward upper-right
        const jX = W * 0.08 + xProgress * W * 0.55;
        const jY = H * 0.82 - Math.pow(yRatio, 1.5) * H * 0.7;

        // Rotation: 0° at start → -45° by ~2x, stays at -45°
        const rotProgress = Math.min((curMult - 1) / 1.5, 1);
        const rotEased = 1 - Math.pow(1 - rotProgress, 3);
        const jetAngle = -rotEased * (Math.PI / 4);

        // Smoke + fire (emit behind the jet based on its angle)
        if (frameRef.current % 2 === 0) {
          const behindAngle = jetAngle + Math.PI; // opposite direction
          for (let i = 0; i < 2; i++) {
            smokeRef.current.push({
              x: jX + Math.cos(behindAngle) * 28,
              y: jY + Math.sin(behindAngle) * 28,
              vx: Math.cos(behindAngle) * (1.2 + Math.random()) + (Math.random() - 0.5) * 0.5,
              vy: Math.sin(behindAngle) * (1.2 + Math.random()) + (Math.random() - 0.5) * 0.5,
              life: 0, maxLife: 35 + Math.random() * 20, size: 5 + Math.random() * 7, type: 'smoke',
            });
          }
          for (let i = 0; i < 2; i++) {
            smokeRef.current.push({
              x: jX + Math.cos(behindAngle) * 20,
              y: jY + Math.sin(behindAngle) * 20,
              vx: Math.cos(behindAngle) * (2.5 + Math.random() * 2) + (Math.random() - 0.5),
              vy: Math.sin(behindAngle) * (2.5 + Math.random() * 2) + (Math.random() - 0.5),
              life: 0, maxLife: 12 + Math.random() * 8, size: 2 + Math.random() * 3, type: 'fire',
            });
          }
        }

        smokeRef.current = smokeRef.current.filter(p => {
          p.life++;
          p.x += p.vx; p.y += p.vy;
          p.vx *= 0.97; p.vy *= 0.97;
          if (p.life >= p.maxLife) return false;
          const a = 1 - p.life / p.maxLife;
          if (p.type === 'smoke') {
            ctx.fillStyle = `rgba(140,140,155,${a * 0.25})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 + p.life / p.maxLife * 1.2), 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = `hsla(${25 + (p.life / p.maxLife) * 25},100%,55%,${a * 0.7})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 - p.life / p.maxLife * 0.4), 0, Math.PI * 2);
            ctx.fill();
          }
          return true;
        });

        // Draw jet at fixed position with rotation
        const jetSize = Math.min(W * 0.085, 55);
        ctx.save();
        ctx.translate(jX, jY);
        ctx.rotate(jetAngle);
        drawJet(ctx, jetSize);

        // Flame
        const fL = jetSize * (0.6 + Math.sin(frameRef.current * 0.5) * 0.15);
        const fg = ctx.createLinearGradient(-jetSize * 0.55, 0, -jetSize * 0.55 - fL, 0);
        fg.addColorStop(0, 'rgba(255,240,100,0.95)');
        fg.addColorStop(0.25, 'rgba(255,150,0,0.7)');
        fg.addColorStop(0.6, 'rgba(255,80,0,0.3)');
        fg.addColorStop(1, 'rgba(255,30,0,0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.moveTo(-jetSize * 0.55, -jetSize * 0.07);
        ctx.quadraticCurveTo(-jetSize * 0.55 - fL * 0.5, 0, -jetSize * 0.55, jetSize * 0.07);
        ctx.lineTo(-jetSize * 0.55 - fL, 0);
        ctx.closePath();
        ctx.fill();

        // Blue flame core
        ctx.fillStyle = 'rgba(150,200,255,0.35)';
        ctx.beginPath();
        const cL = fL * 0.45;
        ctx.moveTo(-jetSize * 0.55, -jetSize * 0.025);
        ctx.quadraticCurveTo(-jetSize * 0.55 - cL * 0.4, 0, -jetSize * 0.55, jetSize * 0.025);
        ctx.lineTo(-jetSize * 0.55 - cL, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Multiplier text
        const fontSize = Math.min(W * 0.11, 60);
        ctx.font = `900 ${fontSize}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#00ff00';
        ctx.fillText(curMult.toFixed(2) + 'x', W * 0.45, H * 0.2);
        ctx.shadowBlur = 0;

      } else if (curPhase === 'CRASHED') {
        const el = Date.now() - crashTimeRef.current;
        if (el < 400) {
          ctx.fillStyle = `rgba(255,30,0,${(1 - el / 400) * 0.2})`;
          ctx.fillRect(0, 0, W, H);
        }
        if (el < 1500) {
          const al = Math.max(0, 1 - el / 1500);
          ctx.strokeStyle = `rgba(255,100,0,${al * 0.5})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(W * 0.5, H * 0.38, el * 0.15, 0, Math.PI * 2);
          ctx.stroke();
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2 + el * 0.002;
            const d = el * 0.1 + i * 3;
            ctx.fillStyle = `rgba(255,${60 + i * 15},0,${al * 0.4})`;
            ctx.beginPath();
            ctx.arc(W * 0.5 + Math.cos(a) * d, H * 0.38 + Math.sin(a) * d, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.font = `900 ${Math.min(W * 0.11, 60)}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ff4444';
        ctx.fillText(`${curMult.toFixed(2)}x`, W * 0.45, H * 0.36);
        ctx.shadowBlur = 0;
        ctx.font = `bold ${Math.min(W * 0.035, 20)}px 'Inter', sans-serif`;
        ctx.fillStyle = '#ff6666';
        ctx.fillText('FLEW AWAY!', W * 0.45, H * 0.36 + 42);
      }

      animIdRef.current = requestAnimationFrame(draw);
    };

    animIdRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animIdRef.current);
  }, [drawJet]); // drawJet has no deps, so this effect runs ONCE

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
