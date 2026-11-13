import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  syncUserProfile, 
  awardUserCoinsInCloud, 
  unlockFeatureInCloud, 
  recordGuestTrialUsedInCloud 
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
  activeFeaturePrompt: { id: string; name: string; cost: number; description?: string } | null;
  coinToast: { amount: number; message: string; timestamp: number } | null;
  clearCoinToast: () => void;
}

const GUEST_COINS_STORAGE_KEY = 'makeqr_guest_coins_v1';
const GUEST_TRIAL_STORAGE_KEY = 'makeqr_guest_trial_used_v1';
const GUEST_UNLOCKED_STORAGE_KEY = 'makeqr_guest_unlocked_features_v1';
const REWARDED_EVENTS_STORAGE_KEY = 'makeqr_rewarded_events_v1';

const CoinsContext = createContext<CoinsContextType | undefined>(undefined);

export const CoinsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, openAuthModal } = useAuth();

  // Guest Coins default to 20 complimentary coins
  const [coins, setCoins] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(GUEST_COINS_STORAGE_KEY);
      return stored ? Math.max(0, parseInt(stored, 10)) : 20;
    } catch {
      return 20;
    }
  });

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
              message: 'Sign-in Bonus! +50 Coins added to your account 🪙',
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

  // Persist guest state to localStorage
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem(GUEST_COINS_STORAGE_KEY, coins.toString());
        localStorage.setItem(GUEST_TRIAL_STORAGE_KEY, guestTrialUsed ? 'true' : 'false');
        localStorage.setItem(GUEST_UNLOCKED_STORAGE_KEY, JSON.stringify(unlockedFeatures));
      } catch {}
    }
  }, [coins, guestTrialUsed, unlockedFeatures, user]);

  const guestTrialAvailable = !guestTrialUsed;

  const isFeatureUnlocked = (featureId: string): boolean => {
    return unlockedFeatures.includes(featureId);
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
        reason: `Need ${cost - coins} more coins. Earn coins by creating QRs or signing in!`,
      };
    }

    if (user) {
      // Cloud unlock
      const res = await unlockFeatureInCloud(user.uid, featureId, cost);
      if (res.success) {
        setCoins(res.newCoins);
        setUnlockedFeatures(res.unlockedFeatures);
        setCoinToast({
          amount: -cost,
          message: `Unlocked ${featureDef?.name || featureId}! (-${cost} Coins)`,
          timestamp: Date.now(),
        });
        setIsCoinsModalOpen(false);
        setActiveFeaturePrompt(null);
        return { success: true };
      }
    }

    // Local / Guest unlock
    const newCoins = coins - cost;
    const newUnlocked = [...unlockedFeatures, featureId];
    setCoins(newCoins);
    setUnlockedFeatures(newUnlocked);
    setCoinToast({
      amount: -cost,
      message: `Unlocked ${featureDef?.name || featureId}! (-${cost} Coins)`,
      timestamp: Date.now(),
    });
    setIsCoinsModalOpen(false);
    setActiveFeaturePrompt(null);
    return { success: true };
  };

  const earnCoins = async (
    amount: number,
    reason = 'Earned coins!',
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
    } else {
      setCoins((prev) => prev + amount);
    }

    setCoinToast({
      amount,
      message: `+${amount} Coins: ${reason} 🪙`,
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

  const clearCoinToast = () => {
    setCoinToast(null);
  };

  return (
    <CoinsContext.Provider
      value={{
        coins,
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
        activeFeaturePrompt,
        coinToast,
        clearCoinToast,
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
