// ============================================
// useGame Hook - Real-time game state management
// ============================================
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

export interface GameBet {
  id: string;
  userId: string;
  username: string;
  amount: number;
  betSlot: number;
  autoCashout: number | null;
  cashoutAt: number | null;
  winAmount: number | null;
  status: string;
}

export interface GameState {
  phase: 'WAITING' | 'COUNTDOWN' | 'RUNNING' | 'CRASHED';
  roundId: string | null;
  roundNumber: number;
  multiplier: number;
  countdown: number;
  startTime: number | null;
  crashPoint: number | null;
  bets: GameBet[];
  history: Array<{ roundNumber: number; crashPoint: number; createdAt: string }>;
  onlineCount: number;
}

const SPEED = 0.0001; // Must match server — LINEAR: 0.1x per second

export function useGame() {
  const [state, setState] = useState<GameState>({
    phase: 'WAITING',
    roundId: null,
    roundNumber: 0,
    multiplier: 1.0,
    countdown: 15,
    startTime: null,
    crashPoint: null,
    bets: [],
    history: [],
    onlineCount: 0,
  });

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const phaseRef = useRef<string>('WAITING');
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  // Client-side multiplier interpolation for 60fps — LINEAR formula
  const animateMultiplier = useCallback(() => {
    if (phaseRef.current !== 'RUNNING' || !startTimeRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const multiplier = 1 + elapsed * SPEED; // LINEAR — constant speed
    const rounded = Math.floor(multiplier * 100) / 100;

    setState((prev) => ({ ...prev, multiplier: rounded }));
    animFrameRef.current = requestAnimationFrame(animateMultiplier);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // Full game state sync (on connect/reconnect)
    socket.on('game:state', (data) => {
      phaseRef.current = data.phase;
      startTimeRef.current = data.startTime;
      setState((prev) => ({
        ...prev,
        ...data,
        multiplier: data.phase === 'RUNNING' ? data.multiplier : 1.0,
      }));

      if (data.phase === 'RUNNING' && data.startTime) {
        startTimeRef.current = data.startTime;
        animFrameRef.current = requestAnimationFrame(animateMultiplier);
      }
    });

    // Countdown tick
    socket.on('game:countdown', (data) => {
      phaseRef.current = 'COUNTDOWN';
      setState((prev) => ({
        ...prev,
        phase: 'COUNTDOWN',
        countdown: data.secondsLeft,
        roundNumber: data.roundNumber,
        roundId: data.roundId,
        multiplier: 1.0,
        crashPoint: null,
      }));
    });

    // Game started
    socket.on('game:start', (data) => {
      phaseRef.current = 'RUNNING';
      startTimeRef.current = data.startTime;
      setState((prev) => ({
        ...prev,
        phase: 'RUNNING',
        roundId: data.roundId,
        roundNumber: data.roundNumber,
        startTime: data.startTime,
        multiplier: 1.0,
        crashPoint: null,
      }));
      animFrameRef.current = requestAnimationFrame(animateMultiplier);
    });

    // Multiplier tick (for drift correction)
    socket.on('game:tick', (data) => {
      // Only correct if drift > 0.05x
      setState((prev) => {
        const drift = Math.abs(prev.multiplier - data.multiplier);
        if (drift > 0.05) {
          return { ...prev, multiplier: data.multiplier };
        }
        return prev;
      });
    });

    // Game crashed
    socket.on('game:crash', (data) => {
      phaseRef.current = 'CRASHED';
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setState((prev) => ({
        ...prev,
        phase: 'CRASHED',
        crashPoint: data.crashPoint,
        multiplier: data.crashPoint,
        history: [...prev.history, {
          roundNumber: data.roundNumber,
          crashPoint: data.crashPoint,
          createdAt: new Date().toISOString(),
        }].slice(-20),
      }));
    });

    // Bets update
    socket.on('game:bets', (data) => {
      setState((prev) => ({ ...prev, bets: data.bets }));
    });

    // Cashout event
    socket.on('game:cashout', (data) => {
      // Already handled through bets update
    });

    // Balance update
    socket.on('player:balance', (data) => {
      // Handled at app level
    });

    // Notification
    socket.on('notification', (data) => {
      if (data.type === 'success') toast.success(data.message);
      else if (data.type === 'error') toast.error(data.message);
      else toast(data.message);
    });

    // Online count
    socket.on('online:count', (data) => {
      setState((prev) => ({ ...prev, onlineCount: data.count }));
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      socket.off('game:state');
      socket.off('game:countdown');
      socket.off('game:start');
      socket.off('game:tick');
      socket.off('game:crash');
      socket.off('game:bets');
      socket.off('game:cashout');
      socket.off('player:balance');
      socket.off('notification');
      socket.off('online:count');
    };
  }, [animateMultiplier]);

  // Place bet
  const placeBet = useCallback((amount: number, betSlot: number, autoCashout?: number) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      toast.error('Not connected to server. Please refresh.');
      return;
    }

    socket.emit('bet:place', { amount, betSlot, autoCashout }, (res: any) => {
      if (res && !res.success) {
        toast.error(res.message || 'Failed to place bet');
      }
    });
  }, []);

  // Cash out
  const cashout = useCallback((betSlot: number) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      toast.error('Not connected to server. Please refresh.');
      return;
    }

    socket.emit('bet:cashout', { betSlot }, (res: any) => {
      if (res && !res.success) {
        toast.error(res.message || 'Cashout failed');
      }
    });
  }, []);

  return { state, placeBet, cashout };
}
