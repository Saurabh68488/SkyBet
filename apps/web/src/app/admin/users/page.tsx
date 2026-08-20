// ============================================
// Admin - Users Management Page
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Users, Plane, BarChart3, Gamepad2, Settings, Scroll, LogOut, Search,
  Plus, UserCheck, UserX, Wallet, Loader2, X, Eye, EyeOff, KeyRound, Shield, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showAdjust, setShowAdjust] = useState<any>(null);
  const [showPassword, setShowPassword] = useState<any>(null);
  const [passwordData, setPasswordData] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCreatePw, setShowCreatePw] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', password: '', name: '', phone: '', role: 'PLAYER', initialBalance: 0 });
  const [adjustForm, setAdjustForm] = useState({ amount: 0, type: 'add' as 'add' | 'remove', note: '' });

  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) router.replace('/login');
    if (!authLoading && user?.role === 'ADMIN') setAuthReady(true);
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authReady) loadUsers();
  }, [authReady, page, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers(page, 20, search || undefined);
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch { } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(createForm);
      toast.success(`${createForm.role === 'ADMIN' ? 'Admin' : 'Player'} created successfully`);
      setShowCreate(false);
      setShowCreatePw(false);
      setCreateForm({ username: '', password: '', name: '', phone: '', role: 'PLAYER', initialBalance: 0 });
      loadUsers();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.toggleUserStatus(id);
      toast.success('Status updated');
      loadUsers();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjust) return;
    try {
      await api.adjustBalance(showAdjust.id, adjustForm.amount, adjustForm.type, adjustForm.note);
      toast.success(`Balance ${adjustForm.type === 'add' ? 'added' : 'removed'} successfully`);
      setShowAdjust(null);
      setAdjustForm({ amount: 0, type: 'add', note: '' });
      loadUsers();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleViewPassword = async (e: React.MouseEvent, u: any) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const data = await api.getPlayerPassword(u.id);
      setPasswordData(data);
      setShowPassword(u);
      setNewPassword('');
      setShowPw(false);
      setShowNewPw(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleChangePassword = async () => {
    if (!showPassword || !newPassword) return;
    if (newPassword.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    try {
      await api.changePlayerPassword(showPassword.id, newPassword);
      toast.success(`Password changed for ${showPassword.username}`);
      // Refresh password data
      const data = await api.getPlayerPassword(showPassword.id);
      setPasswordData(data);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (authLoading || !user) return null;

  return (
    <AdminLayout activeItem="/admin/users">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">User Management</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 text-sm font-medium hover:bg-accent-cyan/20 transition-all">
          <Plus size={16} /> Create User
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            autoComplete="off" name="user-search-filter" role="searchbox"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-sky-surface border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50 transition-all"
            placeholder="Search users..." />
        </div>
      </div>

      {/* Users List */}
      <div className="glass rounded-xl overflow-hidden">
        {/* Desktop table header — hidden on mobile */}
        <div className="hidden md:grid grid-cols-8 gap-2 px-4 py-2 border-b border-sky-border text-xs text-gray-500 font-medium">
          <span>Username</span><span>Name</span><span>Player ID</span><span>Role</span><span className="text-right">Balance</span><span className="text-center">Status</span><span className="text-center">Password</span><span className="text-right">Actions</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent-cyan" /></div>
        ) : (
          users.map((u) => (
            <div key={u.id} className="border-b border-sky-border/50 hover:bg-sky-surface-2/30 transition-all">
              {/* Desktop row */}
              <div className="hidden md:grid grid-cols-8 gap-2 px-4 py-3 text-sm items-center">
                <span className="font-medium truncate">{u.username}</span>
                <span className="text-gray-400 text-xs truncate">{u.name}</span>
                <span className="text-gray-500 text-xs font-mono truncate">{u.playerId}</span>
                <span className={`text-xs flex items-center gap-1 ${u.role === 'ADMIN' ? 'text-accent-cyan' : 'text-gray-400'}`}>
                  {u.role === 'ADMIN' && <Shield size={10} />}
                  {u.role}
                </span>
                <span className="text-right font-mono text-accent-orange text-xs">{formatNumber(u.wallet?.balance || 0)}</span>
                <span className="text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'ACTIVE' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}>
                    {u.status}
                  </span>
                </span>
                <span className="text-center">
                  {u.role === 'PLAYER' ? (
                    <button onClick={(e) => handleViewPassword(e, u)} className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-400/10 transition-all" title="View/Change Password">
                      <KeyRound size={14} />
                    </button>
                  ) : (
                    <span className="text-gray-600 text-[10px]">Protected</span>
                  )}
                </span>
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => handleToggleStatus(u.id)} title={u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    className={`p-1.5 rounded-lg transition-all ${u.status === 'ACTIVE' ? 'text-accent-green hover:bg-accent-green/10' : 'text-accent-red hover:bg-accent-red/10'}`}>
                    {u.status === 'ACTIVE' ? <UserCheck size={14} /> : <UserX size={14} />}
                  </button>
                  <button onClick={() => { setShowAdjust(u); setAdjustForm({ amount: 0, type: 'add', note: '' }); }} title="Adjust Balance"
                    className="p-1.5 rounded-lg text-accent-orange hover:bg-accent-orange/10 transition-all">
                    <Wallet size={14} />
                  </button>
                </div>
              </div>

              {/* Mobile card */}
              <div className="md:hidden px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm truncate">{u.username}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${u.status === 'ACTIVE' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}>
                      {u.status}
                    </span>
                    {u.role === 'ADMIN' && <Shield size={10} className="text-accent-cyan shrink-0" />}
                  </div>
                  <span className="font-mono text-accent-orange text-xs font-bold shrink-0">{formatNumber(u.wallet?.balance || 0)} 🪙</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-gray-500">
                    {u.name && <span className="mr-2">{u.name}</span>}
                    <span className="font-mono">#{u.playerId}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {u.role === 'PLAYER' && (
                      <button onClick={(e) => handleViewPassword(e, u)} className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-400/10 transition-all">
                        <KeyRound size={13} />
                      </button>
                    )}
                    <button onClick={() => handleToggleStatus(u.id)}
                      className={`p-1.5 rounded-lg transition-all ${u.status === 'ACTIVE' ? 'text-accent-green hover:bg-accent-green/10' : 'text-accent-red hover:bg-accent-red/10'}`}>
                      {u.status === 'ACTIVE' ? <UserCheck size={13} /> : <UserX size={13} />}
                    </button>
                    <button onClick={() => { setShowAdjust(u); setAdjustForm({ amount: 0, type: 'add', note: '' }); }}
                      className="p-1.5 rounded-lg text-accent-orange hover:bg-accent-orange/10 transition-all">
                      <Wallet size={13} />
                    </button>
                  </div>
                </div>
              </div>
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

      {/* ═══ Create User Modal ═══ */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Create User</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-sky-surface-2 text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3" autoComplete="off">
              {/* Role selector */}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setCreateForm({ ...createForm, role: 'PLAYER' })}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${createForm.role === 'PLAYER' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-sky-surface-2 text-gray-400 border border-sky-border'}`}>
                  <Users size={14} /> Player
                </button>
                <button type="button" onClick={() => setCreateForm({ ...createForm, role: 'ADMIN' })}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${createForm.role === 'ADMIN' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-sky-surface-2 text-gray-400 border border-sky-border'}`}>
                  <Shield size={14} /> Admin
                </button>
              </div>
              <input value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} placeholder="Username" required
                autoComplete="off" name="new-account-id"
                className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50" />
              <div className="relative">
                <input value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Password" type={showCreatePw ? 'text' : 'password'} required
                  autoComplete="new-password" name="new-account-secret"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50" />
                <button type="button" onClick={() => setShowCreatePw(!showCreatePw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                  {showCreatePw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Full Name" required
                className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50" />
              <input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="Phone (optional)"
                className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50" />
              <input type="number" value={createForm.initialBalance} onChange={(e) => setCreateForm({ ...createForm, initialBalance: Number(e.target.value) })} placeholder="Initial Balance"
                className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50" />
              <button type="submit" className={`w-full py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-all ${createForm.role === 'ADMIN' ? 'bg-gradient-to-r from-cyan-600 to-blue-600' : 'bg-gradient-to-r from-green-600 to-emerald-600'}`}>
                Create {createForm.role === 'ADMIN' ? 'Admin' : 'Player'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Adjust Balance Modal ═══ */}
      {showAdjust && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdjust(null)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Adjust Balance: {showAdjust.username}</h2>
              <button onClick={() => setShowAdjust(null)} className="p-1 rounded-lg hover:bg-sky-surface-2 text-gray-400"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Current: <span className="text-accent-orange font-mono">{formatNumber(showAdjust.wallet?.balance || 0)} 🪙</span></p>
            <form onSubmit={handleAdjust} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setAdjustForm({ ...adjustForm, type: 'add' })}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${adjustForm.type === 'add' ? 'bg-accent-green/20 text-accent-green border border-accent-green/30' : 'bg-sky-surface-2 text-gray-400 border border-sky-border'}`}>
                  + Add Balance
                </button>
                <button type="button" onClick={() => setAdjustForm({ ...adjustForm, type: 'remove' })}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${adjustForm.type === 'remove' ? 'bg-accent-red/20 text-accent-red border border-accent-red/30' : 'bg-sky-surface-2 text-gray-400 border border-sky-border'}`}>
                  - Remove Balance
                </button>
              </div>
              <input type="number" value={adjustForm.amount} onChange={(e) => setAdjustForm({ ...adjustForm, amount: Number(e.target.value) })} placeholder="Amount" min={1} required
                className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50" />
              <input value={adjustForm.note} onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })} placeholder="Note (optional)"
                className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50" />
              <button type="submit" className={`w-full py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-all text-white ${adjustForm.type === 'add' ? 'bg-gradient-to-r from-accent-green to-emerald-600' : 'bg-gradient-to-r from-accent-red to-red-700'}`}>
                {adjustForm.type === 'add' ? 'Add' : 'Remove'} ₹{adjustForm.amount}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Password View/Change Modal ═══ */}
      {showPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPassword(null)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-amber-400" />
                <h2 className="text-lg font-bold">Password: {showPassword.username}</h2>
              </div>
              <button onClick={() => setShowPassword(null)} className="p-1 rounded-lg hover:bg-sky-surface-2 text-gray-400"><X size={18} /></button>
            </div>

            {/* Current Password Display */}
            <div className="mb-5">
              <label className="text-xs text-gray-500 mb-1.5 block">Current Password</label>
              <div className="flex items-center gap-2 bg-sky-surface-2 border border-sky-border rounded-xl px-4 py-2.5">
                <span className="flex-1 text-sm font-mono text-white">
                  {showPw ? (passwordData?.plainPassword || '—') : '••••••••'}
                </span>
                <button
                  onClick={() => setShowPw(!showPw)}
                  className="text-gray-400 hover:text-white transition-colors"
                  type="button"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Set New Password</label>
              <div className="flex items-center gap-2 bg-sky-surface-2 border border-sky-border rounded-xl px-4 py-2.5">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  autoComplete="new-password" name="change-player-secret"
                  className="flex-1 bg-transparent text-sm text-white outline-none"
                />
                <button
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="text-gray-400 hover:text-white transition-colors"
                  type="button"
                >
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                onClick={handleChangePassword}
                disabled={!newPassword || newPassword.length < 4}
                className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
