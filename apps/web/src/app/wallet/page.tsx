// ============================================
// Player Wallet Page — Add Money, Withdraw, History
// Premium payment interface with rules & tracking
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Plane, ArrowLeft, Loader2, Coins, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, XCircle, Filter, Plus, ArrowDownToLine, X,
  AlertTriangle, ShieldCheck, Info, Wallet, History, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const DEPOSIT_RULES = [
  'Ensure the payment amount matches exactly with the amount entered below. Any mismatch may lead to rejection of your request.',
  'Always use your own registered bank account or UPI for payments. Third-party transactions are not accepted and will be declined.',
  'Enter the correct Transaction ID after payment. If the transaction ID is invalid, fake, or does not match, the deposit will be rejected and no refund will be issued.',
  'Once submitted, the deposit request cannot be modified or cancelled. Please verify all details before submitting.',
  'The platform is not responsible for any loss arising from incorrect payment details, duplicate payments, or unauthorized transactions. All deposits are subject to manual verification.',
];

const WITHDRAW_RULES = [
  'Minimum withdrawal amount is ₹100. Ensure you have sufficient balance in your account before requesting a withdrawal.',
  'Enter a valid and active UPI ID linked to your own bank account. Payments to third-party or incorrect UPI IDs are non-recoverable.',
  'Withdrawal requests are processed within 48 hours. Processing times may vary depending on verification and banking hours.',
  'The platform reserves the right to reject a withdrawal request if any suspicious activity, bonus abuse, or rule violations are detected on the account.',
  'Once a withdrawal is approved and the payment is sent, the platform is not responsible for any delays caused by your bank, UPI provider, or network issues.',
];

export default function WalletPage() {
  const router = useRouter();
  const { user, loading: authLoading, balance, logout } = useAuth();
  // Tab state
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  // Deposit
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxnId, setDepositTxnId] = useState('');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [showDepositRules, setShowDepositRules] = useState(true);
  // Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawUpi, setWithdrawUpi] = useState('');
  const [showWithdrawRules, setShowWithdrawRules] = useState(true);
  // History
  const [requests, setRequests] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [historyFilter, setHistoryFilter] = useState('');
  // Common
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadQrCode();
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'history') loadHistory();
  }, [user, activeTab, page, historyFilter]);

  const loadQrCode = async () => {
    setQrLoading(true);
    try {
      const data = await api.getQrCode();
      setQrCodeData(data.qrCodeData);
    } catch {} finally { setQrLoading(false); }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getMyPayments(page, historyFilter || undefined);
      setRequests(data.requests);
      setTotalPages(data.totalPages);
    } catch {} finally { setHistoryLoading(false); }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!amount || amount < 1) { toast.error('Minimum deposit is ₹1'); return; }
    if (!depositTxnId.trim() || depositTxnId.trim().length < 3) { toast.error('Enter a valid transaction ID'); return; }
    setSubmitting(true);
    try {
      const result = await api.createDeposit(amount, depositTxnId.trim());
      toast.success(result.message, { duration: 5000 });
      setDepositAmount('');
      setDepositTxnId('');
      setActiveTab('history');
      loadHistory();
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount < 100) { toast.error('Minimum withdrawal is ₹100'); return; }
    if (!withdrawUpi.includes('@')) { toast.error('Enter a valid UPI ID (e.g. name@paytm)'); return; }
    setSubmitting(true);
    try {
      const result = await api.createWithdraw(amount, withdrawUpi.trim());
      toast.success(result.message, { duration: 5000 });
      setWithdrawAmount('');
      setWithdrawUpi('');
      setActiveTab('history');
      loadHistory();
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  if (authLoading || !user) return null;

  const quickAmounts = [100, 500, 1000, 2000, 5000, 10000];

  const statusConfig: Record<string, { color: string; icon: any; bg: string; label: string }> = {
    PENDING: { color: 'text-amber-400', icon: Clock, bg: 'bg-amber-400/10', label: 'Pending' },
    APPROVED: { color: 'text-green-400', icon: CheckCircle2, bg: 'bg-green-400/10', label: 'Approved' },
    REJECTED: { color: 'text-red-400', icon: XCircle, bg: 'bg-red-400/10', label: 'Rejected' },
  };

  const tabs = [
    { id: 'deposit' as const, label: 'Add Money', icon: Plus, color: 'text-green-400' },
    { id: 'withdraw' as const, label: 'Withdraw', icon: ArrowDownToLine, color: 'text-orange-400' },
    { id: 'history' as const, label: 'History', icon: History, color: 'text-blue-400' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a1e]">
      {/* Header */}
      <header className="bg-[#12122a]/80 border-b border-white/5 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="bg-amber-600/20 p-1.5 rounded-lg">
                <Wallet className="w-4 h-4 text-amber-400" />
              </div>
              <h1 className="text-white font-bold">My Wallet</h1>
            </div>
          </div>
          {/* Balance */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#1a1a2e] rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 border border-white/5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-white font-bold tabular-nums">{balance.toFixed(2)}</span>
            <span className="text-gray-600 text-xs">coins</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Tabs */}
        <div className="flex bg-[#12122a] rounded-xl border border-white/5 p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : ''}`} />
              <span className="text-xs sm:text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ═══ ADD MONEY TAB ═══ */}
        {activeTab === 'deposit' && (
          <div className="space-y-4">
            {/* Rules */}
            <div className="bg-[#12122a] rounded-xl border border-amber-500/10 overflow-hidden">
              <button
                onClick={() => setShowDepositRules(!showDepositRules)}
                className="w-full flex items-center justify-between px-4 py-3 text-amber-400"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-bold">Important Rules — Read Before Adding Money</span>
                </div>
                {showDepositRules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showDepositRules && (
                <div className="px-4 pb-4 space-y-2">
                  {DEPOSIT_RULES.map((rule, i) => (
                    <div key={i} className="flex gap-2.5 text-xs">
                      <span className="text-amber-500/80 font-bold mt-0.5 shrink-0">{i + 1}.</span>
                      <span className="text-gray-400 leading-relaxed">{rule}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleDeposit} autoComplete="off" className="space-y-4">
              {/* Amount */}
              <div className="bg-[#12122a] rounded-xl border border-white/5 p-4">
                <label className="text-xs text-gray-400 mb-2 block font-medium">Amount (₹1 = 1 Coin)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount..."
                  min={1}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a1e] border border-white/10 text-white text-xl font-bold focus:outline-none focus:border-green-500/50 transition-all"
                  autoComplete="off"
                  name="deposit-amt-val"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {quickAmounts.map((a) => (
                    <button key={a} type="button" onClick={() => setDepositAmount(String(a))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${depositAmount === String(a) ? 'bg-green-600/30 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'}`}>
                      ₹{a.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-[#12122a] rounded-xl border border-white/5 p-4">
                <label className="text-xs text-gray-400 mb-3 block font-medium">Scan QR Code to Pay</label>
                <div className="bg-white rounded-xl p-4 flex flex-col items-center">
                  {qrLoading ? (
                    <div className="w-48 h-48 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                  ) : qrCodeData ? (
                    <img src={qrCodeData} alt="Payment QR Code" className="w-52 h-52 object-contain" />
                  ) : (
                    <img src="/qr-payment.png" alt="Payment QR Code" className="w-52 h-52 object-contain" />
                  )}
                  <p className="text-gray-700 text-xs mt-2 font-medium">
                    {depositAmount ? `Pay ₹${Number(depositAmount).toLocaleString()} using any UPI app` : 'Scan and pay using any UPI app'}
                  </p>
                </div>
              </div>

              {/* Transaction ID */}
              <div className="bg-[#12122a] rounded-xl border border-white/5 p-4">
                <label className="text-xs text-gray-400 mb-2 block font-medium">Transaction ID / UTR Number</label>
                <input
                  type="text"
                  value={depositTxnId}
                  onChange={(e) => setDepositTxnId(e.target.value)}
                  placeholder="Enter your UPI/bank transaction ID..."
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a1e] border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50 transition-all font-mono"
                  autoComplete="off"
                  name="deposit-txn-ref-val"
                />
                <p className="text-[10px] text-gray-600 mt-1.5 flex items-center gap-1"><Info className="w-3 h-3" /> You can find the Transaction ID in your UPI app payment history</p>
              </div>

              <button
                type="submit"
                disabled={submitting || !depositAmount || !depositTxnId}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Submit Deposit Request
              </button>
              <div className="flex items-center gap-2 justify-center text-[10px] text-gray-600">
                <ShieldCheck className="w-3 h-3" />
                <span>Your coins will be added within 48 hours after verification</span>
              </div>
            </form>
          </div>
        )}

        {/* ═══ WITHDRAW TAB ═══ */}
        {activeTab === 'withdraw' && (
          <div className="space-y-4">
            {/* Rules */}
            <div className="bg-[#12122a] rounded-xl border border-orange-500/10 overflow-hidden">
              <button
                onClick={() => setShowWithdrawRules(!showWithdrawRules)}
                className="w-full flex items-center justify-between px-4 py-3 text-orange-400"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-bold">Important Rules — Read Before Withdrawing</span>
                </div>
                {showWithdrawRules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showWithdrawRules && (
                <div className="px-4 pb-4 space-y-2">
                  {WITHDRAW_RULES.map((rule, i) => (
                    <div key={i} className="flex gap-2.5 text-xs">
                      <span className="text-orange-500/80 font-bold mt-0.5 shrink-0">{i + 1}.</span>
                      <span className="text-gray-400 leading-relaxed">{rule}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Balance card */}
            <div className="bg-gradient-to-br from-[#1a1a3a] to-[#12122a] rounded-xl border border-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-white flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-400" /> {balance.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Equivalent</p>
                  <p className="text-lg font-bold text-green-400">₹{balance.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleWithdraw} autoComplete="off" className="space-y-4">
              {/* Amount */}
              <div className="bg-[#12122a] rounded-xl border border-white/5 p-4">
                <label className="text-xs text-gray-400 mb-2 block font-medium">Withdrawal Amount (1 Coin = ₹1)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount (min ₹100)..."
                  min={100}
                  max={balance}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a1e] border border-white/10 text-white text-xl font-bold focus:outline-none focus:border-orange-500/50 transition-all"
                  autoComplete="off"
                  name="withdraw-amt-val"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {quickAmounts.map((a) => (
                    <button key={a} type="button" onClick={() => setWithdrawAmount(String(a))} disabled={a > balance}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-20 ${withdrawAmount === String(a) ? 'bg-orange-600/30 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'}`}>
                      ₹{a.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* UPI ID */}
              <div className="bg-[#12122a] rounded-xl border border-white/5 p-4">
                <label className="text-xs text-gray-400 mb-2 block font-medium">Your UPI ID</label>
                <input
                  type="text"
                  value={withdrawUpi}
                  onChange={(e) => setWithdrawUpi(e.target.value)}
                  placeholder="e.g. yourname@paytm, yourname@ybl"
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a1e] border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                  autoComplete="off"
                  name="withdraw-upi-val"
                />
                <p className="text-[10px] text-gray-600 mt-1.5 flex items-center gap-1"><Info className="w-3 h-3" /> Make sure this UPI ID is active and belongs to your bank account</p>
              </div>

              <button
                type="submit"
                disabled={submitting || !withdrawAmount || Number(withdrawAmount) < 100 || !withdrawUpi.includes('@')}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                Submit Withdrawal Request
              </button>
              <div className="flex items-center gap-2 justify-center text-[10px] text-gray-600">
                <ShieldCheck className="w-3 h-3" />
                <span>Money will be credited to your account within 48 hours</span>
              </div>
            </form>
          </div>
        )}

        {/* ═══ HISTORY TAB ═══ */}
        {activeTab === 'history' && (
          <div>
            {/* Filters */}
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-gray-500" />
              {['', 'DEPOSIT', 'WITHDRAW'].map((f) => (
                <button
                  key={f}
                  onClick={() => { setHistoryFilter(f); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${historyFilter === f ? 'bg-white/10 text-white border border-white/20' : 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10'}`}
                >
                  {f === '' ? 'All' : f === 'DEPOSIT' ? 'Deposits' : 'Withdrawals'}
                </button>
              ))}
            </div>

            {/* Status summary */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => {
                const sc = statusConfig[s];
                const StatusIcon = sc.icon;
                const count = requests.filter((r) => r.status === s).length;
                return (
                  <div key={s} className={`${sc.bg} rounded-xl p-3 flex items-center gap-2`}>
                    <StatusIcon className={`w-4 h-4 ${sc.color}`} />
                    <div>
                      <p className={`text-xs font-bold ${sc.color}`}>{sc.label}</p>
                      <p className="text-white text-sm font-bold">{count}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Requests List */}
            {historyLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16 bg-[#12122a] rounded-xl border border-white/5">
                <Wallet className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No payment requests yet</p>
                <p className="text-xs text-gray-600 mt-1">Use the Add Money or Withdraw tab to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map((r) => {
                  const sc = statusConfig[r.status] || statusConfig.PENDING;
                  const StatusIcon = sc.icon;
                  const isDeposit = r.type === 'DEPOSIT';
                  return (
                    <div key={r.id} className="bg-[#12122a] rounded-xl border border-white/5 p-4 hover:border-white/10 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${isDeposit ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                            {isDeposit ? <ArrowUpRight className="w-4 h-4 text-green-400" /> : <ArrowDownRight className="w-4 h-4 text-orange-400" />}
                          </div>
                          <div>
                            <span className="text-white font-semibold text-sm">{isDeposit ? 'Deposit' : 'Withdrawal'}</span>
                            <p className="text-gray-600 text-[10px]">{new Date(r.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-lg ${isDeposit ? 'text-green-400' : 'text-orange-400'}`}>
                            {isDeposit ? '+' : '-'}₹{Number(r.amount).toLocaleString()}
                          </span>
                          <div className={`flex items-center gap-1 justify-end mt-0.5 ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="text-[10px] font-bold">{r.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5">
                        {r.playerTxnId && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Your Transaction ID</span>
                            <span className="text-gray-300 font-mono text-[11px]">{r.playerTxnId}</span>
                          </div>
                        )}
                        {r.upiId && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">UPI ID</span>
                            <span className="text-gray-300">{r.upiId}</span>
                          </div>
                        )}
                        {r.adminTxnId && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Payment Txn ID</span>
                            <span className="text-green-400 font-mono text-[11px]">{r.adminTxnId}</span>
                          </div>
                        )}
                        {r.processedAt && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Processed At</span>
                            <span className="text-gray-400 text-[11px]">{new Date(r.processedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {r.adminNote && (
                          <div className="mt-2 px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/10">
                            <span className="text-red-400 text-xs font-medium">Reason: {r.adminNote}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="px-4 py-1.5 rounded-lg bg-white/5 text-xs text-gray-400 disabled:opacity-50">Prev</button>
                <span className="text-xs text-gray-500">{page} / {totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="px-4 py-1.5 rounded-lg bg-white/5 text-xs text-gray-400 disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
