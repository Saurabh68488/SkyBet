// ============================================
// Admin - Game Control Page
// Force crash points, manage rounds
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/hooks/useGame';
import { api } from '@/lib/api';
import { formatNumber, getCrashBg } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Plane, Users, BarChart3, Gamepad2, Settings, Scroll, LogOut, Wallet, CreditCard,
  Target, Plus, Trash2, Loader2, X, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminGameControl() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { state } = useGame();
  const [forcedRounds, setForcedRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [forceForm, setForceForm] = useState({ roundNumber: 0, crashPoint: 1.5 });
  const [showForce, setShowForce] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') loadForcedRounds();
  }, [user]);

  const loadForcedRounds = async () => {
    try {
      const data = await api.getForcedRounds();
      setForcedRounds(data);
    } catch {} finally { setLoading(false); }
  };

  const handleForce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forceForm.crashPoint < 1) { toast.error('Crash point must be at least 1.00'); return; }
    try {
      await api.forceRound(forceForm.roundNumber, forceForm.crashPoint);
      toast.success(`Round ${forceForm.roundNumber} forced to ${forceForm.crashPoint}x`);
      setShowForce(false);
      loadForcedRounds();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteForcedRound(id);
      toast.success('Forced round cancelled');
      loadForcedRounds();
    } catch (err: any) { toast.error(err.message); }
  };

  if (authLoading || !user) return null;

  return (
    <AdminLayout activeItem="/admin/games">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">Game Control</h1>
          <button onClick={() => { setForceForm({ roundNumber: state.roundNumber + 1, crashPoint: 1.5 }); setShowForce(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-red/10 text-accent-red border border-accent-red/20 text-sm font-medium hover:bg-accent-red/20 transition-all">
            <Target size={16} /> Force Next Round
          </button>
        </div>

        {/* Live Game Status */}
        <div className="glass rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-accent-green" />
            <span className="text-sm font-semibold">Live Game Status</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400">Round</p>
              <p className="text-lg font-bold">#{state.roundNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Phase</p>
              <p className={`text-lg font-bold ${state.phase === 'RUNNING' ? 'text-accent-green' : state.phase === 'COUNTDOWN' ? 'text-accent-orange' : 'text-accent-red'}`}>{state.phase}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Multiplier</p>
              <p className="text-lg font-bold text-accent-cyan">{state.multiplier.toFixed(2)}x</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Active Bets</p>
              <p className="text-lg font-bold">{state.bets.length}</p>
            </div>
          </div>
        </div>

        {/* Recent History */}
        <div className="glass rounded-xl p-4 mb-6">
          <h2 className="text-sm font-semibold mb-3">Recent Crash History</h2>
          <div className="flex flex-wrap gap-2">
            {state.history.map((h) => (
              <div key={h.roundNumber} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getCrashBg(h.crashPoint)}`}>
                #{h.roundNumber}: {h.crashPoint.toFixed(2)}x
              </div>
            ))}
          </div>
        </div>

        {/* Forced Rounds */}
        <div className="glass rounded-xl">
          <div className="px-4 py-3 border-b border-sky-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Scheduled Forced Rounds</h2>
            <span className="text-xs text-gray-400">{forcedRounds.length} pending</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent-cyan" /></div>
          ) : forcedRounds.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No forced rounds scheduled</div>
          ) : (
            forcedRounds.map((fr) => (
              <div key={fr.id} className="px-4 py-3 border-b border-sky-border/50 flex items-center justify-between hover:bg-sky-surface-2/30 transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono font-bold">Round #{fr.roundNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getCrashBg(Number(fr.crashPoint))}`}>
                    {Number(fr.crashPoint).toFixed(2)}x
                  </span>
                </div>
                <button onClick={() => handleDelete(fr.id)} className="p-1.5 rounded-lg text-accent-red hover:bg-accent-red/10 transition-all"><Trash2 size={14} /></button>
              </div>
            ))
          )}
        </div>

        {/* Force Round Modal */}
        {showForce && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForce(false)}>
            <div className="glass-strong rounded-2xl p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Force Crash Point</h2>
                <button onClick={() => setShowForce(false)} className="p-1 rounded-lg hover:bg-sky-surface-2 text-gray-400"><X size={18} /></button>
              </div>
              <form onSubmit={handleForce} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Round Number</label>
                  <input type="number" value={forceForm.roundNumber} onChange={(e) => setForceForm({ ...forceForm, roundNumber: Number(e.target.value) })} required
                    className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Crash Point</label>
                  <input type="number" step="0.01" min="1" value={forceForm.crashPoint} onChange={(e) => setForceForm({ ...forceForm, crashPoint: Number(e.target.value) })} required
                    className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50" />
                  <div className="flex gap-1 mt-2">
                    {[1.15, 1.45, 2.02, 5.38, 10, 20].map((cp) => (
                      <button key={cp} type="button" onClick={() => setForceForm({ ...forceForm, crashPoint: cp })}
                        className={`px-2 py-1 rounded-lg text-xs font-mono ${getCrashBg(cp)}`}>{cp}x</button>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-red to-red-700 text-white font-semibold text-sm hover:opacity-90 transition-all">
                  Force Round #{forceForm.roundNumber} → {forceForm.crashPoint}x
                </button>
              </form>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}
