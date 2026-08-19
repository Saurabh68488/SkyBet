// ============================================
// How to Play Modal — Mobile-friendly rules popup
// ============================================
'use client';

import { useState } from 'react';
import { X, Plane, TrendingUp, Coins } from 'lucide-react';

export default function HowToPlay({ onClose }: { onClose: () => void }) {
  const [dontShow, setDontShow] = useState(false);

  const handleStart = () => {
    if (dontShow) {
      localStorage.setItem('skybet-hide-rules', 'true');
    }
    onClose();
  };

  const steps = [
    {
      num: '01',
      title: 'Place your bet',
      description: 'Choose your bet amount and click BET before the round starts.',
      gradient: 'from-green-900/60 to-green-950/80',
      border: 'border-green-500/20',
      icon: '🪙',
    },
    {
      num: '02',
      title: 'Watch the multiplier rise',
      description: 'The plane flies and the multiplier increases. The longer it flies, the higher it goes!',
      gradient: 'from-red-900/40 to-red-950/80',
      border: 'border-red-500/20',
      icon: '📈',
    },
    {
      num: '03',
      title: 'Cash out in time',
      description: 'Cash out before the plane flies away! If you miss it, you lose your bet.',
      gradient: 'from-amber-900/40 to-amber-950/80',
      border: 'border-amber-500/20',
      icon: '💰',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-sm sm:max-w-lg shadow-2xl border border-white/5 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 shrink-0">
          <h2 className="text-white text-base sm:text-lg font-bold">How to Play</h2>
          <button onClick={handleStart} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Steps — scrollable on small screens */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className={`bg-gradient-to-r ${step.gradient} rounded-xl p-3 sm:p-4 border ${step.border} flex items-start gap-3`}
              >
                {/* Step number */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {step.num}
                  </span>
                </div>
                {/* Content */}
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold mb-0.5">{step.title}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-white/5 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-600 bg-transparent accent-green-500"
            />
            <span className="text-gray-400 text-xs sm:text-sm">Don&apos;t show me again</span>
          </label>
          <button
            onClick={handleStart}
            className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 sm:px-8 py-2 rounded-lg text-sm transition-all active:scale-95"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
