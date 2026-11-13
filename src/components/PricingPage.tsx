import React from 'react';
import { Check, Coins, Sparkles, Zap, Gift, UserPlus, QrCode, Lock } from 'lucide-react';
import { PREMIUM_FEATURES, useCoins } from '../context/CoinsContext';
import { useAuth } from '../context/AuthContext';

const FREE_FEATURES = [
  'Unlimited static QR codes',
  '12 content types: URL, text, Wi-Fi, vCard, email, phone, SMS, event, location, crypto, social, file',
  'Custom colours, gradients, eye shapes and logos',
  'PNG export and PDF print sheets',
  'Built-in QR scanner and scannability test',
  'Free barcode generator (10 formats)',
  'Saved history on this device',
];

const FEATURE_ICON: Record<string, string> = {
  styling: 'Style',
  export: 'Export',
  tools: 'Tools',
  cloud: 'Cloud',
};

export const PricingPage: React.FC<{ onGoToStudio: () => void }> = ({ onGoToStudio }) => {
  const { coins, isFeatureUnlocked, openCoinsModal } = useCoins();
  const { user, openAuthModal } = useAuth();
  const features = Object.values(PREMIUM_FEATURES);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8 pb-28 lg:pb-12">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800/60">
          <Coins className="h-3.5 w-3.5" /> No subscription. No card.
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">Free to use. Unlock extras with coins.</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Everything you need to make a great QR code is free. Premium tools are one-time unlocks paid in coins that you earn by using MakeQR.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Free plan */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Free</h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">Always</span>
          </div>
          <p className="mt-1 text-4xl font-black text-slate-900 dark:text-white">0<span className="ml-1 text-base font-semibold text-slate-400">forever</span></p>
          <ul className="mt-5 space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onGoToStudio}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 cursor-pointer"
          >
            <QrCode className="h-4 w-4" /> Make a QR code
          </button>
        </section>

        {/* Coin unlocks */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Premium unlocks</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pay once with coins. Yours to keep.</p>
            </div>
            <button
              type="button"
              onClick={() => openCoinsModal()}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-amber-100/80 px-3 py-2 text-sm font-extrabold text-amber-900 dark:border-amber-700/60 dark:from-amber-950/40 dark:to-amber-900/30 dark:text-amber-300 cursor-pointer"
            >
              <Coins className="h-4 w-4" /> Your balance: {coins}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {features.map((f) => {
              const owned = isFeatureUnlocked(f.id);
              return (
                <div key={f.id} className="flex flex-col rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">{FEATURE_ICON[f.category]}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-700 dark:text-amber-300">
                      <Coins className="h-3 w-3" /> {f.cost}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{f.name}</h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{f.description}</p>
                  {owned ? (
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400"><Check className="h-3.5 w-3.5" /> Unlocked</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openCoinsModal({ id: f.id, name: f.name, cost: f.cost, description: f.description })}
                      className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-600 dark:text-slate-100 dark:hover:text-indigo-300 cursor-pointer"
                    >
                      <Lock className="h-3 w-3" /> Unlock for {f.cost} coins
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* How to earn */}
      <section className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-extrabold text-slate-900 dark:text-white">How to earn coins</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: QrCode, t: 'Create QR codes', d: 'Sign in and save a new QR code to earn 10 coins.' },
            { icon: UserPlus, t: 'Sign in', d: 'Saving QR codes needs a free account, which also keeps your coins across devices.' },
            { icon: Gift, t: 'Try before you buy', d: 'Guests get one free trial of a premium tool.' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"><Icon className="h-5 w-5" /></div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t}</h3>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{d}</p>
              </div>
            </div>
          ))}
        </div>
        {!user && (
          <button
            type="button"
            onClick={() => openAuthModal()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" /> Sign in to keep your coins <Zap className="h-3.5 w-3.5" />
          </button>
        )}
      </section>
    </main>
  );
};
