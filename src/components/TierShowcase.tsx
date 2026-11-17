import React from 'react';
import { Check, Lock, Sparkles } from 'lucide-react';
import { useCoins } from '../context/CoinsContext';
import { TIERS, EXCLUSIVE_DESIGNS, getTierIndex } from '../utils/tiers';
import { TIER_ICONS } from './TierBadge';
import { DesignSwatch } from './DesignSwatch';

/** Membership tiers: current status, progress and the full ladder. */
export const TierShowcase: React.FC = () => {
  const { tier, tierProgress, lifetimeCoins } = useCoins();
  const myIdx = getTierIndex(lifetimeCoins);
  const Icon = TIER_ICONS[tier.id];
  const next = tierProgress.next;

  return (
    <section aria-labelledby="tiers-h" className="space-y-4">
      {/* Current status */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-5 text-white shadow-xl sm:p-7">
        <div className="tier-glow pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full blur-3xl" style={{ background: tier.glow }} />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full opacity-30 blur-3xl" style={{ background: tier.gradient }} />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="tier-float relative flex h-24 w-24 shrink-0 items-center justify-center self-start rounded-[1.75rem] sm:self-auto" style={{ background: tier.gradient, boxShadow: `0 10px 40px ${tier.glow}` }}>
            {tier.id === 'shogun' && <span className="tier-shimmer absolute inset-0 rounded-[1.75rem]" />}
            <Icon className="relative h-12 w-12" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Your membership</p>
            <h2 id="tiers-h" className="text-3xl font-black tracking-tight sm:text-4xl">{tier.name}</h2>
            <p className="text-sm text-slate-300">{tier.tagline}</p>
            <div className="mt-4">
              <div className="mb-1.5 flex items-end justify-between text-xs font-semibold">
                <span className="text-slate-300"><b className="text-white">{lifetimeCoins}</b> QRoins earned in total</span>
                <span className="text-slate-400">{next ? `${next.name} at ${next.min}` : 'Top tier reached'}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(tierProgress.ratio * 100)} aria-label="Progress to next tier">
                <div className="relative h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(4, tierProgress.ratio * 100)}%`, background: next ? next.gradient : tier.gradient }}>
                  <span className="tier-shimmer absolute inset-0 rounded-full" />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-300">
                {next ? <>Earn <b className="text-white">{tierProgress.remaining} more QRoins</b> to become <b className="text-white">{next.name}</b>. Spending QRoins never lowers your tier.</> : 'You have reached the highest tier. New rewards are added over time.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ladder */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((t, i) => {
          const reached = i <= myIdx;
          const current = i === myIdx;
          const TIcon = TIER_ICONS[t.id];
          const designs = EXCLUSIVE_DESIGNS.filter((d) => d.tier === t.id).slice(0, 4);
          return (
            <div key={t.id} className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white p-4 dark:bg-slate-900 ${current ? 'border-transparent shadow-lg' : 'border-slate-200 dark:border-slate-800'}`} style={current ? { boxShadow: `0 0 0 2px ${t.solid}, 0 12px 30px ${t.glow}` } : undefined}>
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: t.gradient, opacity: reached ? 1 : 0.35 }} />
              <div className="mt-1 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: t.gradient, color: t.onSolid, opacity: reached ? 1 : 0.5 }}><TIcon className="h-6 w-6" /></div>
                {current ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">You are here</span>
                  : reached ? <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400"><Check className="h-3 w-3" />Unlocked</span>
                  : <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400"><Lock className="h-3 w-3" />Locked</span>}
              </div>
              <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">{t.name}</h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.min === 0 ? 'Starting tier' : `${t.min} QRoins earned`}</p>
              <ul className="mt-3 flex-1 space-y-1.5">
                {t.perks.map((p) => (
                  <li key={p} className={`flex items-start gap-1.5 text-xs ${reached ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                    <Sparkles className="mt-0.5 h-3 w-3 shrink-0" style={{ color: t.solid }} />{p}
                  </li>
                ))}
              </ul>
              {designs.length > 0 && (
                <div className="mt-3 flex gap-1.5">
                  {designs.map((d) => (
                    <div key={d.id} className={reached ? '' : 'opacity-50 saturate-50'}><DesignSwatch design={d} size={30} /></div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="sr-only" aria-live="polite">{`You are ${tier.name}`}</div>
      
    </section>
  );
};
