import React, { useEffect } from 'react';
import { Coins, Sparkles, X } from 'lucide-react';
import { useCoins } from '../context/CoinsContext';

export const CoinRewardToast: React.FC = () => {
  const { coinToast, clearCoinToast } = useCoins();

  useEffect(() => {
    if (!coinToast) return;
    const timer = setTimeout(() => {
      clearCoinToast();
    }, 3800);
    return () => clearTimeout(timer);
  }, [coinToast, clearCoinToast]);

  if (!coinToast) return null;

  const isEarning = coinToast.amount >= 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
      <div className="flex items-center gap-3 py-2.5 px-4 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-2xl border border-amber-500/40 backdrop-blur-md max-w-sm">
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isEarning ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
        }`}>
          {isEarning ? <Coins className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </div>

        <div className="flex-1 text-xs">
          <p className="font-extrabold text-amber-300 leading-tight">
            {coinToast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={clearCoinToast}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
