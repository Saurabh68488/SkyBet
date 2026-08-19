// ============================================
// JetX History — Vertical left sidebar
// Colored multiplier badges (green/yellow/red)
// ============================================
'use client';

interface JetXHistoryProps {
  history: Array<{ roundNumber: number; crashPoint: number; createdAt: string }>;
}

export default function JetXHistory({ history }: JetXHistoryProps) {
  const reversed = [...history].reverse();

  const getColor = (cp: number) => {
    if (cp < 1.5) return 'text-red-400';
    if (cp < 2) return 'text-orange-400';
    if (cp < 3) return 'text-yellow-400';
    if (cp < 5) return 'text-green-400';
    return 'text-cyan-400';
  };

  const getBg = (cp: number) => {
    if (cp < 1.5) return 'bg-red-500/10';
    if (cp < 2) return 'bg-orange-500/10';
    if (cp < 3) return 'bg-yellow-500/10';
    if (cp < 5) return 'bg-green-500/10';
    return 'bg-cyan-500/10';
  };

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto scrollbar-hide">
      {reversed.map((h, i) => (
        <div
          key={`${h.roundNumber}-${i}`}
          className={`${getBg(h.crashPoint)} rounded px-2 py-1 text-center`}
        >
          <span className={`${getColor(h.crashPoint)} text-xs font-bold tabular-nums`}>
            {h.crashPoint.toFixed(2)}x
          </span>
        </div>
      ))}
      {reversed.length === 0 && (
        <div className="text-gray-600 text-[10px] text-center py-4">No history</div>
      )}
    </div>
  );
}
