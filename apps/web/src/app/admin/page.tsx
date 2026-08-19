// ============================================
// Admin Dashboard Page (Responsive)
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Users, Wallet, TrendingUp, TrendingDown, Percent,
  Shield, BarChart3, Activity, Target, Loader2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      setError('');
      const [s, tx] = await Promise.all([
        api.getAdminDashboard(),
        api.getRecentTransactions(),
      ]);
      setStats(s);
      setRecentTx(tx);
    } catch (err: any) {
      console.error('Dashboard load error', err);
      setError(err.message || 'Failed to load dashboard');
    } finally { setLoading(false); }
  };

  if (authLoading || !user || user.role !== 'ADMIN') return null;

  return (
    <AdminLayout activeItem="/admin">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Dashboard</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent-cyan" />
        </div>
      ) : error ? (
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm mb-2">⚠️ {error}</p>
          <button onClick={loadDashboard} className="text-xs text-accent-cyan hover:underline">Retry</button>
        </div>
      ) : stats ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="cyan" />
            <StatCard icon={Activity} label="Active Users" value={stats.activeUsers} color="green" />
            <StatCard icon={TrendingUp} label="Today's Bets" value={stats.todayBets} sub={`${formatNumber(stats.todayBetAmount)} 🪙`} color="orange" />
            <StatCard icon={Percent} label="Today's Commission" value={`${formatNumber(stats.todayCommission)}`} sub="🪙" color="purple" />
            <StatCard icon={TrendingUp} label="Wins Today" value={stats.todayWins} sub={`${formatNumber(stats.todayWinAmount)} 🪙`} color="green" />
            <StatCard icon={TrendingDown} label="Losses Today" value={stats.todayLosses} color="red" />
            <StatCard icon={Target} label="Current Round" value={`#${stats.currentRound}`} sub={stats.gamePhase} color="cyan" />
            <StatCard icon={Shield} label="Forced Rounds" value={stats.pendingForcedRounds} sub="pending" color="orange" />
          </div>

          {/* Recent Transactions */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-sky-border flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent Transactions</h2>
            </div>
            <div className="divide-y divide-sky-border/50">
              {recentTx.length === 0 ? (
                <div className="py-8 text-center text-gray-600 text-sm">No transactions yet</div>
              ) : recentTx.map((tx) => (
                <div key={tx.id} className="px-3 sm:px-4 py-3 flex items-center justify-between hover:bg-sky-surface-2/30 transition-all min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-surface-2 flex items-center justify-center shrink-0">
                      {Number(tx.amount) > 0 ? <ArrowUpRight size={14} className="text-accent-green" /> : <ArrowDownRight size={14} className="text-accent-red" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.username}</p>
                      <p className="text-xs text-gray-500 truncate">{tx.type.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-sm font-bold font-mono ${Number(tx.amount) > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {Number(tx.amount) > 0 ? '+' : ''}{formatNumber(Number(tx.amount))}
                    </p>
                    <p className="text-[10px] text-gray-500">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-gray-500 text-sm">No dashboard data available</p>
          <button onClick={loadDashboard} className="text-xs text-accent-cyan hover:underline mt-2">Retry</button>
        </div>
      )}
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  const colorMap: Record<string, string> = {
    cyan: 'from-accent-cyan/10 to-accent-cyan/5 border-accent-cyan/20',
    green: 'from-accent-green/10 to-accent-green/5 border-accent-green/20',
    orange: 'from-accent-orange/10 to-accent-orange/5 border-accent-orange/20',
    red: 'from-accent-red/10 to-accent-red/5 border-accent-red/20',
    purple: 'from-accent-purple/10 to-accent-purple/5 border-accent-purple/20',
  };
  const iconColor: Record<string, string> = {
    cyan: 'text-accent-cyan', green: 'text-accent-green', orange: 'text-accent-orange',
    red: 'text-accent-red', purple: 'text-accent-purple',
  };

  return (
    <div className={`rounded-xl p-3 sm:p-4 bg-gradient-to-br border ${colorMap[color]} card-hover overflow-hidden`}>
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <Icon size={16} className={iconColor[color]} />
      </div>
      <p className="text-lg sm:text-2xl font-bold truncate">{value}</p>
      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">{label}</p>
      {sub && <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 truncate">{sub}</p>}
    </div>
  );
}
