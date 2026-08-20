// ============================================
// JetX Live Bets — Right sidebar
// Different tab style and layout from Aviation
// ============================================
'use client';

import { useState } from 'react';

interface JetXBet {
  id: string;
  userId: string;
  username: string;
  amount: number;
  betSlot: number;
  status: string;
  cashoutAt?: number;
  winAmount?: number;
}

type Tab = 'stakes' | 'my' | 'stats';

export default function JetXLiveBets({ bets }: { bets: JetXBet[] }) {
  const [tab, setTab] = useState<Tab>('stakes');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'stakes', label: 'Current Stakes' },
    { id: 'my', label: 'My Bets' },
    { id: 'stats', label: 'Statistics' },
  ];

  const sorted = [...bets].sort((a, b) => b.amount - a.amount);

  return (
    <div className="flex flex-col h-full bg-[#12122a]">
      {/* Tabs */}
      <div className="flex border-b border-yellow-500/10 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-[10px] font-semibold tracking-wider transition-all ${
              tab === t.id
                ? 'text-yellow-400 border-b-2 border-yellow-500 bg-yellow-500/[0.04]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-4 px-3 py-1.5 text-[9px] text-gray-500 uppercase tracking-wider border-b border-white/5 shrink-0">
        <span>User</span>
        <span className="text-right">Bet</span>
        <span className="text-right">Collect</span>
        <span className="text-right">Win</span>
      </div>

      {/* Bets List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {sorted.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-xs">Waiting for bets...</div>
        ) : (
          sorted.map((bet) => {
            const isWon = bet.status === 'WON' || bet.status === 'CASHED_OUT';
            const displayName = bet.username.length > 6
              ? bet.username.charAt(0) + '****' + bet.username.slice(-1)
              : bet.username;

            return (
              <div
                key={bet.id}
                className={`grid grid-cols-4 px-3 py-1.5 text-[11px] border-b border-white/[0.03] items-center ${
                  isWon ? 'bg-green-500/[0.05]' : ''
                }`}
              >
                <span className="text-gray-400 truncate">{displayName}</span>
                <span className="text-right text-gray-300 tabular-nums">
                  ₹{bet.amount.toLocaleString()}
                </span>
                <span className="text-right text-gray-500 tabular-nums">
                  {isWon && bet.cashoutAt ? `${bet.cashoutAt.toFixed(2)}x` : '—'}
                </span>
                <span className="text-right tabular-nums">
                  {isWon ? (
                    <span className="text-green-400">{(bet.winAmount || 0).toLocaleString()}</span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
