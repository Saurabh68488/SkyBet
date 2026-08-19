// ============================================
// Ludo Game Page — Improved Flow
// ============================================
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { io, Socket } from 'socket.io-client';
import LudoBoard from '@/components/ludo/LudoBoard';
import LudoResults from '@/components/ludo/LudoResults';
import { ArrowLeft, Loader2, WifiOff } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

export default function LudoGameClient() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { user, loading: authLoading } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mode, setMode] = useState('2P');
  const [entryFee, setEntryFee] = useState(0);
  const [validMoves, setValidMoves] = useState<number[]>([]);
  const [myPlayerIdx, setMyPlayerIdx] = useState(-1);
  const [diceAnimating, setDiceAnimating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !roomId) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('ludo:reconnect', { roomId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('ludo:state', (data: any) => {
      setGameState(data.gameState);
      setMode(data.mode);
      setEntryFee(data.entryFee);
    });

    socket.on('ludo:start', (data: any) => {
      setGameState(data.gameState);
      setMode(data.mode);
      setEntryFee(data.entryFee);
    });

    socket.on('ludo:dice', (data: any) => {
      setDiceAnimating(true);
      setTimeout(() => {
        setDiceAnimating(false);
        setValidMoves(data.validMoves || []);
        setGameState(prev => {
          if (!prev) return prev;
          return { ...prev, diceValue: data.dice, diceRolled: true };
        });
        if (data.tripleSix) {
          toast('Triple 6! Turn skipped 😱', { icon: '⚠️' });
        }
        if (data.autoRoll) {
          toast('Time out — auto rolled!', { icon: '⏰' });
        }
      }, 700);
    });

    socket.on('ludo:move', (data: any) => {
      setGameState(data.gameState);
      setValidMoves([]);
      if (data.gameState?.lastMove?.captured) {
        toast('Token captured! 💥', { icon: '⚔️' });
      }
    });

    socket.on('ludo:turn', (data: any) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          currentTurn: data.currentTurn,
          diceRolled: false,
          diceValue: 0,
        };
      });
      setValidMoves([]);
    });

    socket.on('ludo:finish', (data: any) => {
      setResults(data);
    });

    socket.on('ludo:error', (data: any) => {
      toast.error(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, router]);

  useEffect(() => {
    if (!gameState || !user) return;
    const idx = gameState.players.findIndex(p => p.name === user.username);
    if (idx !== myPlayerIdx) setMyPlayerIdx(idx);
  }, [gameState?.players, user]);

  const isMyTurn = gameState && myPlayerIdx >= 0 && gameState.currentTurn === myPlayerIdx;

  const handleRollDice = useCallback(() => {
    if (!isMyTurn || gameState?.diceRolled || diceAnimating) return;
    socketRef.current?.emit('ludo:roll');
  }, [isMyTurn, gameState?.diceRolled, diceAnimating]);

  const handleMoveToken = useCallback((tokenIdx: number) => {
    if (!isMyTurn || !validMoves.includes(tokenIdx)) return;
    socketRef.current?.emit('ludo:move', { tokenIdx });
    setValidMoves([]);
  }, [isMyTurn, validMoves]);

  if (authLoading || !user) return null;

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a0a2e] to-[#0d0520] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400 text-sm mb-1">Loading game...</p>
          <p className="text-gray-600 text-xs">Room: {roomId?.substring(0, 8)}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d1b2a] to-[#1b2838] text-white flex flex-col">
      <header className="bg-[#0d1b2a]/90 border-b border-white/5 px-4 py-2 flex items-center justify-between shrink-0 backdrop-blur-sm">
        <Link href="/ludo" className="text-gray-400 hover:text-white transition-colors p-1">
          <ArrowLeft size={18} />
        </Link>
        <div className="text-center">
          <h1 className="text-sm font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            🎲 LUDO
          </h1>
          <p className="text-[10px] text-gray-500">{mode} • {entryFee} Coins</p>
        </div>
        <div className="flex items-center gap-1">
          {connected ? (
            <span className="w-2 h-2 rounded-full bg-green-500" title="Connected" />
          ) : (
            <WifiOff size={14} className="text-red-400" />
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-2 py-3">
        <LudoBoard
          gameState={gameState}
          myPlayerIdx={myPlayerIdx}
          validMoves={validMoves}
          diceAnimating={diceAnimating}
          isMyTurn={!!isMyTurn}
          onRollDice={handleRollDice}
          onMoveToken={handleMoveToken}
        />
      </div>

      {results && (
        <LudoResults
          results={results}
          myName={user.username}
          onPlayAgain={() => router.push('/ludo')}
        />
      )}
    </div>
  );
}
