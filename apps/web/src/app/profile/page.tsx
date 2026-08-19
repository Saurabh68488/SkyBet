// ============================================
// Profile Page
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { ArrowLeft, User, Key, Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-sky-bg p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/game" className="p-2 rounded-lg hover:bg-sky-surface-2 text-gray-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Profile</h1>
        </div>

        {/* Profile Info */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 border border-accent-cyan/30 flex items-center justify-center">
              <User size={28} className="text-accent-cyan" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{user.name}</h2>
              <p className="text-sm text-gray-400">@{user.username}</p>
            </div>
          </div>

          <div className="space-y-3">
            <InfoRow label="Player ID" value={user.playerId} />
            <InfoRow label="Role" value={user.role} icon={<Shield size={12} className={user.role === 'ADMIN' ? 'text-accent-cyan' : 'text-gray-400'} />} />
            <InfoRow label="Phone" value={user.phone || 'Not set'} />
            <InfoRow label="Status" value={user.status} badge={user.status === 'ACTIVE' ? 'green' : 'red'} />
          </div>
        </div>

        {/* Change Password */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key size={18} className="text-accent-orange" />
            <h2 className="text-base font-bold">Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current Password"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50 transition-all"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50 transition-all"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50 transition-all"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-orange to-amber-600 text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon, badge }: { label: string; value: string; icon?: React.ReactNode; badge?: string }) {
  const badgeColors: Record<string, string> = {
    green: 'bg-accent-green/20 text-accent-green',
    red: 'bg-accent-red/20 text-accent-red',
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-sky-border/50">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center gap-1.5">
        {icon}
        {badge ? (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColors[badge]}`}>{value}</span>
        ) : (
          <span className="text-sm font-medium font-mono">{value}</span>
        )}
      </div>
    </div>
  );
}
