// ============================================
// Admin - Payment Requests Management
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Users, Plane, BarChart3, Gamepad2, Settings, Scroll, LogOut,
  Wallet, Loader2, X, CheckCircle2, XCircle, Clock,
  ArrowUpRight, ArrowDownRight, CreditCard, Ban, Send, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stats, setStats] = useState<any>(null);
  // Approve/Reject modals
  const [approveModal, setApproveModal] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [adminTxnId, setAdminTxnId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadRequests();
      loadStats();
    }
  }, [user, page, statusFilter, typeFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminPayments(page, statusFilter || undefined, typeFilter || undefined);
      setRequests(data.requests);
      setTotalPages(data.totalPages);
    } catch {} finally { setLoading(false); }
  };

  const loadStats = async () => {
    try { setStats(await api.getPaymentStats()); } catch {}
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    if (approveModal.type === 'WITHDRAW' && (!adminTxnId || adminTxnId.trim().length < 3)) {
      toast.error('Enter the transaction ID for withdrawal payment');
      return;
    }
    setProcessing(true);
    try {
      await api.approvePayment(approveModal.id, adminTxnId || undefined);
      toast.success('Request approved');
      setApproveModal(null);
      setAdminTxnId('');
      loadRequests();
      loadStats();
    } catch (err: any) { toast.error(err.message); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason || rejectReason.trim().length < 3) {
      toast.error('Enter reason for rejection (min 3 chars)');
      return;
    }
    setProcessing(true);
    try {
      await api.rejectPayment(rejectModal.id, rejectReason);
      toast.success('Request rejected');
      setRejectModal(null);
      setRejectReason('');
      loadRequests();
      loadStats();
    } catch (err: any) { toast.error(err.message); }
    finally { setProcessing(false); }
  };

  if (authLoading || !user) return null;

  const navItems = [
    { href: '/admin', icon: BarChart3, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/payments', icon: CreditCard, label: 'Payments', active: true },
    { href: '/admin/commission', icon: Wallet, label: 'Commission' },
    { href: '/admin/games', icon: Gamepad2, label: 'Game Control' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
    { href: '/admin/logs', icon: Scroll, label: 'Logs' },
  ];

  const statusConfig: Record<string, { color: string; icon: any; bg: string }> = {
    PENDING: { color: 'text-amber-400', icon: Clock, bg: 'bg-amber-400/10' },
    APPROVED: { color: 'text-green-400', icon: CheckCircle2, bg: 'bg-green-400/10' },
    REJECTED: { color: 'text-red-400', icon: XCircle, bg: 'bg-red-400/10' },
  };

  return (
    <AdminLayout activeItem="/admin/payments">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Payment Requests</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="glass rounded-xl p-3 sm:p-4 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={12} className="text-amber-400 shrink-0" />
                <span className="text-[10px] sm:text-xs text-gray-500 truncate">Pending</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-amber-400">{stats.pending}</span>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 size={12} className="text-green-400 shrink-0" />
                <span className="text-[10px] sm:text-xs text-gray-500 truncate">Approved</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-green-400">{stats.todayApproved}</span>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <XCircle size={12} className="text-red-400 shrink-0" />
                <span className="text-[10px] sm:text-xs text-gray-500 truncate">Rejected</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-red-400">{stats.todayRejected}</span>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUpRight size={12} className="text-green-400 shrink-0" />
                <span className="text-[10px] sm:text-xs text-gray-500 truncate">Deposits</span>
              </div>
              <span className="text-base sm:text-xl font-bold text-green-400 truncate block">₹{formatNumber(stats.totalDeposits)}</span>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowDownRight size={12} className="text-orange-400 shrink-0" />
                <span className="text-[10px] sm:text-xs text-gray-500 truncate">Withdrawals</span>
              </div>
              <span className="text-base sm:text-xl font-bold text-orange-400 truncate block">₹{formatNumber(stats.totalWithdrawals)}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">Status:</span>
          {['', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20' : 'bg-sky-surface text-gray-400 border border-sky-border hover:bg-sky-surface-2'}`}>
              {s || 'All'}
            </button>
          ))}
          <span className="text-xs text-gray-500 ml-3">Type:</span>
          {['', 'DEPOSIT', 'WITHDRAW'].map((t) => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${typeFilter === t ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20' : 'bg-sky-surface text-gray-400 border border-sky-border hover:bg-sky-surface-2'}`}>
              {t || 'All'}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="glass rounded-xl overflow-hidden">
          {/* Desktop header — hidden on mobile */}
          <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-2 border-b border-sky-border text-xs text-gray-500 font-medium">
            <span>Player</span><span>Type</span><span className="text-right">Amount</span><span>Txn / UPI</span><span className="text-center">Status</span><span>Date</span><span className="text-right">Actions</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent-cyan" /></div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-600 text-sm">No requests found</div>
          ) : (
            requests.map((r) => {
              const sc = statusConfig[r.status] || statusConfig.PENDING;
              const StatusIcon = sc.icon;
              const isDeposit = r.type === 'DEPOSIT';
              return (
                <div key={r.id} className="border-b border-sky-border/50 hover:bg-sky-surface-2/30 transition-all">
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-3 text-sm items-center">
                    <div>
                      <span className="text-white font-medium text-xs">{r.user?.username}</span>
                      <p className="text-gray-600 text-[10px]">{r.user?.name}</p>
                    </div>
                    <span className={`text-xs flex items-center gap-1 ${isDeposit ? 'text-green-400' : 'text-orange-400'}`}>
                      {isDeposit ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {r.type}
                    </span>
                    <span className={`text-right font-mono font-bold text-xs ${isDeposit ? 'text-green-400' : 'text-orange-400'}`}>
                      ₹{formatNumber(r.amount)}
                    </span>
                    <span className="text-gray-400 text-[11px] font-mono truncate" title={r.playerTxnId || r.upiId || '—'}>
                      {r.playerTxnId || r.upiId || '—'}
                    </span>
                    <span className="text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.color}`}>
                        <StatusIcon size={10} />{r.status}
                      </span>
                    </span>
                    <span className="text-gray-600 text-[10px]">{new Date(r.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center justify-end gap-1">
                      {r.status === 'PENDING' && (
                        <>
                          <button onClick={() => { setApproveModal(r); setAdminTxnId(''); }} className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition-all" title="Approve">
                            <CheckCircle2 size={14} />
                          </button>
                          <button onClick={() => { setRejectModal(r); setRejectReason(''); }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-all" title="Reject">
                            <Ban size={14} />
                          </button>
                        </>
                      )}
                      {r.status !== 'PENDING' && (
                        <span className="text-gray-700 text-[10px]">Processed</span>
                      )}
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div className="md:hidden px-3 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-white font-medium text-sm truncate">{r.user?.username}</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${sc.bg} ${sc.color}`}>
                          <StatusIcon size={8} />{r.status}
                        </span>
                      </div>
                      <span className={`font-mono font-bold text-sm shrink-0 ${isDeposit ? 'text-green-400' : 'text-orange-400'}`}>
                        {isDeposit ? '+' : '-'}₹{formatNumber(r.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-gray-500 min-w-0 truncate">
                        <span className={`mr-1.5 ${isDeposit ? 'text-green-500' : 'text-orange-500'}`}>{r.type}</span>
                        <span className="font-mono">{r.playerTxnId || r.upiId || '—'}</span>
                        <span className="text-gray-700 ml-1.5">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      {r.status === 'PENDING' && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={() => { setApproveModal(r); setAdminTxnId(''); }} className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition-all">
                            <CheckCircle2 size={14} />
                          </button>
                          <button onClick={() => { setRejectModal(r); setRejectReason(''); }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-all">
                            <Ban size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-3">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg bg-sky-surface-2 text-xs disabled:opacity-50">Prev</button>
              <span className="text-xs text-gray-400">{page} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 rounded-lg bg-sky-surface-2 text-xs disabled:opacity-50">Next</button>
            </div>
          )}
        </div>

        {/* ═══ APPROVE MODAL ═══ */}
        {approveModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setApproveModal(null)}>
            <div className="glass-strong rounded-2xl p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-400" />
                  <h2 className="text-lg font-bold">Approve {approveModal.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}</h2>
                </div>
                <button onClick={() => setApproveModal(null)} className="p-1 rounded-lg hover:bg-sky-surface-2 text-gray-400"><X size={18} /></button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="bg-sky-surface-2 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Player</span><span className="text-white">{approveModal.user?.username}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Amount</span><span className="text-green-400 font-bold">₹{formatNumber(approveModal.amount)}</span></div>
                  {approveModal.playerTxnId && <div className="flex justify-between text-xs"><span className="text-gray-500">Player Txn ID</span><span className="text-white font-mono">{approveModal.playerTxnId}</span></div>}
                  {approveModal.upiId && <div className="flex justify-between text-xs"><span className="text-gray-500">UPI ID</span><span className="text-white">{approveModal.upiId}</span></div>}
                </div>

                {approveModal.type === 'WITHDRAW' && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Your Transaction ID (proof of payment)</label>
                    <input
                      value={adminTxnId}
                      onChange={(e) => setAdminTxnId(e.target.value)}
                      placeholder="Enter transaction ID..."
                      className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-green-500/50"
                      autoComplete="off"
                      name="admin-txn-ref"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setApproveModal(null)} className="flex-1 py-2.5 rounded-xl bg-sky-surface-2 text-gray-400 text-sm font-medium">Cancel</button>
                <button onClick={handleApprove} disabled={processing}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                  {processing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ REJECT MODAL ═══ */}
        {rejectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
            <div className="glass-strong rounded-2xl p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Ban size={18} className="text-red-400" />
                  <h2 className="text-lg font-bold">Reject Request</h2>
                </div>
                <button onClick={() => setRejectModal(null)} className="p-1 rounded-lg hover:bg-sky-surface-2 text-gray-400"><X size={18} /></button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="bg-sky-surface-2 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Player</span><span className="text-white">{rejectModal.user?.username}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Type</span><span className="text-white">{rejectModal.type}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Amount</span><span className="text-orange-400 font-bold">₹{formatNumber(rejectModal.amount)}</span></div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Reason for rejection *</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason why you are rejecting this request..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-red-500/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 rounded-xl bg-sky-surface-2 text-gray-400 text-sm font-medium">Cancel</button>
                <button onClick={handleReject} disabled={processing || rejectReason.trim().length < 3}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                  {processing ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />} Reject
                </button>
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}
