import React from 'react';
import { Lock, Check } from 'lucide-react';
import { QRConfig } from '../types';
import { useCoins } from '../context/CoinsContext';
import { EXCLUSIVE_DESIGNS, TIERS, ExclusiveDesign, getTierIndex } from '../utils/tiers';
import { DesignSwatch } from './DesignSwatch';
import { TierBadge } from './TierBadge';

interface Props {
  config: QRConfig;
  onChange: (updater: Partial<QRConfig>) => void;
}

/** Tier-locked design packs shown inside the design step. */
export const ExclusiveDesigns: React.FC<Props> = ({ config, onChange }) => {
  const { tier, lifetimeCoins, openCoinsModal } = useCoins();
  const myIdx = getTierIndex(lifetimeCoins);

  const apply = (d: ExclusiveDesign) => {
    onChange({
      colors: { ...config.colors, ...d.colors, isTransparentBg: false, customEyeColors: true },
      shapes: { ...config.shapes, ...d.shapes },
      ...(d.frame ? { frame: { ...config.frame, ...d.frame } } : {}),
    });
  };

  const activeId = EXCLUSIVE_DESIGNS.find(
    (d) => d.colors.fgColor1 === config.colors.fgColor1 && d.colors.fgColor2 === config.colors.fgColor2 && d.colors.bgColor === config.colors.bgColor,
  )?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">Earn QRoins to rank up and unlock new design packs. You are <b className="text-slate-700 dark:text-slate-200">{tier.name}</b>.</p>
        <button type="button" onClick={() => openCoinsModal()} className="shrink-0 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer">View tiers</button>
      </div>
      {TIERS.filter((t) => t.id !== 'bronze').map((t) => {
        const unlocked = myIdx >= TIERS.indexOf(t);
        const designs = EXCLUSIVE_DESIGNS.filter((d) => d.tier === t.id);
        return (
          <section key={t.id}>
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2"><TierBadge tier={t} size="sm" /><span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.name === 'Shogun VIP' ? 'Imperial Pack' : `${t.name} Pack`}</span></div>
              {!unlocked && <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400"><Lock className="h-3 w-3" /> {Math.max(0, t.min - lifetimeCoins)} QRoins to go</span>}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {designs.map((d) => {
                const on = activeId === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => (unlocked ? apply(d) : openCoinsModal())}
                    className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all cursor-pointer ${on ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/30' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/70'}`}
                    aria-label={unlocked ? `Apply ${d.name}` : `${d.name} is locked until ${t.name}`}
                  >
                    <div className={`relative ${unlocked ? '' : 'opacity-60 saturate-50'}`}>
                      <DesignSwatch design={d} size={76} />
                      {!unlocked && <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/35"><Lock className="h-5 w-5 text-white" /></span>}
                      {on && <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow"><Check className="h-3 w-3" /></span>}
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{d.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
