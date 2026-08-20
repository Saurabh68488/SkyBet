// ============================================
// Home Page — Game Lobby (Spacious Mobile Design)
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Plane, Wallet, User, LogOut,
  Gamepad2, Star, Users, TrendingUp, Loader2, ChevronRight, ArrowLeft
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, balance, logout } = useAuth();
  const [disabledGames, setDisabledGames] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Fetch which games are enabled
  useEffect(() => {
    if (user) {
      api.getEnabledGames().then((enabled: any[]) => {
        const enabledTypes = enabled.map((g: any) => g.gameType);
        const allTypes = ['AVIATION', 'JETX', 'LUDO'];
        setDisabledGames(allTypes.filter(t => !enabledTypes.includes(t)));
      }).catch(() => {});
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a1e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Plane className="w-8 h-8 text-red-500 animate-pulse" />
          <span className="text-sm text-gray-400">Loading SkyBet...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const games = [
    {
      id: 'aviation',
      name: 'Aviator',
      description: 'Watch the plane fly and cash out before it crashes!',
      href: '/game',
      icon: <Plane className="w-10 h-10" />,
      gradient: 'from-red-600 to-orange-600',
      glow: 'shadow-red-500/30',
      tag: 'LIVE',
      tagColor: 'bg-green-500',
      players: 1247,
      maxWin: '1000x',
      thumbnail: '/aviator-thumb.png',
    },
    {
      id: 'jetx',
      name: 'JetX',
      description: 'Golden jet, bigger stakes! Cash out before the jet flies away!',
      href: '/jetx',
      icon: <TrendingUp className="w-10 h-10" />,
      gradient: 'from-yellow-600 to-amber-600',
      glow: 'shadow-yellow-500/30',
      tag: 'LIVE',
      tagColor: 'bg-green-500',
      players: 893,
      maxWin: '1000x',
      thumbnail: '/jetx-thumb.png',
    },
    {
      id: 'ludo',
      name: 'Ludo',
      description: 'Play classic Ludo and win big! 2P or 4P matches.',
      href: '/ludo',
      icon: <Gamepad2 className="w-10 h-10" />,
      gradient: 'from-purple-600 to-pink-600',
      glow: 'shadow-purple-500/30',
      tag: 'LIVE',
      tagColor: 'bg-green-500',
      players: 562,
      maxWin: '1.8x',
      thumbnail: '/ludo-thumb.png',
    },
    {
      id: 'coming-soon-2',
      name: 'Mines',
      description: 'Navigate the minefield and collect gems.',
      href: '#',
      icon: <Star className="w-10 h-10" />,
      gradient: 'from-cyan-600 to-blue-600',
      glow: 'shadow-cyan-500/30',
      tag: 'COMING SOON',
      tagColor: 'bg-gray-600',
      players: 0,
      maxWin: '500x',
      thumbnail: '/mines-thumb.png',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a1e]">
      {/* ── Header ── */}
      <header className="bg-[#12122a]/80 border-b border-white/5 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="bg-red-600 p-1.5 rounded-lg">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">SkyBet</span>
          </div>

          {/* Right: Wallet + Balance + User */}
          <div className="flex items-center gap-2">
            <Link
              href="/wallet"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/20 text-xs font-medium hover:bg-amber-600/30 transition-all"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wallet</span>
            </Link>
            <Link href="/wallet" className="flex items-center gap-1.5 bg-[#1a1a2e] rounded-lg px-3 py-2 border border-white/5 hover:border-amber-500/20 transition-all">
              <span className="text-amber-400 font-bold text-sm">₹</span>
              <span className="text-white font-bold text-sm tabular-nums">{balance.toFixed(2)}</span>
            </Link>
            {/* User info — desktop only */}
            <div className="hidden md:flex items-center gap-2 bg-[#1a1a2e] rounded-lg px-3 py-2 border border-white/5">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">{user.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-400 transition-colors p-2"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-5 pt-8 pb-6 sm:py-12 relative">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-1.5">
            Welcome, <span className="text-red-500">{user.name || user.username}</span>! 🎮
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg">Choose a game and start winning.</p>
        </div>
      </div>

      {/* ── Games Grid ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-5 pb-16">
        <div className="flex items-center gap-2 mb-5">
          <Gamepad2 className="w-5 h-5 text-gray-500" />
          <h2 className="text-white font-bold text-lg">Games</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {games.map((game) => {
            const isComingSoon = game.tag === 'COMING SOON';
            const gameTypeMap: Record<string, string> = { aviation: 'AVIATION', jetx: 'JETX', ludo: 'LUDO' };
            const gameType = gameTypeMap[game.id] || '';
            const isDisabled = disabledGames.includes(gameType);
            const isAdmin = user?.role === 'ADMIN';
            const canAccess = !isComingSoon && (!isDisabled || isAdmin);

            return (
              <Link
                key={game.id}
                href={canAccess ? game.href : '#'}
                className={`group relative bg-[#12122a] rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-xl ${
                  canAccess ? `hover:${game.glow}` : 'opacity-60 cursor-default pointer-events-none'
                }`}
                onClick={(e) => !canAccess && e.preventDefault()}
              >
                <div className="h-36 sm:h-44 relative overflow-hidden">
                  <img
                    src={game.thumbnail}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12122a] via-transparent to-transparent" />

                  {/* Tag */}
                  {isDisabled && !isAdmin ? (
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                      🚫 Maintenance
                    </div>
                  ) : isDisabled && isAdmin ? (
                    <div className="absolute top-3 right-3 bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                      ⚠️ Disabled (Admin)
                    </div>
                  ) : (
                    <div className={`absolute top-3 right-3 ${game.tagColor} text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide`}>
                      {game.tag === 'LIVE' && (
                        <span className="inline-block w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
                      )}
                      {game.tag}
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="text-white font-bold text-lg mb-1">{game.name}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-3">
                    {isDisabled && !isAdmin
                      ? 'This game is currently under maintenance. Please check back later.'
                      : game.description
                    }
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      {canAccess && !isComingSoon && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {game.players} playing
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Max {game.maxWin}
                      </span>
                    </div>
                    {canAccess && (
                      <div className="flex items-center gap-1 text-green-400 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                        Play <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
