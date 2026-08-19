// ============================================
// Live Bets Sidebar — Aviator-style
// ============================================
'use client';

import { useState } from 'react';
import { formatNumber } from '@/lib/utils';

interface LiveBet {
  id: string;
  userId: string;
  username: string;
  amount: number;
  slot: number;
  status: string;
  cashoutAt?: number;
  winAmount?: number;
}

type Tab = 'all' | 'my' | 'top';

export default function LiveBets({ bets }: { bets: LiveBet[] }) {
  const [tab, setTab] = useState<Tab>('all');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All Bets' },
    { id: 'my', label: 'My Bets' },
    { id: 'top', label: 'Top Wins' },
  ];

  const sortedBets = [...bets].sort((a, b) => {
    if (tab === 'top') return (b.winAmount || 0) - (a.winAmount || 0);
    return b.amount - a.amount;
  });

  const totalBets = bets.length;
  const totalAmount = bets.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-white/5 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-[11px] font-semibold uppercase tracking-wider transition-all ${
              tab === t.id
                ? 'text-white border-b-2 border-green-500 bg-white/[0.02]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 shrink-0">
        <span className="text-[10px] text-gray-400">
          Total Bets <span className="text-white font-bold">{totalBets}</span>
        </span>
        <button className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
          ↻ Previous Round
        </button>
      </div>

      {/* Column Header */}
      <div className="grid grid-cols-3 px-3 py-1 text-[9px] text-gray-500 uppercase tracking-wider border-b border-white/5 shrink-0">
        <span>Player</span>
        <span className="text-right">Bet</span>
        <span className="text-right">Win</span>
      </div>

      {/* Bets List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {sortedBets.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-xs">
            Waiting for bets...
          </div>
        ) : (
          sortedBets.map((bet) => {
            const isWin = bet.status === 'WON';
            const isCashedOut = bet.status === 'CASHED_OUT' || isWin;

            return (
              <div
                key={bet.id}
                className={`grid grid-cols-3 px-3 py-1.5 text-xs border-b border-white/[0.03] items-center transition-colors ${
                  isCashedOut
                    ? 'bg-green-500/[0.06]'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                <span className="text-gray-300 truncate text-[11px]">
                  {bet.username.length > 6
                    ? bet.username.charAt(0) + '****' + bet.username.slice(-1)
                    : bet.username}
                </span>
                <span className="text-right text-gray-300 tabular-nums text-[11px]">
                  {formatNumber(bet.amount)}
                </span>
                <span className="text-right">
                  {isCashedOut ? (
                    <span className="text-green-400 tabular-nums text-[11px]">
                      {bet.cashoutAt && (
                        <span className="inline-block bg-green-500/20 text-green-400 text-[9px] font-bold px-1 py-0.5 rounded mr-1">
                          {bet.cashoutAt.toFixed(2)}x
                        </span>
                      )}
                      {formatNumber(bet.winAmount || 0)}
                    </span>
                  ) : (
                    <span className="text-gray-600 text-[11px]">—</span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 px-3 py-1.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-gray-600">SkyBet v1.0</span>
          <span className="text-[9px] text-gray-500">
            Pool: <span className="text-amber-400 font-mono">{formatNumber(totalAmount)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
