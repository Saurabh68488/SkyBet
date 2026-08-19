// ============================================
// Admin Commission Wallet Page
// Shows all commission earnings per round
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Wallet, BarChart3, Users, Settings, Scroll, Gamepad2, CreditCard,
  Shield, LogOut, Loader2, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, Coins, ArrowUpRight, CalendarDays,
  ChevronDown, ChevronUp
} from 'lucide-react';

export default function CommissionWalletPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedRound, setExpandedRound] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') loadData();
  }, [user, page]);

  const loadData = async () => {
    try {
      const [summaryData, historyData] = await Promise.all([
        api.getCommissionSummary(),
        api.getCommissionHistory(page, 15),
      ]);
      setSummary(summaryData);
      setHistory(historyData);
    } catch (err) {
      console.error('Failed to load commission data', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || user.role !== 'ADMIN') return null;

  const navItems = [
    { href: '/admin', icon: BarChart3, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { href: '/admin/commission', icon: Wallet, label: 'Commission', active: true },
    { href: '/admin/games', icon: Gamepad2, label: 'Game Control' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
    { href: '/admin/logs', icon: Scroll, label: 'Logs' },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const summaryCards = summary ? [
    {
      title: 'Today',
      commission: summary.today.commission,
      bets: summary.today.totalBets,
      payouts: summary.today.totalPayouts,
      rounds: summary.today.rounds,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    },
    {
      title: 'This Week',
      commission: summary.thisWeek.commission,
      bets: summary.thisWeek.totalBets,
      payouts: summary.thisWeek.totalPayouts,
      rounds: summary.thisWeek.rounds,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
    {
      title: 'This Month',
      commission: summary.thisMonth.commission,
      bets: summary.thisMonth.totalBets,
      payouts: summary.thisMonth.totalPayouts,
      rounds: summary.thisMonth.rounds,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      title: 'All Time',
      commission: summary.allTime.commission,
      bets: summary.allTime.totalBets,
      payouts: summary.allTime.totalPayouts,
      rounds: summary.allTime.rounds,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  ] : [];

  return (
    <AdminLayout activeItem="/admin/commission">
        <div className="max-w-5xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-500/10 p-2 rounded-lg">
              <Wallet className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Commission Wallet</h1>
              <p className="text-sm text-gray-500">Track your earnings from every game round</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* ── Summary Cards ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {summaryCards.map((card) => (
                  <div
                    key={card.title}
                    className={`${card.bg} border ${card.border} rounded-xl p-3 sm:p-4 overflow-hidden`}
                  >
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{card.title}</span>
                      <CalendarDays className={`w-3.5 h-3.5 ${card.color} shrink-0`} />
                    </div>
                    <div className={`text-base sm:text-lg font-extrabold ${card.color} tabular-nums truncate`}>
                      {formatNumber(card.commission)} 🪙
                    </div>
                    <div className="mt-1.5 sm:mt-2 grid grid-cols-2 gap-x-2 sm:gap-x-3 text-[9px] sm:text-[10px] text-gray-500">
                      <span className="truncate">Bets: {formatNumber(card.bets)}</span>
                      <span className="truncate">Payouts: {formatNumber(card.payouts)}</span>
                      <span className="truncate">Rounds: {card.rounds}</span>
                      <span className="truncate">
                        Profit: {formatNumber(card.bets - card.payouts)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Commission History Table ── */}
              <div className="bg-[#12122a] rounded-xl border border-white/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-white font-semibold text-sm">Commission History (Per Round)</h2>
                  <span className="text-xs text-gray-500">{history?.total || 0} rounds with commission</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-[11px] border-b border-white/5">
                        <th className="text-left px-4 py-2 font-medium">Round</th>
                        <th className="text-left px-4 py-2 font-medium">Crash</th>
                        <th className="text-right px-4 py-2 font-medium">Total Bets</th>
                        <th className="text-right px-4 py-2 font-medium">Total Payouts</th>
                        <th className="text-right px-4 py-2 font-medium">Commission</th>
                        <th className="text-right px-4 py-2 font-medium">Net Profit</th>
                        <th className="text-left px-4 py-2 font-medium">Time</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {history?.rounds?.map((round: any) => {
                        const isExpanded = expandedRound === round.id;
                        const netProfit = round.totalBets - round.totalPayouts;
                        return (
                          <>
                            <tr
                              key={round.id}
                              className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                              onClick={() => setExpandedRound(isExpanded ? null : round.id)}
                            >
                              <td className="px-4 py-2.5 text-white font-medium">#{round.roundNumber}</td>
                              <td className="px-4 py-2.5">
                                <span className={`font-bold tabular-nums ${round.crashPoint < 2 ? 'text-red-400' : round.crashPoint < 5 ? 'text-amber-400' : 'text-green-400'}`}>
                                  {round.crashPoint.toFixed(2)}x
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right text-gray-300 tabular-nums">{formatNumber(round.totalBets)}</td>
                              <td className="px-4 py-2.5 text-right text-gray-300 tabular-nums">{formatNumber(round.totalPayouts)}</td>
                              <td className="px-4 py-2.5 text-right text-amber-400 font-semibold tabular-nums">{formatNumber(round.commission)}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums">
                                <span className={netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  {netProfit >= 0 ? '+' : ''}{formatNumber(netProfit)}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-gray-500 text-xs">{formatDate(round.createdAt)}</td>
                              <td className="px-4 py-2.5 text-gray-500">
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </td>
                            </tr>
                            {/* Expanded bet details */}
                            {isExpanded && round.bets.length > 0 && (
                              <tr key={`${round.id}-details`}>
                                <td colSpan={8} className="bg-[#0e0e1a] px-6 py-3">
                                  <div className="text-[11px] text-gray-500 mb-2 font-medium">
                                    Bets in Round #{round.roundNumber}
                                  </div>
                                  <div className="grid gap-1">
                                    {round.bets.map((bet: any) => (
                                      <div
                                        key={bet.id}
                                        className="flex items-center justify-between py-1 px-2 rounded bg-white/[0.02] text-xs"
                                      >
                                        <span className="text-gray-400 w-24">{bet.username}</span>
                                        <span className="text-gray-300 tabular-nums w-20 text-right">
                                          {formatNumber(bet.amount)}
                                        </span>
                                        <span className={`w-16 text-center font-medium ${bet.status === 'WON' ? 'text-green-400' : 'text-red-400'}`}>
                                          {bet.status}
                                        </span>
                                        <span className="text-gray-500 tabular-nums w-16 text-right">
                                          {bet.cashoutAt ? `${bet.cashoutAt.toFixed(2)}x` : '—'}
                                        </span>
                                        <span className="text-amber-400 tabular-nums w-20 text-right font-medium">
                                          +{formatNumber(bet.commission)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {history && history.totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Page {history.page} of {history.totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded bg-white/5 text-gray-400 text-xs hover:bg-white/10 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        onClick={() => setPage(Math.min(history.totalPages, page + 1))}
                        disabled={page >= history.totalPages}
                        className="px-3 py-1 rounded bg-white/5 text-gray-400 text-xs hover:bg-white/10 disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
    </AdminLayout>
  );
}
