// ============================================
// JetX Bet Panel — Yellow/Gold themed
// Allows queuing next-round bet after cashout
// ============================================
'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

interface JetXBetPanelProps {
  slot: number;
  phase: string;
  multiplier: number;
  onPlaceBet: (amount: number, slot: number, autoCashout?: number) => void;
  onCashout: (slot: number) => void;
  activeBets: any[];
  userId: string;
  balance: number;
}

export default function JetXBetPanel({ slot, phase, multiplier, onPlaceBet, onCashout, activeBets, userId, balance }: JetXBetPanelProps) {
  const [amount, setAmount] = useState(1);
  const [autoBet, setAutoBet] = useState(false);
  const [autoCollect, setAutoCollect] = useState(false);
  const [autoCollectAt, setAutoCollectAt] = useState(2.0);
  const [queuedForNext, setQueuedForNext] = useState(false);
  const prevPhaseRef = useRef(phase);

  const myBet = activeBets.find(b => b.userId === userId && b.betSlot === slot);
  const isActive = myBet && myBet.status === 'ACTIVE';
  const isWon = myBet && (myBet.status === 'WON' || myBet.status === 'CASHED_OUT');
  const isLost = myBet && myBet.status === 'LOST';
  const isPending = myBet && myBet.status === 'PENDING';

  useEffect(() => {
    if (phase === 'COUNTDOWN' && prevPhaseRef.current === 'CRASHED') {
      // New round starting — reset states
      setQueuedForNext(false);
      if (autoBet) {
        onPlaceBet(amount, slot, autoCollect ? autoCollectAt : undefined);
        setQueuedForNext(false);
      }
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  const handleBet = () => {
    if (amount < 1) return toast.error('Min bet is 1');
    if (amount > balance) return toast.error('Insufficient balance');
    onPlaceBet(amount, slot, autoCollect ? autoCollectAt : undefined);
    // If game is running/crashed and we just cashed out, this queues for next round
    if (phase === 'RUNNING' || phase === 'CRASHED') {
      setQueuedForNext(true);
    }
  };

  const handleCashout = () => {
    onCashout(slot);
  };

  const quickAmounts = [200, 1000, 50000];
  const currentWin = isActive ? Math.floor(myBet.amount * multiplier * 100) / 100 : 0;

  // Can bet if: no active/pending bet, OR bet is already won/lost (can queue next)
  const hasBetInPlay = myBet && (myBet.status === 'ACTIVE' || myBet.status === 'PENDING');
  const canBet = !hasBetInPlay && !queuedForNext;
  const canCashout = phase === 'RUNNING' && isActive;
  // Show "bet for next round" label when game is running/crashed and user already cashed out
  const isNextRound = (phase === 'RUNNING' || phase === 'CRASHED') && (isWon || isLost || !myBet);

  return (
    <div className="bg-[#1a1a2e] rounded-xl border border-white/5 p-2.5 sm:p-3 flex-1">
      {/* Top row: Auto bet + Amount */}
      <div className="flex items-center gap-2 mb-2">
        <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
          <div className={`w-8 h-4 rounded-full transition-colors relative ${autoBet ? 'bg-yellow-500' : 'bg-gray-700'}`}
            onClick={() => setAutoBet(!autoBet)}>
            <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${autoBet ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-[10px] text-gray-400 uppercase">Auto Bet</span>
        </label>

        <div className="flex items-center bg-[#0e0e1a] rounded-lg flex-1">
          <button onClick={() => setAmount(Math.max(1, amount - 10))} className="text-gray-400 hover:text-white px-2 py-1 text-lg">−</button>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
            className="bg-transparent text-white text-center text-sm font-bold w-full py-1 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button onClick={() => setAmount(amount + 10)} className="text-gray-400 hover:text-white px-2 py-1 text-lg">+</button>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-1 mb-2">
        {quickAmounts.map(v => (
          <button key={v} onClick={() => setAmount(v)}
            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] py-0.5 rounded transition-colors">
            {v >= 1000 ? `${v / 1000}K` : v}
          </button>
        ))}
        <button onClick={() => setAmount(Math.floor(balance))}
          className="flex-1 bg-white/5 hover:bg-white/10 text-yellow-400 text-[10px] py-0.5 rounded transition-colors font-bold">
          ALL
        </button>
      </div>

      {/* Auto collect */}
      <div className="flex items-center gap-2 mb-2">
        <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
          <div className={`w-8 h-4 rounded-full transition-colors relative ${autoCollect ? 'bg-yellow-500' : 'bg-gray-700'}`}
            onClick={() => setAutoCollect(!autoCollect)}>
            <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${autoCollect ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-[10px] text-gray-400 uppercase">Auto Collect</span>
        </label>
        <div className="flex items-center bg-[#0e0e1a] rounded-lg flex-1">
          <button onClick={() => setAutoCollectAt(Math.max(1.1, autoCollectAt - 0.5))} className="text-gray-400 hover:text-white px-2 py-0.5 text-sm">−</button>
          <input
            type="number"
            step="0.1"
            value={autoCollectAt}
            onChange={(e) => setAutoCollectAt(Math.max(1.1, Number(e.target.value)))}
            className="bg-transparent text-white text-center text-xs font-bold w-full py-0.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-gray-500 text-xs pr-2">x</span>
        </div>
      </div>

      {/* BET / CASHOUT button */}
      {canCashout ? (
        <button
          onClick={handleCashout}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-95 animate-pulse"
        >
          <div className="text-[10px] opacity-80">COLLECT</div>
          <div className="text-lg font-black">{currentWin.toFixed(2)} INR</div>
        </button>
      ) : queuedForNext ? (
        <button disabled className="w-full bg-yellow-900/30 border border-yellow-500/20 text-yellow-400 font-bold py-3 rounded-xl text-sm">
          <div className="text-[10px]">QUEUED FOR NEXT ROUND</div>
          <div className="text-lg font-black">{amount.toFixed(2)} INR</div>
        </button>
      ) : (
        <button
          onClick={handleBet}
          disabled={!canBet}
          className={`w-full font-bold py-3 rounded-xl text-sm transition-all active:scale-95 ${
            canBet && isNextRound
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black'
              : canBet
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black'
                : hasBetInPlay
                  ? 'bg-orange-900/30 border border-orange-500/20 text-orange-400 cursor-wait'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {hasBetInPlay ? (
            <>
              <div className="text-[10px] opacity-80">WAITING</div>
              <div className="text-lg font-black">{myBet.amount.toFixed(2)} INR</div>
            </>
          ) : isWon && canBet ? (
            <>
              <div className="text-lg font-black">{amount.toFixed(2)} INR</div>
              <div className="text-[10px] opacity-80">BET NEXT ROUND</div>
            </>
          ) : (
            <>
              <div className="text-lg font-black">{amount.toFixed(2)} INR</div>
              <div className="text-[10px] opacity-80">{isNextRound ? 'BET NEXT ROUND' : 'BET'}</div>
            </>
          )}
        </button>
      )}

      {/* Win info after cashout */}
      {isWon && !queuedForNext && (
        <div className="mt-1 text-center bg-green-900/20 rounded-lg py-1 border border-green-500/10">
          <span className="text-green-400 text-[10px] font-bold">
            WON {myBet.cashoutAt?.toFixed(2)}x → {(myBet.winAmount || 0).toFixed(2)} INR
          </span>
        </div>
      )}
    </div>
  );
}
