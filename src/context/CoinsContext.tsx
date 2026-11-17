import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { TIERS, TierDef, getTier, getTierIndex, getTierProgress, tierGrantsFeature, TierProgress } from '../utils/tiers';
import { 
  syncUserProfile, 
  awardUserCoinsInCloud, 
  unlockFeatureInCloud, 
  recordGuestTrialUsedInCloud,
  subscribeToUserProfile
} from '../lib/firebase';

export interface PremiumFeatureDef {
  id: string;
  name: string;
  cost: number;
  description: string;
  category: 'styling' | 'export' | 'tools' | 'cloud';
}

export const PREMIUM_FEATURES: Record<string, PremiumFeatureDef> = {
  'ai-brand-stylist': {
    id: 'ai-brand-stylist',
    name: 'AI Brand Stylist & Theme Studio',
    cost: 15,
    description: 'Uses Gemini AI to intelligently analyze your brand, vibe, and colors to craft bespoke QR themes.',
    category: 'styling',
  },
  'svg-4k-export': {
    id: 'svg-4k-export',
    name: 'Ultra-HD 4K & Vector SVG Export',
    cost: 10,
    description: 'Download infinitely scalable vector SVG and ultra-sharp 4096px print-ready files.',
    category: 'export',
  },
  'custom-slug-dynamic': {
    id: 'custom-slug-dynamic',
    name: 'Vanity Short Link & Dynamic Cloud Redirect',
    cost: 15,
    description: 'Create memorable custom URLs (e.g. /my-promo) with real-time target redirection.',
    category: 'cloud',
  },
  'batch-generator': {
    id: 'batch-generator',
    name: 'Bulk Batch QR Generator',
    cost: 25,
    description: 'Generate, customize, and bulk-download up to 50 QR codes simultaneously from text or CSV.',
    category: 'tools',
  },
  'premium-frames': {
    id: 'premium-frames',
    name: 'Designer Premium Frames Pack',
    cost: 10,
    description: 'Exclusive luxury designer frame styles: Neon Glow, Cyberpunk, Holographic, and Gold Ribbon.',
    category: 'styling',
  },
  'multimedia-cloud': {
    id: 'multimedia-cloud',
    name: 'High-Capacity Cloud Media Hosting',
    cost: 20,
    description: 'Host rich PDFs, audios, and video files in Firestore cloud with interactive landing pages.',
    category: 'cloud',
  },
};

interface CoinsContextType {
  coins: number;
  /** Total QRoins ever earned (spending never lowers it) */
  lifetimeCoins: number;
  tier: TierDef;
  tierProgress: TierProgress;
  /** Set when the member just reached a new tier */
  tierUp: TierDef | null;
  dismissTierUp: () => void;
  /** Tier that grants this feature for free, if the member's tier includes it */
  tierGrant: (featureId: string) => TierDef | null;
  unlockedFeatures: string[];
  isFeatureUnlocked: (featureId: string) => boolean;
  guestTrialAvailable: boolean;
  guestTrialUsed: boolean;
  activateGuestTrial: (featureId: string) => boolean;
  unlockWithCoins: (featureId: string, cost?: number) => Promise<{ success: boolean; reason?: string }>;
  earnCoins: (amount: number, reason?: string, isNewQr?: boolean, dedupKey?: string) => Promise<boolean>;
  isCoinsModalOpen: boolean;
  openCoinsModal: (feature?: { id: string; name: string; cost: number; description?: string }) => void;
  closeCoinsModal: () => void;
  /** Clears the "open" request but keeps the feature being unlocked (used when routing to the rewards page). */
  consumeCoinsRequest: () => void;
  activeFeaturePrompt: { id: string; name: string; cost: number; description?: string } | null;
  coinToast: { amount: number; message: string; timestamp: number } | null;
  clearCoinToast: () => void;
  /** Sets the balance to a value the server just confirmed (e.g. after a referral bonus). */
  setCoinsFromServer: (balance: number, bonus?: number, message?: string) => void;
}

const GUEST_LIFETIME_STORAGE_KEY = 'makeqr_guest_lifetime_v1';
const SESSION_LIFETIME_KEY = 'makeqr_session_lifetime';
const TIER_SEEN_PREFIX = 'makeqr_tier_seen_';
const GUEST_COINS_STORAGE_KEY = 'makeqr_guest_coins_v1';
const GUEST_TRIAL_STORAGE_KEY = 'makeqr_guest_trial_used_v1';
const GUEST_UNLOCKED_STORAGE_KEY = 'makeqr_guest_unlocked_features_v1';
const REWARDED_EVENTS_STORAGE_KEY = 'makeqr_rewarded_events_v1';
const SESSION_UID_KEY = 'makeqr_session_uid';
const SESSION_COINS_KEY = 'makeqr_session_coins';

const CoinsContext = createContext<CoinsContextType | undefined>(undefined);

export const CoinsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, openAuthModal } = useAuth();

  // Guest Coins default to 20 complimentary coins
  const [coins, setCoins] = useState<number>(() => {
    try {
      // A signed-in visitor reloading the page: show their last known balance right away
      if (localStorage.getItem(SESSION_UID_KEY)) {
        const cached = localStorage.getItem(SESSION_COINS_KEY);
        if (cached !== null && !isNaN(parseInt(cached, 10))) return Math.max(0, parseInt(cached, 10));
      }
      const stored = localStorage.getItem(GUEST_COINS_STORAGE_KEY);
      return stored ? Math.max(0, parseInt(stored, 10)) : 20;
    } catch {
      return 20;
    }
  });

  const [lifetime, setLifetime] = useState<number>(() => {
    try {
      const key = localStorage.getItem(SESSION_UID_KEY) ? SESSION_LIFETIME_KEY : GUEST_LIFETIME_STORAGE_KEY;
      const v = parseInt(localStorage.getItem(key) || '0', 10);
      return isNaN(v) ? 0 : Math.max(0, v);
    } catch { return 0; }
  });
  const [profileReady, setProfileReady] = useState<boolean>(() => {
    try { return !localStorage.getItem(SESSION_UID_KEY); } catch { return true; }
  });
  const [tierUp, setTierUp] = useState<TierDef | null>(null);

  const [guestTrialUsed, setGuestTrialUsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(GUEST_TRIAL_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [unlockedFeatures, setUnlockedFeatures] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(GUEST_UNLOCKED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCoinsModalOpen, setIsCoinsModalOpen] = useState(false);
  const [activeFeaturePrompt, setActiveFeaturePrompt] = useState<{
    id: string;
    name: string;
    cost: number;
    description?: string;
  } | null>(null);

  const [coinToast, setCoinToast] = useState<{ amount: number; message: string; timestamp: number } | null>(null);

  // Sync user coins & profile whenever user changes (signing in)
  useEffect(() => {
    if (!user) return;
    setProfileReady(false);

    let mounted = true;
    const mergeKey = `makeqr_guest_coins_merged_${user.uid}`;
    const alreadyMerged = localStorage.getItem(mergeKey) === 'true';
    // Only transfer guest coins on the very first sign-in
    const guestCoinsToMerge = !alreadyMerged && coins > 0 ? Math.min(coins, 50) : 0;

    syncUserProfile(user, guestCoinsToMerge)
      .then((profile) => {
        if (mounted) {
          try {
            localStorage.setItem(mergeKey, 'true');
            // Guest coins now belong to the account; don't leave a copy behind for after sign-out
            localStorage.setItem(GUEST_COINS_STORAGE_KEY, '0');
            localStorage.setItem(GUEST_UNLOCKED_STORAGE_KEY, '[]');
            localStorage.setItem(SESSION_COINS_KEY, String(profile.coins));
          } catch {}

          setCoins(profile.coins);
          setUnlockedFeatures(profile.unlockedFeatures || []);
          if (profile.guestTrialUsed) {
            setGuestTrialUsed(true);
          }

          // Celebrate sign-in bonus ONLY if it's a genuinely new account creation
          if (profile.isNewAccount) {
            setCoinToast({
              amount: 50,
              message: 'Sign-in Bonus! +50 QRoins added to your account 🔳',
              timestamp: Date.now(),
            });
          }
        }
      })
      .catch((err) => {
        console.warn('Sync profile coins note:', err);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  // Live balance: coins won from a friend's referral (or another device) show up without a reload
  useEffect(() => {
    if (!user) return;
    const seenKey = `makeqr_ref_seen_${user.uid}`;
    return subscribeToUserProfile(user.uid, (data) => {
      if (typeof data.coins === 'number') {
        setCoins(Math.max(0, data.coins));
        try { localStorage.setItem(SESSION_COINS_KEY, String(Math.max(0, data.coins))); } catch {}
      }
      if (typeof data.lifetimeCoins === 'number') {
        setLifetime(Math.max(0, data.lifetimeCoins));
        try { localStorage.setItem(SESSION_LIFETIME_KEY, String(Math.max(0, data.lifetimeCoins))); } catch {}
      }
      setProfileReady(true);
      if (Array.isArray(data.unlockedFeatures)) setUnlockedFeatures(data.unlockedFeatures);
      if (data.guestTrialUsed === true) setGuestTrialUsed(true);

      // A friend just joined with this user's code → say who
      const at = Number(data.lastReferralAt || 0);
      if (at) {
        let seen = 0;
        try { seen = Number(localStorage.getItem(seenKey) || 0); } catch {}
        if (at > seen) {
          try { localStorage.setItem(seenKey, String(at)); } catch {}
          const bonus = Number(data.lastReferralBonus || 0);
          setCoinToast({
            amount: bonus,
            message: `${data.lastReferralName || 'A friend'} joined with your code! +${bonus} QRoins 🎉`,
            timestamp: Date.now(),
          });
        }
      }
    });
  }, [user?.uid]);

  // Signing out: forget the account's coins and unlocks (the guest balance is restored from storage)
  useEffect(() => {
    const onSignedOut = () => {
      try {
        const c = localStorage.getItem(GUEST_COINS_STORAGE_KEY);
        setCoins(c !== null && !isNaN(parseInt(c, 10)) ? Math.max(0, parseInt(c, 10)) : 0);
        const f = localStorage.getItem(GUEST_UNLOCKED_STORAGE_KEY);
        setUnlockedFeatures(f ? JSON.parse(f) : []);
        setLifetime(Math.max(0, parseInt(localStorage.getItem(GUEST_LIFETIME_STORAGE_KEY) || '0', 10) || 0));
        setProfileReady(true);
      } catch {
        setCoins(0);
        setUnlockedFeatures([]);
      }
      setCoinToast(null);
      setIsCoinsModalOpen(false);
      setActiveFeaturePrompt(null);
    };
    window.addEventListener('makeqr:signed-out', onSignedOut);
    return () => window.removeEventListener('makeqr:signed-out', onSignedOut);
  }, []);

  // Persist guest state to localStorage
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem(GUEST_COINS_STORAGE_KEY, coins.toString());
        localStorage.setItem(GUEST_LIFETIME_STORAGE_KEY, String(Math.max(lifetime, coins)));
        localStorage.setItem(GUEST_TRIAL_STORAGE_KEY, guestTrialUsed ? 'true' : 'false');
        localStorage.setItem(GUEST_UNLOCKED_STORAGE_KEY, JSON.stringify(unlockedFeatures));
      } catch {}
    }
  }, [coins, lifetime, guestTrialUsed, unlockedFeatures, user]);

  // Membership tier comes from lifetime QRoins earned (a balance that was only ever spent never drops it)
  const effectiveLifetime = Math.max(lifetime, coins);
  const tier = getTier(effectiveLifetime);
  const tierProgress = getTierProgress(effectiveLifetime);

  // Celebrate reaching a new tier (but never on first load or while the profile is still loading)
  useEffect(() => {
    if (!profileReady) return;
    const key = TIER_SEEN_PREFIX + (user?.uid || 'guest');
    const idx = getTierIndex(effectiveLifetime);
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) { localStorage.setItem(key, String(idx)); return; }
      const seen = parseInt(raw, 10);
      if (idx > seen) {
        localStorage.setItem(key, String(idx));
        setTierUp(TIERS[idx]);
      } else if (idx < seen) {
        localStorage.setItem(key, String(idx));
      }
    } catch {}
  }, [effectiveLifetime, profileReady, user?.uid]);

  const tierGrant = (featureId: string) => tierGrantsFeature(effectiveLifetime, featureId);
  const dismissTierUp = () => setTierUp(null);

  const guestTrialAvailable = !guestTrialUsed;

  const isFeatureUnlocked = (featureId: string): boolean => {
    return unlockedFeatures.includes(featureId) || tierGrantsFeature(effectiveLifetime, featureId) !== null;
  };

  const activateGuestTrial = (featureId: string): boolean => {
    if (guestTrialUsed && !unlockedFeatures.includes(featureId)) {
      return false;
    }

    setGuestTrialUsed(true);
    try {
      localStorage.setItem(GUEST_TRIAL_STORAGE_KEY, 'true');
    } catch {}

    if (user) {
      recordGuestTrialUsedInCloud(user.uid).catch(console.warn);
    }

    if (!unlockedFeatures.includes(featureId)) {
      setUnlockedFeatures((prev) => [...prev, featureId]);
    }

    setCoinToast({
      amount: 0,
      message: '✨ Guest 1-Time Free Trial Activated! Enjoy this premium feature.',
      timestamp: Date.now(),
    });

    setIsCoinsModalOpen(false);
    setActiveFeaturePrompt(null);
    return true;
  };

  const unlockWithCoins = async (
    featureId: string,
    explicitCost?: number
  ): Promise<{ success: boolean; reason?: string }> => {
    const featureDef = PREMIUM_FEATURES[featureId];
    const cost = explicitCost !== undefined ? explicitCost : (featureDef?.cost || 10);

    if (unlockedFeatures.includes(featureId)) {
      return { success: true };
    }

    if (coins < cost) {
      return {
        success: false,
        reason: `Need ${cost - coins} more QRoins. Earn QRoins by creating QRs or signing in!`,
      };
    }

    if (user) {
      // Cloud unlock
      const res = await unlockFeatureInCloud(user.uid, featureId, cost);
      if (res.success) {
        setLifetime((l) => Math.max(l, coins));
        setCoins(res.newCoins);
        setUnlockedFeatures(res.unlockedFeatures);
        setCoinToast({
          amount: -cost,
          message: `Unlocked ${featureDef?.name || featureId}! (-${cost} QRoins)`,
          timestamp: Date.now(),
        });
        setIsCoinsModalOpen(false);
        setActiveFeaturePrompt(null);
        return { success: true };
      }
    }

    // Local / Guest unlock
    setLifetime((l) => Math.max(l, coins));
    const newCoins = coins - cost;
    const newUnlocked = [...unlockedFeatures, featureId];
    setCoins(newCoins);
    setUnlockedFeatures(newUnlocked);
    setCoinToast({
      amount: -cost,
      message: `Unlocked ${featureDef?.name || featureId}! (-${cost} QRoins)`,
      timestamp: Date.now(),
    });
    setIsCoinsModalOpen(false);
    setActiveFeaturePrompt(null);
    return { success: true };
  };

  const earnCoins = async (
    amount: number,
    reason = 'Earned QRoins!',
    isNewQr = false,
    dedupKey?: string
  ): Promise<boolean> => {
    if (amount <= 0) return false;

    // Deduplication check: If this event was already rewarded, skip awarding coins
    if (dedupKey) {
      try {
        const stored = localStorage.getItem(REWARDED_EVENTS_STORAGE_KEY);
        const rewardedList: string[] = stored ? JSON.parse(stored) : [];
        if (rewardedList.includes(dedupKey)) {
          console.info('MakeQR: Coin reward skipped — already rewarded for key:', dedupKey);
          return false;
        }
        rewardedList.push(dedupKey);
        // Keep the last 100 rewarded keys
        if (rewardedList.length > 100) rewardedList.shift();
        localStorage.setItem(REWARDED_EVENTS_STORAGE_KEY, JSON.stringify(rewardedList));
      } catch (e) {
        console.warn('Deduplication storage check note:', e);
      }
    }

    if (user) {
      const newBalance = await awardUserCoinsInCloud(user.uid, amount, isNewQr);
      setCoins(newBalance);
      setLifetime((l) => Math.max(l, coins) + amount);
    } else {
      setCoins((prev) => prev + amount);
      setLifetime((l) => Math.max(l, coins) + amount);
    }

    setCoinToast({
      amount,
      message: `+${amount} QRoins: ${reason} 🔳`,
      timestamp: Date.now(),
    });
    return true;
  };

  const openCoinsModal = (feature?: { id: string; name: string; cost: number; description?: string }) => {
    if (feature) {
      setActiveFeaturePrompt(feature);
    } else {
      setActiveFeaturePrompt(null);
    }
    setIsCoinsModalOpen(true);
  };

  const closeCoinsModal = () => {
    setIsCoinsModalOpen(false);
    setActiveFeaturePrompt(null);
  };

  const consumeCoinsRequest = () => {
    setIsCoinsModalOpen(false);
  };

  const clearCoinToast = () => {
    setCoinToast(null);
  };

  const setCoinsFromServer = (balance: number, bonus = 0, message = '') => {
    setCoins(balance);
    if (message) setCoinToast({ amount: bonus, message, timestamp: Date.now() });
  };

  return (
    <CoinsContext.Provider
      value={{
        coins,
        lifetimeCoins: effectiveLifetime,
        tier,
        tierProgress,
        tierUp,
        dismissTierUp,
        tierGrant,
        unlockedFeatures,
        isFeatureUnlocked,
        guestTrialAvailable,
        guestTrialUsed,
        activateGuestTrial,
        unlockWithCoins,
        earnCoins,
        isCoinsModalOpen,
        openCoinsModal,
        closeCoinsModal,
        consumeCoinsRequest,
        activeFeaturePrompt,
        coinToast,
        clearCoinToast,
        setCoinsFromServer,
      }}
    >
      {children}
    </CoinsContext.Provider>
  );
};

export const useCoins = (): CoinsContextType => {
  const context = useContext(CoinsContext);
  if (!context) {
    throw new Error('useCoins must be used within a CoinsProvider');
  }
  return context;
};
