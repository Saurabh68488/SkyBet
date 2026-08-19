// ============================================
// Bet Panel — Compact Aviator-style layout
// Optimized for mobile with minimal padding
// Row 1: [-] amount [+]  |  BET button
// Row 2: 25  100  500  1K
// Row 3: Autoplay  |  Auto Cash Out
// ============================================
'use client';

import { useState } from 'react';
import { Minus, Plus, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface BetPanelProps {
  slot: number;
  phase: string;
  multiplier: number;
  onPlaceBet: (amount: number, slot: number, autoCashout?: number) => void;
  onCashout: (slot: number) => void;
  activeBets: any[];
  userId: string;
  balance: number;
}

export default function BetPanel({
  slot,
  phase,
  multiplier,
  onPlaceBet,
  onCashout,
  activeBets,
  userId,
  balance,
}: BetPanelProps) {
  const [amount, setAmount] = useState(50);
  const [autoCashout, setAutoCashout] = useState<string>('');
  const [showAutoCashout, setShowAutoCashout] = useState(false);
  const [queuedForNext, setQueuedForNext] = useState(false);
  const [queuedAmount, setQueuedAmount] = useState(0);

  const myBet = activeBets.find(
    (b: any) => b.userId === userId && b.betSlot === slot
  );
  const hasBet = !!myBet;
  const isActive = hasBet && myBet?.status === 'ACTIVE';
  const isWon = hasBet && myBet?.status === 'WON';
  const isNextRound = phase === 'RUNNING' || phase === 'CRASHED';
  const canCashout = phase === 'RUNNING' && isActive;

  if (queuedForNext && hasBet && phase === 'COUNTDOWN') {
    setQueuedForNext(false);
    setQueuedAmount(0);
  }
  if (queuedForNext && isActive) {
    setQueuedForNext(false);
    setQueuedAmount(0);
  }

  const canBet = (!hasBet || isWon) && !queuedForNext;
  const liveWinAmount = isActive ? Math.floor(myBet.amount * multiplier * 100) / 100 : 0;
  const quickAmounts = [25, 100, 500, 1000];

  const adjustAmount = (delta: number) => {
    setAmount((prev) => Math.max(10, prev + delta));
  };

  const handleBet = () => {
    if (amount > balance) { toast.error('Insufficient balance'); return; }
    if (amount < 10) { toast.error('Minimum bet is 10'); return; }
    const autoCashoutVal = parseFloat(autoCashout);
    onPlaceBet(amount, slot, autoCashoutVal > 1 ? autoCashoutVal : undefined);
    if (isNextRound) { setQueuedForNext(true); setQueuedAmount(amount); }
  };

  const handleCashout = () => { onCashout(slot); };
  const inputDisabled = (hasBet && !isWon) || queuedForNext;

  // ── BET button content ──
  const renderBetButton = () => {
    if (canCashout) {
      return (
        <button onClick={handleCashout}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg w-[110px] sm:w-[120px] transition-all active:scale-95 shadow-lg shadow-amber-500/20 flex flex-col items-center justify-center py-1">
          <span className="text-[8px] sm:text-[9px] font-semibold uppercase opacity-80">Cash Out</span>
          <span className="text-base sm:text-lg font-extrabold tabular-nums leading-tight">{liveWinAmount.toFixed(2)}</span>
          <span className="text-[8px] font-medium opacity-60">({multiplier.toFixed(2)}x)</span>
        </button>
      );
    }
    if (queuedForNext) {
      return (
        <div className="bg-orange-600/20 border border-orange-500/30 text-orange-300 font-bold rounded-lg w-[110px] sm:w-[120px] flex flex-col items-center justify-center py-1">
          <span className="text-[8px] sm:text-[9px] font-semibold uppercase">Next Round</span>
          <span className="text-xs sm:text-sm font-extrabold tabular-nums">{queuedAmount.toFixed(2)}</span>
          <span className="text-[8px] opacity-60">Bet placed</span>
        </div>
      );
    }
    if (isWon && isNextRound && canBet) {
      return (
        <button onClick={handleBet}
          className="rounded-lg w-[110px] sm:w-[120px] font-bold transition-all active:scale-95 flex flex-col items-center justify-center bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20 py-1">
          <span className="text-[8px] sm:text-[9px] font-semibold uppercase opacity-80">Bet Next</span>
          <span className="text-base sm:text-lg font-extrabold tabular-nums leading-tight">{amount.toFixed(2)}</span>
        </button>
      );
    }
    if (isWon) {
      return (
        <div className="bg-green-600/20 border border-green-500/30 text-green-300 font-bold rounded-lg w-[110px] sm:w-[120px] flex flex-col items-center justify-center py-1">
          <span className="text-[8px] sm:text-[9px] font-semibold uppercase">Won!</span>
          <span className="text-xs sm:text-sm font-extrabold tabular-nums">{(myBet.winAmount || 0).toFixed(2)}</span>
          <span className="text-[8px] opacity-60">{(myBet.cashoutAt || 0).toFixed(2)}x</span>
        </div>
      );
    }
    if (hasBet && myBet?.status === 'PENDING') {
      return (
        <div className="bg-[#2a2a3d] text-gray-400 font-bold rounded-lg w-[110px] sm:w-[120px] flex flex-col items-center justify-center py-1">
          <span className="text-[8px] sm:text-[9px] font-semibold uppercase">Waiting</span>
          <span className="text-xs sm:text-sm font-extrabold tabular-nums">{myBet.amount.toFixed(2)}</span>
        </div>
      );
    }
    return (
      <button onClick={handleBet} disabled={!canBet}
        className={`rounded-lg w-[110px] sm:w-[120px] font-bold transition-all active:scale-95 flex flex-col items-center justify-center py-1 ${
          canBet && isNextRound
            ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20'
            : canBet
              ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20'
              : 'bg-[#2a2a3d] text-gray-500 cursor-default'
        }`}>
        <span className="text-[8px] sm:text-[9px] font-semibold uppercase opacity-80">{isNextRound ? 'Bet Next' : 'Bet'}</span>
        <span className="text-base sm:text-lg font-extrabold tabular-nums leading-tight">{amount.toFixed(2)}</span>
      </button>
    );
  };

  return (
    <div className="flex-1 bg-[#1a1a2d] rounded-lg border border-[#2a2a3d] overflow-hidden">
      {/* ── Row 1: Amount + BET/CASHOUT ── */}
      <div className="p-1.5 sm:p-2 flex items-stretch gap-1.5 sm:gap-2">
        {/* Amount controls */}
        <div className="flex items-center bg-[#0e0e1a] rounded-lg border border-[#2a2a3d] flex-1 min-w-0">
          <button onClick={() => adjustAmount(-10)} disabled={inputDisabled}
            className="px-2.5 sm:px-3 py-2.5 sm:py-3 text-gray-400 hover:text-white disabled:opacity-30 transition-colors border-r border-[#2a2a3d]">
            <Minus size={12} />
          </button>
          <input type="number" value={amount}
            onChange={(e) => setAmount(Math.max(10, Number(e.target.value)))}
            disabled={inputDisabled}
            className="w-full bg-transparent text-center text-xs sm:text-sm font-bold text-white tabular-nums outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button onClick={() => adjustAmount(10)} disabled={inputDisabled}
            className="px-2.5 sm:px-3 py-2.5 sm:py-3 text-gray-400 hover:text-white disabled:opacity-30 transition-colors border-l border-[#2a2a3d]">
            <Plus size={12} />
          </button>
        </div>

        {renderBetButton()}
      </div>

      {/* ── Row 2: Quick Amounts ── */}
      <div className="px-1.5 sm:px-2 flex gap-1">
        {quickAmounts.map((qa) => (
          <button key={qa} onClick={() => setAmount(qa)} disabled={inputDisabled}
            className={`flex-1 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-semibold transition-all disabled:opacity-30 ${
              amount === qa ? 'bg-[#2a2a3d] text-white' : 'bg-[#141422] text-gray-500 hover:text-gray-300 hover:bg-[#1e1e2d]'
            }`}>
            {qa >= 1000 ? `${qa / 1000}K` : qa}
          </button>
        ))}
      </div>

      {/* ── Row 3: Autoplay + Auto Cash Out ── */}
      <div className="p-1.5 sm:p-2 pt-1 flex gap-1">
        <button
          className="flex-1 flex items-center justify-center gap-1 bg-[#141422] hover:bg-[#1e1e2d] text-gray-400 hover:text-gray-200 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium transition-colors border border-[#2a2a3d]"
          onClick={() => { toast('Autoplay coming soon', { icon: '🔄' }); }}
        >
          <RotateCw size={10} />
          Autoplay
        </button>
        <button
          onClick={() => setShowAutoCashout(!showAutoCashout)}
          className={`flex-1 flex items-center justify-center gap-1 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium transition-colors border ${
            showAutoCashout || autoCashout
              ? 'bg-cyan-900/20 text-cyan-400 border-cyan-500/30'
              : 'bg-[#141422] hover:bg-[#1e1e2d] text-gray-400 hover:text-gray-200 border-[#2a2a3d]'
          }`}
        >
          Auto Cash Out {autoCashout ? `(${autoCashout}x)` : ''}
        </button>
      </div>

      {/* ── Auto Cashout Input (expandable) ── */}
      {showAutoCashout && (
        <div className="px-1.5 sm:px-2 pb-1.5 sm:pb-2">
          <div className="flex items-center gap-2 bg-[#141422] rounded-lg border border-[#2a2a3d] px-2 py-1">
            <span className="text-[9px] text-gray-500 whitespace-nowrap">Cash out at</span>
            <input type="number" step="0.1" min="1.1" placeholder="2.00"
              value={autoCashout} onChange={(e) => setAutoCashout(e.target.value)}
              disabled={hasBet}
              className="flex-1 bg-transparent text-xs text-center text-white tabular-nums outline-none disabled:opacity-40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-[9px] text-gray-500">x</span>
            {autoCashout && (
              <button onClick={() => setAutoCashout('')} className="text-red-400 hover:text-red-300 text-xs">✕</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
