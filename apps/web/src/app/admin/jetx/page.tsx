// ============================================
// Admin - JetX Game Control Page
// Force crash points, manage rounds for JetX
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useJetX } from '@/hooks/useJetX';
import { api } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Rocket, Target, Plus, Trash2, Loader2, X, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminJetXControl() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { state } = useJetX();
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
      const data = await api.jetxGetForcedRounds();
      setForcedRounds(data);
    } catch {} finally { setLoading(false); }
  };

  const handleForce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forceForm.crashPoint < 1) { toast.error('Crash point must be at least 1.00'); return; }
    try {
      await api.jetxForceRound(forceForm.roundNumber, forceForm.crashPoint);
      toast.success(`JetX Round ${forceForm.roundNumber} forced to ${forceForm.crashPoint}x`);
      setShowForce(false);
      loadForcedRounds();
    } catch { toast.error('Failed to force round'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.jetxDeleteForcedRound(id);
      toast.success('JetX forced round deleted');
      loadForcedRounds();
    } catch { toast.error('Failed to delete'); }
  };

  if (authLoading || !user) return null;

  const phaseColor: Record<string, string> = {
    WAITING: 'text-gray-400',
    COUNTDOWN: 'text-yellow-400',
    RUNNING: 'text-green-400',
    CRASHED: 'text-red-400',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Rocket className="text-yellow-500" size={22} />
              JetX Game Control
            </h1>
            <p className="text-sm text-gray-400 mt-1">Manage JetX rounds and force crash points</p>
          </div>
          <button
            onClick={() => { setForceForm({ roundNumber: state.roundNumber + 1, crashPoint: 1.5 }); setShowForce(true); }}
            className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all"
          >
            <Plus size={16} /> Force Round
          </button>
        </div>

        {/* Live Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#1a1a2e] rounded-xl p-4 border border-white/5">
            <div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Activity size={12} /> Status</div>
            <div className={`text-lg font-bold ${phaseColor[state.phase] || 'text-white'}`}>{state.phase}</div>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl p-4 border border-white/5">
            <div className="text-gray-500 text-xs mb-1">Round</div>
            <div className="text-lg font-bold text-yellow-400">#{state.roundNumber}</div>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl p-4 border border-white/5">
            <div className="text-gray-500 text-xs mb-1">Multiplier</div>
            <div className={`text-lg font-bold ${state.phase === 'RUNNING' ? 'text-green-400' : 'text-white'}`}>
              {state.multiplier.toFixed(2)}x
            </div>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl p-4 border border-white/5">
            <div className="text-gray-500 text-xs mb-1">Active Bets</div>
            <div className="text-lg font-bold text-white">{state.bets.length}</div>
          </div>
        </div>

        {/* Recent History */}
        <div className="bg-[#1a1a2e] rounded-xl p-4 border border-white/5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent JetX Crashes</h3>
          <div className="flex flex-wrap gap-2">
            {state.history.slice(-20).reverse().map((h, i) => {
              const color = h.crashPoint < 2 ? 'bg-red-500/15 text-red-400' : h.crashPoint < 5 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-green-500/15 text-green-400';
              return (
                <span key={i} className={`${color} px-2 py-1 rounded text-xs font-bold tabular-nums`}>
                  {h.crashPoint.toFixed(2)}x
                </span>
              );
            })}
            {state.history.length === 0 && <span className="text-gray-600 text-xs">No JetX history yet</span>}
          </div>
        </div>

        {/* Forced Rounds */}
        <div className="bg-[#1a1a2e] rounded-xl p-4 border border-white/5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <Target size={14} className="text-yellow-500" />
            Pending JetX Forced Rounds
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="animate-spin text-yellow-500" /></div>
          ) : forcedRounds.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-4">No pending forced rounds for JetX</p>
          ) : (
            <div className="space-y-2">
              {forcedRounds.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-[#0e0e1a] rounded-lg px-4 py-2">
                  <div>
                    <span className="text-white text-sm font-bold">Round #{r.roundNumber}</span>
                    <span className="text-gray-400 text-sm mx-2">→</span>
                    <span className="text-yellow-400 text-sm font-bold">{r.crashPoint}x</span>
                  </div>
                  <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Force Round Modal */}
        {showForce && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-sm p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Force JetX Round</h3>
                <button onClick={() => setShowForce(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
              </div>
              <form onSubmit={handleForce} className="space-y-4">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Round Number</label>
                  <input
                    type="number"
                    value={forceForm.roundNumber}
                    onChange={(e) => setForceForm(f => ({ ...f, roundNumber: Number(e.target.value) }))}
                    className="w-full bg-[#0e0e1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Crash Point (x)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={forceForm.crashPoint}
                    onChange={(e) => setForceForm(f => ({ ...f, crashPoint: Number(e.target.value) }))}
                    className="w-full bg-[#0e0e1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-yellow-500"
                  />
                </div>
                <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 rounded-lg text-sm transition-all">
                  Force Round
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
