import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useCoins } from '../context/CoinsContext';
import { TIER_ICONS } from './TierBadge';

const COLORS = ['#fbbf24', '#f59e0b', '#fb7185', '#a78bfa', '#38bdf8', '#34d399', '#ffffff'];

/** Full-screen "you reached a new tier" moment. */
export const TierCelebration: React.FC = () => {
  const { tierUp, dismissTierUp, openCoinsModal } = useCoins();
  const pieces = useMemo(
    () => Array.from({ length: 46 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      dur: 2.4 + Math.random() * 2,
      dx: `${(Math.random() - 0.5) * 220}px`,
      color: COLORS[i % COLORS.length],
    })),
    [tierUp?.id],
  );
  if (!tierUp) return null;
  const Icon = TIER_ICONS[tierUp.id];

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`You reached ${tierUp.name}`} onClick={dismissTierUp}>
      {pieces.map((p, i) => (
        <span key={i} className="tier-confetti" style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, ['--dx' as any]: p.dx }} />
      ))}
      <div className="tier-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-slate-900 p-7 text-center text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="tier-glow pointer-events-none absolute left-1/2 top-10 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl" style={{ background: tierUp.glow }} />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.2em] text-slate-300">New membership tier</p>
        <div className="tier-float relative mx-auto mt-5 flex h-28 w-28 items-center justify-center rounded-[2rem] shadow-2xl" style={{ background: tierUp.gradient, boxShadow: `0 10px 50px ${tierUp.glow}` }}>
          {tierUp.id === 'shogun' && <span className="tier-shimmer absolute inset-0 rounded-[2rem]" />}
          <Icon className="relative h-14 w-14" />
        </div>
        <h2 className="relative mt-5 text-3xl font-black tracking-tight">{tierUp.name}</h2>
        <p className="relative mt-1 text-sm text-slate-300">{tierUp.tagline}</p>
        <ul className="relative mt-4 space-y-1.5 text-left text-xs text-slate-200">
          {tierUp.perks.slice(0, 4).map((p) => (
            <li key={p} className="flex items-start gap-2"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />{p}</li>
          ))}
        </ul>
        <div className="relative mt-6 flex gap-2">
          <button type="button" onClick={dismissTierUp} className="flex-1 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10 cursor-pointer">Awesome</button>
          <button type="button" onClick={() => { dismissTierUp(); openCoinsModal(); }} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-black cursor-pointer" style={{ background: tierUp.gradient, color: tierUp.onSolid }}>See perks</button>
        </div>
      </div>
    </div>
  );
};
