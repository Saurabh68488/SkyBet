// ============================================
// useJetX Hook - Real-time JetX game state
// Same mechanics as useGame but listens to jetx: events
// ============================================
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

export interface JetXBet {
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

export interface JetXState {
  phase: 'WAITING' | 'COUNTDOWN' | 'RUNNING' | 'CRASHED';
  roundId: string | null;
  roundNumber: number;
  multiplier: number;
  countdown: number;
  startTime: number | null;
  crashPoint: number | null;
  bets: JetXBet[];
  history: Array<{ roundNumber: number; crashPoint: number; createdAt: string }>;
  onlineCount: number;
}

const SPEED = 0.0001;

export function useJetX() {
  const [state, setState] = useState<JetXState>({
    phase: 'WAITING',
    roundId: null,
    roundNumber: 0,
    multiplier: 1.0,
    countdown: 10,
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

  const animateMultiplier = useCallback(() => {
    if (phaseRef.current !== 'RUNNING' || !startTimeRef.current) return;
    const elapsed = Date.now() - startTimeRef.current;
    const multiplier = 1 + elapsed * SPEED;
    const rounded = Math.floor(multiplier * 100) / 100;
    setState((prev) => ({ ...prev, multiplier: rounded }));
    animFrameRef.current = requestAnimationFrame(animateMultiplier);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // Request JetX state on connect
    socket.emit('jetx:join', {});

    socket.on('jetx:state', (data) => {
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

    socket.on('jetx:countdown', (data) => {
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

    socket.on('jetx:start', (data) => {
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

    socket.on('jetx:tick', (data) => {
      setState((prev) => {
        const drift = Math.abs(prev.multiplier - data.multiplier);
        if (drift > 0.05) return { ...prev, multiplier: data.multiplier };
        return prev;
      });
    });

    socket.on('jetx:crash', (data) => {
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

    socket.on('jetx:bets', (data) => {
      setState((prev) => ({ ...prev, bets: data.bets }));
    });

    socket.on('jetx:cashout', () => {});

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      socket.off('jetx:state');
      socket.off('jetx:countdown');
      socket.off('jetx:start');
      socket.off('jetx:tick');
      socket.off('jetx:crash');
      socket.off('jetx:bets');
      socket.off('jetx:cashout');
    };
  }, [animateMultiplier]);

  const placeBet = useCallback((amount: number, betSlot: number, autoCashout?: number) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      toast.error('Not connected. Please refresh.');
      return;
    }
    socket.emit('jetx:bet:place', { amount, betSlot, autoCashout }, (res: any) => {
      if (res && !res.success) toast.error(res.message || 'Bet failed');
    });
  }, []);

  const cashout = useCallback((betSlot: number) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      toast.error('Not connected. Please refresh.');
      return;
    }
    socket.emit('jetx:bet:cashout', { betSlot }, (res: any) => {
      if (res && !res.success) toast.error(res.message || 'Cashout failed');
    });
  }, []);

  return { state, placeBet, cashout };
}
