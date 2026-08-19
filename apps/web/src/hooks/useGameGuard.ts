// ============================================
// useGameGuard — Checks if a game is disabled
// Redirects players (not admin) to home if disabled
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export function useGameGuard(gameType: string) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading || !user) return;

    // Admin always allowed
    if (user.role === 'ADMIN') {
      setAllowed(true);
      return;
    }

    // Check if game is enabled
    api.getEnabledGames().then((games: any[]) => {
      const enabled = games.some((g: any) => g.gameType === gameType);
      if (!enabled) {
        toast.error(`${gameType} is currently under maintenance`);
        router.replace('/');
        setAllowed(false);
      } else {
        setAllowed(true);
      }
    }).catch(() => {
      setAllowed(true); // Allow on error — don't block
    });
  }, [user, loading, gameType, router]);

  return { allowed, loading: loading || allowed === null };
}
