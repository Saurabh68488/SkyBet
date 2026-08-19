// ============================================
// Ludo Results — Polished End Screen
// ============================================
'use client';

import { Crown, Medal, RotateCcw, Home } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LudoResultsProps {
  results: {
    results: { name: string; color: string; position: number; payout: number; isBot: boolean }[];
    mode: string;
    entryFee: number;
  };
  myName: string;
  onPlayAgain: () => void;
}

const COLORS: Record<string, string> = {
  RED: '#E53935', BLUE: '#1E88E5', YELLOW: '#FDD835', GREEN: '#43A047',
};

export default function LudoResults({ results, myName, onPlayAgain }: LudoResultsProps) {
  const sorted = [...results.results].sort((a, b) => a.position - b.position);
  const myResult = sorted.find(r => r.name === myName);
  const isWinner = myResult && myResult.position === 1;
  const isSecond = myResult && myResult.position === 2 && results.mode === '4P';
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 300);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`bg-gradient-to-b from-[#1a0a2e] to-[#0d0520] border border-purple-500/20 rounded-3xl p-6 max-w-sm w-full transition-all duration-500 ${showContent ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
        {/* Trophy Animation */}
        <div className="text-center mb-5">
          <div className={`text-6xl mb-3 transition-all duration-700 ${showContent ? 'scale-100' : 'scale-0'}`}>
            {isWinner ? '🏆' : isSecond ? '🥈' : '😞'}
          </div>
          <h2 className={`text-2xl font-black transition-all duration-500 delay-200 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${
            isWinner ? 'text-yellow-400' : isSecond ? 'text-gray-300' : 'text-red-400'
          }`}>
            {isWinner ? 'VICTORY!' : isSecond ? '2nd Place!' : 'Game Over'}
          </h2>
          {myResult && myResult.payout > 0 && (
            <div className={`mt-2 inline-block px-4 py-1.5 rounded-full transition-all duration-500 delay-300 ${showContent ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} ${
              isWinner ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-gray-500/20 border border-gray-500/30'
            }`}>
              <span className={`text-lg font-black ${isWinner ? 'text-yellow-400' : 'text-gray-300'}`}>
                +{myResult.payout} coins
              </span>
            </div>
          )}
        </div>

        {/* Rankings */}
        <div className="space-y-2 mb-5">
          {sorted.map((r, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-300 ${
                r.position === 1
                  ? 'border-yellow-500/30 bg-yellow-500/10'
                  : r.position === 2 && results.mode === '4P'
                    ? 'border-gray-400/20 bg-gray-500/5'
                    : 'border-white/5 bg-white/5'
              }`}
              style={{ transitionDelay: `${400 + i * 100}ms` }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${COLORS[r.color]}20` }}>
                  {r.position === 1 ? (
                    <Crown size={14} className="text-yellow-400" />
                  ) : r.position === 2 ? (
                    <Medal size={14} className="text-gray-400" />
                  ) : (
                    <span className="text-gray-500 text-xs font-bold">#{r.position}</span>
                  )}
                </div>
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[r.color] }} />
                <span className={`text-sm font-semibold ${r.name === myName ? 'text-yellow-400' : 'text-white'}`}>
                  {r.name === myName ? 'You' : r.name}
                </span>
              </div>
              <span className={`text-sm font-black tabular-nums ${r.payout > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                {r.payout > 0 ? `+${r.payout}` : '0'}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> Play Again
          </button>
          <button
            onClick={onPlayAgain}
            className="w-full py-2.5 rounded-xl text-gray-400 text-xs hover:text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <Home size={12} /> Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
