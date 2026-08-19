// ============================================
// Aviation Game Page — Mobile-first Aviator layout
// No scroll, fake bot bets at bottom on mobile
// ============================================
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/hooks/useGame';
import { useAuth } from '@/hooks/useAuth';
import { useGameGuard } from '@/hooks/useGameGuard';
import AviationCanvas from '@/components/game/AviationCanvas';
import BetPanel from '@/components/game/BetPanel';
import LiveBets from '@/components/game/LiveBets';
import GameHistory from '@/components/game/GameHistory';
import HowToPlay from '@/components/game/HowToPlay';
import { Plane, Wallet, LogOut, Shield, Coins, Users as UsersIcon, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// ── Fake bot names ──
const BOT_NAMES = [
  'Rahul_K', 'Priya_M', 'Amit_23', 'Sneha_R', 'Vikram_S', 'Anjali_P',
  'Ravi_007', 'Deepak_X', 'Neha_99', 'Arjun_V', 'Pooja_D', 'Kiran_T',
  'Mohit_L', 'Suman_B', 'Raj_555', 'Divya_G', 'Arun_88', 'Meena_W',
  'Sahil_C', 'Tanvi_11', 'Harsh_J', 'Swati_N', 'Gaurav_F', 'Ritika_H',
  'Lucky_77', 'Manoj_Q', 'Simran_A', 'Vishal_E', 'Kavita_Z', 'Rohit_Y',
  'Suresh_U', 'Geeta_I', 'Nikhil_O', 'Anita_1', 'Pankaj_X', 'Komal_5',
];

function generateFakeBets(phase: string, multiplier: number): any[] {
  const count = 8 + Math.floor(Math.random() * 12); // 8-20 fake bets
  const bets: any[] = [];
  for (let i = 0; i < count; i++) {
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const amount = [300, 500, 750, 1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000, 15000, 20000, 25000][Math.floor(Math.random() * 14)];
    const cashedOut = phase === 'RUNNING' && Math.random() > 0.6;
    const cashoutMult = cashedOut ? 1 + Math.random() * (multiplier - 1) * 0.8 : undefined;
    bets.push({
      id: `bot-${i}-${Date.now()}`,
      odUserId: `bot-${i}`,
      username: name,
      amount,
      slot: 1,
      status: cashedOut ? 'WON' : 'ACTIVE',
      cashoutAt: cashoutMult ? Math.round(cashoutMult * 100) / 100 : undefined,
      winAmount: cashoutMult ? Math.round(amount * cashoutMult) : undefined,
    });
  }
  return bets.sort((a, b) => b.amount - a.amount);
}

export default function GamePage() {
  const router = useRouter();
  const { user, loading, balance, logout } = useAuth();
  const { allowed, loading: guardLoading } = useGameGuard('AVIATION');
  const { state, placeBet, cashout } = useGame();
  const [showRules, setShowRules] = useState(false);
  const [showBets, setShowBets] = useState(false);
  const [fakeBets, setFakeBets] = useState<any[]>([]);

  // Generate fake bets on each new round
  useEffect(() => {
    if (state.phase === 'COUNTDOWN') {
      setFakeBets(generateFakeBets('COUNTDOWN', 1));
    }
  }, [state.phase === 'COUNTDOWN']);

  // Update some fake bets to "cashed out" during running
  useEffect(() => {
    if (state.phase === 'RUNNING' && state.multiplier > 1.5) {
      setFakeBets(prev => prev.map(b => {
        if (b.status === 'ACTIVE' && Math.random() > 0.92) {
          const cashoutMult = Math.round(state.multiplier * (0.7 + Math.random() * 0.25) * 100) / 100;
          return { ...b, status: 'WON', cashoutAt: cashoutMult, winAmount: Math.round(b.amount * cashoutMult) };
        }
        return b;
      }));
    }
  }, [state.multiplier]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('skybet-hide-rules')) {
      setShowRules(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Combine real + fake bets for display
  const allBets = useMemo(() => [...state.bets, ...fakeBets], [state.bets, fakeBets]);

  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#0e0e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Plane className="w-8 h-8 text-red-500 animate-pulse" />
          <span className="text-sm text-gray-400">Loading SkyBet...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-[100dvh] bg-[#0e0e1a] flex flex-col overflow-hidden">
      {/* ── How to Play Modal ── */}
      {showRules && <HowToPlay onClose={() => setShowRules(false)} />}

      {/* ── Top Header Bar ── */}
      <header className="bg-[#1a1a2e]/90 border-b border-white/5 flex items-center justify-between px-3 py-2 shrink-0">
        {/* Left: Back + Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors p-1">
            <ArrowLeft size={18} />
          </Link>
          <Link href="/game" className="flex items-center gap-1.5">
            <Plane size={16} className="text-red-500" />
            <span className="text-sm font-bold text-white tracking-wide hidden sm:inline">SkyBet</span>
          </Link>
        </div>

        {/* Center: Crash History */}
        <div className="flex-1 mx-2 sm:mx-4 overflow-hidden">
          <GameHistory history={state.history} />
        </div>

        {/* Right: Balance + icons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#1e293b] rounded-full px-2.5 py-1">
            <Coins size={12} className="text-amber-400" />
            <span className="text-[11px] font-bold text-amber-400 tabular-nums">{balance.toFixed(2)}</span>
          </div>
          <Link href="/wallet" className="text-gray-400 hover:text-white transition-colors" title="Wallet">
            <Wallet size={15} />
          </Link>
          {/* Live bets toggle — mobile only */}
          <button
            onClick={() => setShowBets(!showBets)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
            title="Live Bets"
          >
            <UsersIcon size={15} />
          </button>
          {user.role === 'ADMIN' && (
            <Link href="/admin" className="text-cyan-400 hover:text-cyan-300 transition-colors hidden sm:block" title="Admin">
              <Shield size={15} />
            </Link>
          )}
          <button
            onClick={async () => { await logout(); router.replace('/login'); }}
            className="text-gray-500 hover:text-red-400 transition-colors hidden sm:block"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex flex-1 min-h-0 relative">
        {/* ── Left: Live Bets Sidebar — overlay on mobile ── */}
        <aside className={`
          ${showBets ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          absolute lg:relative z-20
          w-[260px] bg-[#111122] border-r border-white/5 flex flex-col shrink-0
          transition-transform duration-300 ease-in-out
          h-full
        `}>
          <button
            onClick={() => setShowBets(false)}
            className="lg:hidden absolute top-2 right-2 z-30 text-gray-400 hover:text-white p-1"
          >
            <X size={16} />
          </button>
          <LiveBets bets={allBets} />
        </aside>

        {/* Overlay backdrop */}
        {showBets && (
          <div
            className="fixed inset-0 bg-black/50 z-10 lg:hidden"
            onClick={() => setShowBets(false)}
          />
        )}

        {/* ── Right: Game + Bet Panels ── */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* ── Canvas Area — takes all available space ── */}
          <div className="flex-1 relative min-h-0">
            <AviationCanvas
              phase={state.phase}
              multiplier={state.multiplier}
              countdown={state.countdown}
            />
          </div>

          {/* ── Bet Controls ── */}
          <div className="bg-[#111122] border-t border-white/5 px-2 py-1.5 sm:px-3 sm:py-2 shrink-0">
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 max-w-[900px] mx-auto">
              <BetPanel
                slot={1}
                phase={state.phase}
                multiplier={state.multiplier}
                onPlaceBet={placeBet}
                onCashout={cashout}
                activeBets={state.bets}
                userId={user.id}
                balance={balance}
              />
              <BetPanel
                slot={2}
                phase={state.phase}
                multiplier={state.multiplier}
                onPlaceBet={placeBet}
                onCashout={cashout}
                activeBets={state.bets}
                userId={user.id}
                balance={balance}
              />
            </div>

            {/* Round Number — visible on all screens */}
            <div className="flex items-center justify-between mt-1 px-1 max-w-[900px] mx-auto">
              <span className="text-[10px] text-gray-500">
                Total Bets: <span className="text-gray-400 font-medium">{allBets.length}</span>
              </span>
              <span className="text-[10px] text-gray-500">
                Round <span className="text-gray-300 font-bold">#{state.roundNumber}</span>
              </span>
            </div>
          </div>

          {/* ── Mobile Fake Bets Bar ── */}
          <div className="lg:hidden bg-[#0e0e1a] border-t border-white/5 shrink-0 max-h-[120px] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between px-3 py-1 border-b border-white/5">
              <span className="text-[10px] text-gray-500">
                All Bets <span className="text-white font-bold">{allBets.length}</span>
              </span>
              <span className="text-[10px] text-gray-600">Round #{state.roundNumber}</span>
            </div>
            {allBets.slice(0, 15).map((bet) => {
              const isWon = bet.status === 'WON';
              const displayName = bet.username.length > 8
                ? bet.username.charAt(0) + '***' + bet.username.slice(-2)
                : bet.username;
              return (
                <div
                  key={bet.id}
                  className={`flex items-center justify-between px-3 py-[3px] text-[11px] border-b border-white/[0.03] ${
                    isWon ? 'bg-green-500/[0.06]' : ''
                  }`}
                >
                  <span className="text-gray-400 w-[80px] truncate">{displayName}</span>
                  <span className="text-gray-300 tabular-nums">{bet.amount.toLocaleString()}</span>
                  <span className="w-[70px] text-right">
                    {isWon ? (
                      <span className="text-green-400 tabular-nums">
                        {bet.cashoutAt && (
                          <span className="text-[9px] text-green-500 mr-0.5">{bet.cashoutAt}x</span>
                        )}
                        {(bet.winAmount || 0).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
