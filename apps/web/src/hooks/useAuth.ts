// ============================================
// useAuth Hook
// ============================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  phone: string | null;
  role: string;
  status: string;
  playerId: string;
  wallet: { balance: number } | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await api.getMe();
      setUser(userData);
      setBalance(userData.wallet?.balance || 0);

      // Socket connection in a separate try-catch so it doesn't break auth
      try {
        const { getSocket } = await import('@/lib/socket');
        const socket = getSocket();
        socket.on('player:balance', (data: { balance: number }) => {
          setBalance(data.balance);
        });
      } catch (socketErr) {
        console.warn('Socket connection failed (non-critical):', socketErr);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, password: string) => {
    const data = await api.login(username, password);
    setUser(data.user);
    setBalance(data.user.wallet?.balance || 0);
    return data;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    setUser(null);
    setBalance(0);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    try {
      const { disconnectSocket } = await import('@/lib/socket');
      disconnectSocket();
    } catch {}
  };

  const refreshBalance = async () => {
    try {
      const data = await api.getBalance();
      setBalance(data.balance);
    } catch {}
  };

  return { user, loading, balance, login, logout, refreshBalance, setBalance };
}
