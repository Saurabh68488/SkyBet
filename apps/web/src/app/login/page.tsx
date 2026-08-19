// ============================================
// Login Page
// ============================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plane, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(username, password);
      toast.success(`Welcome back, ${data.user.name}!`);

      // Determine redirect destination
      const destination = data.user.role === 'ADMIN' ? '/admin' : '/';

      // Small delay ensures localStorage is committed, then force full navigation
      setTimeout(() => {
        window.location.assign(destination);
      }, 300);
      return; // Don't setLoading(false) — we're leaving the page
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a2e] via-[#0d0d35] to-[#15082e]">
        {/* Floating stars */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.2,
              animationDelay: Math.random() * 3 + 's',
              animationDuration: Math.random() * 3 + 2 + 's',
            }}
          />
        ))}
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-strong rounded-2xl p-8 animate-scale-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 border border-accent-cyan/30 mb-4">
              <Plane className="w-8 h-8 text-accent-cyan" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
              SkyBet
            </h1>
            <p className="text-gray-400 mt-2 text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-sky-surface-2 border border-sky-border text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/25 transition-all"
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-sky-surface-2 border border-sky-border text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/25 transition-all pr-12"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-cyan to-blue-600 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
