// ============================================
// Game History — Horizontal scrolling crash bubbles
// ============================================
'use client';

import { getCrashBg } from '@/lib/utils';

interface HistoryItem {
  roundNumber: number;
  crashPoint: number;
}

export default function GameHistory({ history }: { history: HistoryItem[] }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
      {[...history].reverse().map((h) => {
        const cp = h.crashPoint;
        let colorClass = 'text-purple-400';
        let bgClass = 'bg-purple-500/15';
        if (cp >= 10) {
          colorClass = 'text-violet-300';
          bgClass = 'bg-violet-500/20';
        } else if (cp >= 2) {
          colorClass = 'text-green-400';
          bgClass = 'bg-green-500/15';
        } else {
          colorClass = 'text-blue-400';
          bgClass = 'bg-blue-500/10';
        }

        return (
          <span
            key={h.roundNumber}
            className={`${bgClass} ${colorClass} px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tabular-nums whitespace-nowrap shrink-0 cursor-default hover:brightness-125 transition-all`}
            title={`Round #${h.roundNumber}`}
          >
            {cp.toFixed(2)}x
          </span>
        );
      })}
    </div>
  );
}
