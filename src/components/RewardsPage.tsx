import React from 'react';
import {
  Coins, Sparkles, Check, Lock, Zap, Gift, ShieldCheck, Layers, QrCode, ArrowLeft, Users, LogIn,
} from 'lucide-react';
import { useCoins, PREMIUM_FEATURES, PremiumFeatureDef } from '../context/CoinsContext';
import { useAuth } from '../context/AuthContext';
import { ReferralPanel } from './ReferralPanel';

interface Props {
  onBack: () => void;
}

/** Full-page "Rewards & Coins" (replaces the old pop-up). */
export const RewardsPage: React.FC<Props> = ({ onBack }) => {
  const {
    coins, isFeatureUnlocked, guestTrialAvailable, activateGuestTrial, unlockWithCoins, activeFeaturePrompt,
  } = useCoins();
  const { user, openAuthModal } = useAuth();
  const [message, setMessage] = React.useState<string | null>(null);

  const target: PremiumFeatureDef | null = activeFeaturePrompt
    ? (PREMIUM_FEATURES[activeFeaturePrompt.id] || (activeFeaturePrompt as any))
    : null;

  const unlock = async (id: string, cost: number) => {
    setMessage(null);
    const r = await unlockWithCoins(id, cost);
    if (!r.success && r.reason) setMessage(r.reason);
  };

  const earn = [
    { icon: QrCode, color: 'text-indigo-500', title: 'Create a new QR', text: 'Earn +10 coins each time you make a QR.', amount: '+10' },
    { icon: Gift, color: 'text-amber-500', title: 'Sign-in bonus', text: 'Get 50 free coins when you create your account.', amount: '+50' },
    { icon: Users, color: 'text-emerald-500', title: 'Refer a friend', text: 'You and your friend both get coins when they join with your code.', amount: '+25' },
  ];

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white">
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25 cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur-md">
                <Coins className="h-3.5 w-3.5 text-amber-200" /> MakeQR Coins
              </span>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Rewards &amp; Coins</h1>
              <p className="mt-1 text-sm text-amber-50">Earn coins by using MakeQR and spend them on premium tools.</p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-black/20 p-4 backdrop-blur-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-200 text-amber-950 shadow-md">
                <Coins className="h-7 w-7" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-100">Your balance</div>
                <div className="flex items-baseline gap-1.5 text-4xl font-black leading-none" aria-live="polite">
                  {coins} <span className="text-sm font-semibold text-amber-200">coins</span>
                </div>
              </div>
              {!user && (
                <button type="button" onClick={openAuthModal} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-amber-900 shadow-sm hover:bg-amber-50 cursor-pointer">
                  <LogIn className="h-3.5 w-3.5" /> Sign in (+50 🪙)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        {/* Left / main column */}
        <div className="space-y-6 lg:col-span-2">
          {target && (
            <section className="rounded-2xl border-2 border-amber-200 bg-amber-50/70 p-5 dark:border-amber-800/60 dark:bg-amber-950/30">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md"><Zap className="h-6 w-6" /></div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Unlock this feature</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{target.name}</h2>
                    <span className="rounded-md bg-amber-500 px-2 py-0.5 text-xs font-black text-white">{target.cost} coins</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{target.description}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2.5 border-t border-amber-200/70 pt-4 dark:border-amber-800/50 sm:flex-row">
                {guestTrialAvailable && !isFeatureUnlocked(target.id) && (
                  <button type="button" onClick={() => activateGuestTrial(target.id)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-extrabold text-white shadow-md cursor-pointer">
                    <Sparkles className="h-4 w-4" /> Use my free 1-time trial
                  </button>
                )}
                {isFeatureUnlocked(target.id) ? (
                  <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"><Check className="h-4 w-4" /> Already unlocked</div>
                ) : (
                  <button type="button" onClick={() => unlock(target.id, target.cost)} disabled={coins < target.cost}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold ${coins >= target.cost ? 'bg-amber-500 text-white shadow-md hover:bg-amber-600 cursor-pointer' : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                    <Coins className="h-4 w-4" />
                    {coins >= target.cost ? `Unlock with ${target.cost} coins` : `Need ${target.cost - coins} more coins`}
                  </button>
                )}
              </div>
              {message && <p className="mt-3 text-xs font-semibold text-rose-600">{message}</p>}
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"><Sparkles className="h-3.5 w-3.5 text-amber-500" /> Ways to earn coins</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {earn.map((e) => (
                <div key={e.title} className="rounded-xl border border-slate-200/70 bg-slate-50 p-3.5 dark:border-slate-700/60 dark:bg-slate-800/60">
                  <div className="mb-1.5 flex items-center justify-between">
                    <e.icon className={`h-4 w-4 ${e.color}`} />
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-extrabold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">{e.amount} 🪙</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{e.title}</div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{e.text}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"><Layers className="h-3.5 w-3.5 text-indigo-500" /> Premium features</h2>
            <div className="space-y-2.5">
              {Object.values(PREMIUM_FEATURES).map((feat) => {
                const unlocked = isFeatureUnlocked(feat.id);
                return (
                  <div key={feat.id} className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 ${unlocked ? 'border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-800/40 dark:bg-emerald-950/20' : 'border-slate-200/70 bg-white hover:border-amber-300 dark:border-slate-700/70 dark:bg-slate-800/80 dark:hover:border-amber-700'}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${unlocked ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                        {unlocked ? <Check className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white">{feat.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{feat.description}</div>
                      </div>
                    </div>
                    {unlocked ? (
                      <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">Active</span>
                    ) : (
                      <button type="button" onClick={() => unlock(feat.id, feat.cost)} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600 cursor-pointer">
                        <Coins className="h-3 w-3" /> {feat.cost}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {!target && message && <p className="mt-3 text-xs font-semibold text-rose-600">{message}</p>}
          </section>
        </div>

        {/* Right column: referrals */}
        <aside className="space-y-6">
          <ReferralPanel />
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{user ? 'Your coins are saved to your account and update live on every device.' : 'Guest coins are kept on this device. Sign in to save them to your account.'}</span>
          </div>
        </aside>
      </div>
    </div>
  );
};
