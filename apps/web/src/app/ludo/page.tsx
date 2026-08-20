// ============================================
// Ludo Lobby — Mode Selection + Matchmaking
// Colorful, interactive, mobile-first
// ============================================
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGameGuard } from '@/hooks/useGameGuard';
import { io, Socket } from 'socket.io-client';
import {
  ArrowLeft, Users, Trophy, Crown, Medal, Loader2, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const ENTRY_FEES = [10, 50, 100, 200, 500];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LudoLobbyPage() {
  const router = useRouter();
  const { user, loading: authLoading, balance } = useAuth();
  const { allowed, loading: guardLoading } = useGameGuard('LUDO');
  const [selectedMode, setSelectedMode] = useState<'2P' | '4P' | null>(null);
  const [selectedFee, setSelectedFee] = useState(50);
  const [matchmaking, setMatchmaking] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const socketRef = useRef<Socket | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(API_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('ludo:joined', (data: any) => {
      setMatchmaking(true);
      setCountdown(15);
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    socket.on('ludo:start', (data: any) => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      router.push(`/ludo/${data.roomId}`);
    });

    socket.on('ludo:error', (data: any) => {
      toast.error(data.message);
      setMatchmaking(false);
    });

    return () => {
      socket.disconnect();
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [router]);

  const handleFindMatch = () => {
    if (!selectedMode) { toast.error('Select a mode first'); return; }
    if (selectedFee > (balance || 0)) { toast.error('Insufficient balance'); return; }

    socketRef.current?.emit('ludo:join', { mode: selectedMode, entryFee: selectedFee });
  };

  if (authLoading || !user) return null;

  const winnings2P = { first: selectedFee * 1.5 };
  const winnings4P = { first: selectedFee * 1.8, second: selectedFee * 1.4 };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a2e] via-[#16082b] to-[#0d0520] text-white">
      {/* Header */}
      <header className="bg-[#1a0a2e]/90 border-b border-purple-500/10 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm">Back</span>
          </Link>
          <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            🎲 LUDO
          </h1>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/20 text-xs font-bold">
            ₹{(balance || 0).toFixed(0)}
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">

        {/* Matchmaking Overlay */}
        {matchmaking && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-[#1a0a2e] border border-purple-500/20 rounded-2xl p-8 text-center max-w-sm mx-4 animate-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                <Users size={36} />
              </div>
              <h2 className="text-xl font-bold mb-2">Finding Players...</h2>
              <p className="text-gray-400 text-sm mb-4">
                {selectedMode} Match • ₹{selectedFee}
              </p>
              <div className="text-4xl font-black text-purple-400 mb-4 tabular-nums">
                {countdown}s
              </div>
              <div className="flex justify-center gap-2 mb-4">
                {Array.from({ length: selectedMode === '2P' ? 2 : 4 }).map((_, i) => (
                  <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                    i === 0 ? 'border-green-500 bg-green-500/20' : 'border-gray-600 bg-gray-800 animate-pulse'
                  }`}>
                    {i === 0 ? (
                      <span className="text-green-400 text-xs font-bold">YOU</span>
                    ) : (
                      <span className="text-gray-500 text-lg">?</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-500">
                {countdown > 0 ? 'Searching for opponents...' : 'Filling with players...'}
              </p>
            </div>
          </div>
        )}

        {/* Mode Selection */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3 tracking-wider">Choose Mode</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* 2 Player */}
            <button
              onClick={() => setSelectedMode('2P')}
              className={`relative p-5 rounded-2xl border-2 transition-all duration-300 group overflow-hidden ${
                selectedMode === '2P'
                  ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20 scale-[1.02]'
                  : 'border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-blue-500/5'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center justify-center gap-1 mb-3">
                  <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-white/20" />
                  <span className="text-lg font-black">VS</span>
                  <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white/20" />
                </div>
                <h3 className="text-lg font-bold mb-1">2 Players</h3>
                <p className="text-[10px] text-gray-400">1v1 Duel</p>
              </div>
              {selectedMode === '2P' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold">✓</span>
                </div>
              )}
            </button>

            {/* 4 Player */}
            <button
              onClick={() => setSelectedMode('4P')}
              className={`relative p-5 rounded-2xl border-2 transition-all duration-300 group overflow-hidden ${
                selectedMode === '4P'
                  ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20 scale-[1.02]'
                  : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-purple-500/5'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center justify-center gap-1 mb-3">
                  <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white/20" />
                  <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white/20" />
                  <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-white/20" />
                  <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white/20" />
                </div>
                <h3 className="text-lg font-bold mb-1">4 Players</h3>
                <p className="text-[10px] text-gray-400">Battle Royale</p>
              </div>
              {selectedMode === '4P' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold">✓</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Entry Fee Selection */}
        {selectedMode && (
          <div className="mb-6 animate-in slide-in-from-bottom-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3 tracking-wider">Entry Fee</h2>
            <div className="grid grid-cols-5 gap-2">
              {ENTRY_FEES.map(fee => (
                <button
                  key={fee}
                  onClick={() => setSelectedFee(fee)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    selectedFee === fee
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/10'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:border-amber-500/40'
                  } ${fee > (balance || 0) ? 'opacity-40 cursor-not-allowed' : ''}`}
                  disabled={fee > (balance || 0)}
                >
                  <div className="text-lg font-black">{fee}</div>
                  <div className="text-[8px] uppercase">coins</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Winning Slip */}
        {selectedMode && (
          <div className="mb-6 animate-in slide-in-from-bottom-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3 tracking-wider">Winnings</h2>
            <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/20 rounded-2xl p-4">
              {selectedMode === '2P' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-yellow-500/10 rounded-xl px-4 py-3 border border-yellow-500/20">
                    <div className="flex items-center gap-2">
                      <Crown size={20} className="text-yellow-400" />
                      <div>
                        <p className="text-sm font-bold text-yellow-400">Winner (1st)</p>
                        <p className="text-[10px] text-gray-400">1.5x entry fee</p>
                      </div>
                    </div>
                    <p className="text-xl font-black text-yellow-400">{winnings2P.first} <span className="text-xs">coins</span></p>
                  </div>
                  <div className="flex items-center justify-between bg-red-500/5 rounded-xl px-4 py-3 border border-red-500/10">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 text-lg">💔</span>
                      <div>
                        <p className="text-sm font-bold text-red-400">Loser</p>
                        <p className="text-[10px] text-gray-400">Entry fee lost</p>
                      </div>
                    </div>
                    <p className="text-lg font-black text-red-400">0 <span className="text-xs">coins</span></p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-yellow-500/10 rounded-xl px-4 py-3 border border-yellow-500/20">
                    <div className="flex items-center gap-2">
                      <Crown size={18} className="text-yellow-400" />
                      <div>
                        <p className="text-sm font-bold text-yellow-400">1st Place</p>
                        <p className="text-[10px] text-gray-400">1.8x entry</p>
                      </div>
                    </div>
                    <p className="text-lg font-black text-yellow-400">{winnings4P.first} <span className="text-xs">coins</span></p>
                  </div>
                  <div className="flex items-center justify-between bg-gray-500/10 rounded-xl px-4 py-3 border border-gray-500/20">
                    <div className="flex items-center gap-2">
                      <Medal size={18} className="text-gray-300" />
                      <div>
                        <p className="text-sm font-bold text-gray-300">2nd Place</p>
                        <p className="text-[10px] text-gray-400">1.4x entry</p>
                      </div>
                    </div>
                    <p className="text-lg font-black text-gray-300">{winnings4P.second} <span className="text-xs">coins</span></p>
                  </div>
                  <div className="flex items-center justify-between bg-red-500/5 rounded-xl px-4 py-2.5 border border-red-500/10">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 text-sm">💔</span>
                      <p className="text-xs font-bold text-red-400">3rd & 4th — Nothing</p>
                    </div>
                    <p className="text-sm font-black text-red-400">0</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Play Button */}
        {selectedMode && (
          <div className="animate-in slide-in-from-bottom-4">
            <button
              onClick={handleFindMatch}
              disabled={matchmaking || selectedFee > (balance || 0)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-black text-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {matchmaking ? (
                <><Loader2 size={20} className="animate-spin" /> Finding Match...</>
              ) : (
                <><Users size={20} /> FIND MATCH — ₹{selectedFee}</>
              )}
            </button>
            <p className="text-center text-[10px] text-gray-500 mt-2">
              Entry fee will be deducted when match is found
            </p>
          </div>
        )}

        {/* How to Play */}
        <div className="mt-8 bg-white/5 rounded-2xl p-4 border border-white/5">
          <h3 className="text-sm font-bold text-purple-400 mb-3">📋 How to Play</h3>
          <div className="space-y-2 text-xs text-gray-400">
            <p>🎲 Roll a 6 to bring a token out of the base</p>
            <p>🏃 Move tokens along the path to reach home</p>
            <p>⚔️ Land on an opponent to send them back to base</p>
            <p>🔥 Rolling a 6 gives you an extra turn</p>
            <p>⚠️ Three 6s in a row = turn skipped!</p>
            <p>🏆 First to get all 4 tokens home wins!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
