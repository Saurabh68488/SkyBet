// ============================================
// Socket.IO Client — with proper auth
// ============================================

import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? '';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const opts = {
      transports: ['polling', 'websocket'] as string[],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    };

    // Empty string = same-origin: call io() with no URL arg
    socket = WS_URL ? io(WS_URL, opts) : io(opts);

    socket.on('connect', () => {
      console.log('🔌 Connected to SkyBet server');
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.log('⚠️ Connection error:', err.message);
    });
  } else {
    // If socket exists but token changed, update auth
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (currentToken && socket.auth && (socket.auth as any).token !== currentToken) {
      socket.auth = { token: currentToken };
      socket.disconnect().connect();
    }
  }

  return socket;
}

export function updateSocketAuth() {
  if (socket) {
    const token = localStorage.getItem('accessToken');
    socket.auth = { token };
    socket.disconnect().connect();
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

