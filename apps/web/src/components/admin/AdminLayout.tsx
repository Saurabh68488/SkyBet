// ============================================
// Shared Admin Layout — Responsive sidebar
// Collapses to hamburger menu on mobile
// ============================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import {
  Plane, Users, BarChart3, Gamepad2, Settings, Scroll, LogOut,
  Wallet, CreditCard, Menu, X, Rocket
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', icon: BarChart3, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { href: '/admin/commission', icon: Wallet, label: 'Commission' },
  { href: '/admin/games', icon: Gamepad2, label: 'Aviator Control' },
  { href: '/admin/jetx', icon: Rocket, label: 'JetX Control' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
  { href: '/admin/logs', icon: Scroll, label: 'Logs' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  activeItem: string; // href to highlight
}

export default function AdminLayout({ children, activeItem }: AdminLayoutProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-sky-bg flex">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#0a0a1e]/95 backdrop-blur-sm border-b border-sky-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white p-1">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 border border-accent-cyan/30 flex items-center justify-center">
              <Plane size={14} className="text-accent-cyan" />
            </div>
            <span className="text-sm font-bold text-white">SkyBet</span>
            <span className="text-[10px] text-accent-cyan">Admin</span>
          </div>
        </div>
        <button onClick={handleLogout} className="text-gray-500 hover:text-accent-red p-1">
          <LogOut size={18} />
        </button>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-40
        w-64 glass-strong border-r border-sky-border flex flex-col min-h-screen h-screen
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-4 border-b border-sky-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 border border-accent-cyan/30 flex items-center justify-center">
              <Plane size={16} className="text-accent-cyan" />
            </div>
            <div>
              <span className="text-sm font-bold text-white">SkyBet</span>
              <span className="text-[10px] text-accent-cyan block">Admin Panel</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === activeItem;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
                    : 'text-gray-400 hover:text-white hover:bg-sky-surface-2'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-accent-green hover:bg-sky-surface-2 transition-all mt-4"
          >
            <Gamepad2 size={18} />
            Go to Home
          </Link>
        </nav>

        <div className="p-3 border-t border-sky-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-accent-red hover:bg-sky-surface-2 transition-all w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 pt-[72px] md:pt-6 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
