// ============================================
// Admin - Audit Logs Page (Responsive)
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import { Loader2, Filter } from 'lucide-react';

export default function AdminLogsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => { if (user?.role === 'ADMIN') loadLogs(); }, [user, page, category]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminLogs(page, 30, category || undefined);
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch {} finally { setLoading(false); }
  };

  if (authLoading || !user) return null;

  const categories = ['', 'AUTH', 'BET', 'CASHOUT', 'BALANCE', 'ADMIN', 'SYSTEM', 'GAME'];
  const categoryColors: Record<string, string> = {
    AUTH: 'bg-accent-cyan/20 text-accent-cyan',
    BET: 'bg-accent-orange/20 text-accent-orange',
    CASHOUT: 'bg-accent-green/20 text-accent-green',
    BALANCE: 'bg-accent-purple/20 text-accent-purple',
    ADMIN: 'bg-accent-red/20 text-accent-red',
    SYSTEM: 'bg-gray-500/20 text-gray-400',
    GAME: 'bg-accent-pink/20 text-accent-pink',
  };

  return (
    <AdminLayout activeItem="/admin/logs">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Audit Logs</h1>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
        {categories.map((cat) => (
          <button key={cat} onClick={() => { setCategory(cat); setPage(1); }}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all ${
              category === cat ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30' : 'glass text-gray-400 hover:text-white'
            }`}>
            {cat || 'All'}
          </button>
        ))}
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-5 gap-2 px-4 py-2 border-b border-sky-border text-xs text-gray-500 font-medium min-w-[500px]">
            <span>Time</span><span>User</span><span>Category</span><span className="col-span-2">Action</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent-cyan" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">No logs found</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="grid grid-cols-5 gap-2 px-4 py-2.5 border-b border-sky-border/50 text-xs hover:bg-sky-surface-2/30 transition-all items-center min-w-[500px]">
                <span className="text-gray-500">{formatDate(log.createdAt)}</span>
                <span className="text-gray-300 truncate">{log.user?.username || 'System'}</span>
                <span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${categoryColors[log.category] || 'bg-gray-500/20 text-gray-400'}`}>
                    {log.category}
                  </span>
                </span>
                <span className="col-span-2 text-gray-300 truncate">{log.action}</span>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-3">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg bg-sky-surface-2 text-xs disabled:opacity-50">Prev</button>
            <span className="text-xs text-gray-400">{page} / {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 rounded-lg bg-sky-surface-2 text-xs disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
