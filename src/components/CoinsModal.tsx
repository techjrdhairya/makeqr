import React from 'react';
import { 
  Coins, 
  Sparkles, 
  Check, 
  Lock, 
  Zap, 
  ArrowRight, 
  Gift, 
  ShieldCheck, 
  Layers, 
  Download, 
  Link, 
  Cpu, 
  X,
  PlusCircle,
  QrCode
} from 'lucide-react';
import { useCoins, PREMIUM_FEATURES, PremiumFeatureDef } from '../context/CoinsContext';
import { useAuth } from '../context/AuthContext';

export const CoinsModal: React.FC = () => {
  const { 
    coins, 
    unlockedFeatures, 
    isFeatureUnlocked, 
    guestTrialAvailable, 
    guestTrialUsed,
    activateGuestTrial, 
    unlockWithCoins, 
    isCoinsModalOpen, 
    closeCoinsModal, 
    activeFeaturePrompt 
  } = useCoins();

  const { user, openAuthModal } = useAuth();

  if (!isCoinsModalOpen) return null;

  const targetFeature: PremiumFeatureDef | null = activeFeaturePrompt 
    ? (PREMIUM_FEATURES[activeFeaturePrompt.id] || activeFeaturePrompt as any)
    : null;

  const handleUnlockCurrent = async () => {
    if (!targetFeature) return;
    await unlockWithCoins(targetFeature.id, targetFeature.cost);
  };

  const handleActivateTrial = () => {
    if (!targetFeature) return;
    activateGuestTrial(targetFeature.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Coin Counter Banner */}
        <div className="relative bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 p-5 sm:p-6 text-white overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
                  <Coins className="h-3.5 w-3.5 text-amber-200" />
                  MakeQR Coins Economy
                </span>
                {guestTrialAvailable && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-400 text-emerald-950 shadow-xs">
                    <Sparkles className="h-3 w-3" />
                    1 Free Guest Trial Active
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {targetFeature ? 'Unlock Premium Feature' : 'MakeQR Rewards & Coins'}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeCoinsModal}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 transition-colors cursor-pointer text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Coin Balance Display */}
          <div className="mt-4 flex items-center justify-between bg-black/20 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/15">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center text-amber-950 shadow-md">
                <Coins className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-100 uppercase tracking-wider">Your Balance</div>
                <div className="text-2xl sm:text-3xl font-black leading-none flex items-center gap-1.5">
                  {coins} <span className="text-sm font-semibold text-amber-200">Coins</span>
                </div>
              </div>
            </div>

            {!user && (
              <button
                type="button"
                onClick={() => {
                  closeCoinsModal();
                  openAuthModal();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-amber-900 px-3.5 py-2 rounded-xl hover:bg-amber-50 shadow-sm transition-all cursor-pointer"
              >
                <Gift className="h-3.5 w-3.5 text-amber-600" />
                <span>Sign In (+50 🪙)</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* If there's an active feature prompt */}
          {targetFeature && (
            <div className="bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Zap className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                      {targetFeature.name}
                    </h3>
                    <span className="text-xs font-black bg-amber-500 text-white px-2 py-0.5 rounded-md">
                      {targetFeature.cost} Coins
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {targetFeature.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Guest Trial OR Unlock with Coins */}
              <div className="mt-4 pt-4 border-t border-amber-200/70 dark:border-amber-800/50 flex flex-col gap-2.5">
                {/* 1. Guest 1-Time Free Trial Pass */}
                {guestTrialAvailable && !isFeatureUnlocked(targetFeature.id) && (
                  <button
                    type="button"
                    onClick={handleActivateTrial}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Activate Guest 1-Time Free Trial (0 Coins)</span>
                  </button>
                )}

                {/* 2. Unlock with Coins */}
                {!isFeatureUnlocked(targetFeature.id) && (
                  <button
                    type="button"
                    onClick={handleUnlockCurrent}
                    disabled={coins < targetFeature.cost}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                      coins >= targetFeature.cost
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Coins className="h-4 w-4" />
                    <span>
                      {coins >= targetFeature.cost
                        ? `Unlock Now with ${targetFeature.cost} Coins`
                        : `Need ${targetFeature.cost - coins} more coins to unlock`}
                    </span>
                  </button>
                )}

                {/* Already unlocked indicator */}
                {isFeatureUnlocked(targetFeature.id) && (
                  <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    <Check className="h-4 w-4" />
                    <span>Feature Already Unlocked! Ready to use.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* How to Earn Coins Section */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Ways to Earn Coins
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <QrCode className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                    +10 🪙
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">Create New QR</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Earn +10 coins each time you generate a QR
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <Gift className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                    +50 🪙
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">Sign In Bonus</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Get 50 free coins upon signing in
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-1.5 py-0.5 rounded">
                    1 Pass
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">Guest Free Trial</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  1-time free pass for guests
                </div>
              </div>
            </div>
          </div>

          {/* Premium Features Catalog */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              All Premium Features
            </h4>

            <div className="space-y-2">
              {Object.values(PREMIUM_FEATURES).map((feat) => {
                const unlocked = isFeatureUnlocked(feat.id);
                return (
                  <div
                    key={feat.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      unlocked
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/70 hover:border-amber-300 dark:hover:border-amber-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 pr-2">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                          unlocked
                            ? 'bg-emerald-500 text-white'
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {unlocked ? <Check className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          {feat.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {feat.description}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {unlocked ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg">
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => unlockWithCoins(feat.id, feat.cost)}
                          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer shadow-xs"
                        >
                          <Coins className="h-3 w-3" />
                          <span>{feat.cost}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Synced to Firestore cloud</span>
          </div>
          <button
            type="button"
            onClick={closeCoinsModal}
            className="px-4 py-2 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
