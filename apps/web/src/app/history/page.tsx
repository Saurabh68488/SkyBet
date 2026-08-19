// ============================================
// Bet History Page
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatNumber, formatDate, getCrashBg } from '@/lib/utils';
import { ArrowLeft, Loader2, Trophy, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadBets();
  }, [user, page, filter]);

  const loadBets = async () => {
    setLoading(true);
    try {
      const data = await api.getBetHistory(page, 20, filter || undefined);
      setBets(data.bets);
      setTotalPages(data.totalPages);
    } catch {} finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-sky-bg p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/game" className="p-2 rounded-lg hover:bg-sky-surface-2 text-gray-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Bet History</h1>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {['', 'WON', 'LOST'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30' : 'glass text-gray-300 hover:text-white'
              }`}
            >
              {f || 'All'}
            </button>
          ))}
        </div>

        {/* Bets table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="grid grid-cols-6 gap-2 px-4 py-2 border-b border-sky-border text-xs text-gray-500 font-medium">
            <span>Round</span>
            <span className="text-right">Bet</span>
            <span className="text-right">Crash</span>
            <span className="text-right">Cashout</span>
            <span className="text-right">Win</span>
            <span className="text-right">Status</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-accent-cyan" />
            </div>
          ) : bets.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">No bets found</div>
          ) : (
            bets.map((bet) => (
              <div key={bet.id} className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-sky-border/50 text-sm hover:bg-sky-surface-2/30 transition-all">
                <span className="text-gray-400 text-xs">#{bet.round?.roundNumber || '—'}</span>
                <span className="text-right font-mono">{formatNumber(bet.amount)}</span>
                <span className="text-right">
                  {bet.round?.crashPoint ? (
                    <span className={getCrashBg(bet.round.crashPoint) + ' px-1.5 py-0.5 rounded text-[10px] font-bold'}>
                      {bet.round.crashPoint.toFixed(2)}x
                    </span>
                  ) : '—'}
                </span>
                <span className="text-right font-mono text-xs">
                  {bet.cashoutAt ? `${bet.cashoutAt.toFixed(2)}x` : '—'}
                </span>
                <span className={`text-right font-mono text-xs ${bet.winAmount ? 'text-accent-green' : 'text-gray-500'}`}>
                  {bet.winAmount ? `+${formatNumber(bet.winAmount)}` : '—'}
                </span>
                <span className="text-right">
                  {bet.status === 'WON' ? (
                    <span className="inline-flex items-center gap-0.5 text-accent-green text-xs">
                      <Trophy size={10} /> Won
                    </span>
                  ) : bet.status === 'LOST' ? (
                    <span className="inline-flex items-center gap-0.5 text-accent-red text-xs">
                      <XCircle size={10} /> Lost
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">{bet.status}</span>
                  )}
                </span>
              </div>
            ))
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-3">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg bg-sky-surface-2 text-xs disabled:opacity-50">Prev</button>
              <span className="text-xs text-gray-400">{page} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 rounded-lg bg-sky-surface-2 text-xs disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
