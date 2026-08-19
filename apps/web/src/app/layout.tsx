import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'SkyBet | Real-Time Betting Platform',
  description: 'SkyBet - Premium real-time crash betting platform. Watch the plane fly, place your bets, and cash out before it crashes!',
  keywords: 'skybet, betting, crash game, aviation, multiplier',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a1e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-sky-bg min-h-screen text-white" suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a3e',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#00e676', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ff4757', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  );
}
