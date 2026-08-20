// ============================================
// JetX Game Page — Purple/Gold themed aviation game
// Completely different design from /game (Aviator)
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useJetX } from '@/hooks/useJetX';
import { useAuth } from '@/hooks/useAuth';
import { useGameGuard } from '@/hooks/useGameGuard';
import JetXCanvas from '@/components/jetx/JetXCanvas';
import JetXBetPanel from '@/components/jetx/JetXBetPanel';
import JetXLiveBets from '@/components/jetx/JetXLiveBets';
import JetXHistory from '@/components/jetx/JetXHistory';
import { Rocket, Wallet, ArrowLeft, Users as UsersIcon, X } from 'lucide-react';
import Link from 'next/link';

export default function JetXPage() {
  const router = useRouter();
  const { user, loading, balance, logout } = useAuth();
  const { allowed, loading: guardLoading } = useGameGuard('JETX');
  const { state, placeBet, cashout } = useJetX();
  const [showBets, setShowBets] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#0f0f23] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Rocket className="w-8 h-8 text-yellow-500 animate-pulse" />
          <span className="text-sm text-gray-400">Loading JetX...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-[100dvh] bg-[#0f0f23] flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header className="bg-[#1a1a2e]/95 border-b border-yellow-500/10 flex items-center justify-between px-3 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors p-1">
            <ArrowLeft size={18} />
          </Link>
          <Link href="/jetx" className="flex items-center gap-1.5">
            <span className="text-yellow-400 font-black text-lg italic tracking-tighter">Jet</span>
            <span className="text-white font-black text-lg italic tracking-tighter">X</span>
          </Link>
        </div>

        {/* Username */}
        <div className="hidden sm:flex items-center gap-1.5 text-gray-400 text-xs">
          <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span className="text-yellow-400 text-[10px] font-bold">{user.username?.charAt(0)?.toUpperCase()}</span>
          </div>
          <span>{user.username}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#1e293b] rounded-full px-2.5 py-1 border border-yellow-500/10">
            <span className="text-yellow-400 font-bold text-sm">₹</span>
            <span className="text-[11px] font-bold text-yellow-400 tabular-nums">{balance.toFixed(2)}</span>
          </div>
          <Link href="/wallet" className="text-gray-400 hover:text-white transition-colors" title="Wallet">
            <Wallet size={15} />
          </Link>
          <button onClick={() => setShowBets(!showBets)} className="lg:hidden text-gray-400 hover:text-white transition-colors">
            <UsersIcon size={15} />
          </button>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 min-h-0 relative">

        {/* Left: History sidebar */}
        <aside className="hidden md:flex w-[55px] bg-[#12122a] border-r border-white/5 p-1 flex-col shrink-0 overflow-y-auto scrollbar-hide">
          <JetXHistory history={state.history} />
        </aside>

        {/* Center: Canvas + Bet Panels */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Canvas */}
          <div className="flex-1 relative min-h-[45vh] sm:min-h-0 border border-white/5 rounded-sm m-1 overflow-hidden">
            {/* Prize fund banner (decoration) */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-[#1a1a2e]/90 rounded-lg px-2.5 py-1 border border-yellow-500/20">
              <span className="text-[8px] text-yellow-500 font-bold uppercase">Prize Pool</span>
              <span className="text-[11px] text-white font-bold">₹{(state.bets.reduce((s, b) => s + b.amount, 0)).toLocaleString()}</span>
            </div>

            {/* Round info */}
            <div className="absolute top-2 right-2 z-10 bg-[#1a1a2e]/80 rounded px-2 py-0.5">
              <span className="text-[9px] text-gray-500">Round <span className="text-gray-300 font-bold">#{state.roundNumber}</span></span>
            </div>

            {/* Mobile history bar */}
            <div className="md:hidden absolute bottom-2 left-2 right-2 z-10 flex gap-1 overflow-x-auto scrollbar-hide">
              {[...state.history].reverse().slice(0, 10).map((h, i) => {
                const color = h.crashPoint < 2 ? 'text-red-400 bg-red-500/15' : h.crashPoint < 5 ? 'text-yellow-400 bg-yellow-500/15' : 'text-green-400 bg-green-500/15';
                return (
                  <span key={i} className={`${color} text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 tabular-nums`}>
                    {h.crashPoint.toFixed(2)}x
                  </span>
                );
              })}
            </div>

            <JetXCanvas phase={state.phase} multiplier={state.multiplier} countdown={state.countdown} />
          </div>

          {/* Bet Panels */}
          <div className="bg-[#12122a] border-t border-white/5 px-2 py-1.5 sm:px-3 sm:py-2 shrink-0">
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 max-w-[900px] mx-auto">
              <JetXBetPanel slot={1} phase={state.phase} multiplier={state.multiplier} onPlaceBet={placeBet} onCashout={cashout} activeBets={state.bets} userId={user.id} balance={balance} />
              <JetXBetPanel slot={2} phase={state.phase} multiplier={state.multiplier} onPlaceBet={placeBet} onCashout={cashout} activeBets={state.bets} userId={user.id} balance={balance} />
            </div>
          </div>

          {/* Mobile Bets Bar */}
          <div className="lg:hidden bg-[#0f0f23] border-t border-white/5 shrink-0 max-h-[110px] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between px-3 py-1 border-b border-white/5">
              <span className="text-[10px] text-gray-500">All Bets <span className="text-white font-bold">{state.bets.length}</span></span>
              <span className="text-[10px] text-gray-600">Round #{state.roundNumber}</span>
            </div>
            {state.bets.slice(0, 12).map((bet) => {
              const isWon = bet.status === 'WON';
              const name = bet.username.length > 8 ? bet.username.charAt(0) + '***' + bet.username.slice(-2) : bet.username;
              return (
                <div key={bet.id} className={`flex items-center justify-between px-3 py-[3px] text-[11px] border-b border-white/[0.03] ${isWon ? 'bg-green-500/[0.05]' : ''}`}>
                  <span className="text-gray-400 w-[70px] truncate">{name}</span>
                  <span className="text-gray-300 tabular-nums">₹{bet.amount.toLocaleString()}</span>
                  <span className="w-[70px] text-right">
                    {isWon ? (
                      <span className="text-green-400 tabular-nums">{(bet.winAmount || 0).toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </main>

        {/* Right: Live Bets sidebar */}
        <aside className={`
          ${showBets ? 'translate-x-0' : 'translate-x-full'}
          lg:translate-x-0
          absolute lg:relative right-0 z-20
          w-[260px] bg-[#12122a] border-l border-white/5 flex flex-col shrink-0
          transition-transform duration-300 ease-in-out h-full
        `}>
          <button onClick={() => setShowBets(false)} className="lg:hidden absolute top-2 left-2 z-30 text-gray-400 hover:text-white p-1">
            <X size={16} />
          </button>
          <JetXLiveBets bets={state.bets} />
        </aside>

        {showBets && <div className="fixed inset-0 bg-black/50 z-10 lg:hidden" onClick={() => setShowBets(false)} />}
      </div>
    </div>
  );
}
