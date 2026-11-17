import type { ColorSettings, ShapeSettings, FrameSettings } from '../types';

export type TierId = 'bronze' | 'gold' | 'premium' | 'shogun';

export interface TierDef {
  id: TierId;
  name: string;
  min: number; // lifetime QRoins earned needed
  tagline: string;
  /** CSS gradient used for badges, bars and glows */
  gradient: string;
  glow: string;
  solid: string;
  onSolid: string;
  perks: string[];
  /** Premium features this tier unlocks for free */
  freeFeatures: string[];
}

export const TIERS: TierDef[] = [
  {
    id: 'bronze', name: 'Bronze', min: 0, tagline: 'Everyone starts here',
    gradient: 'linear-gradient(135deg,#d6a074 0%,#a8683a 100%)', glow: 'rgba(168,104,58,.45)', solid: '#a8683a', onSolid: '#fff',
    perks: ['All free QR types and downloads', 'Earn QRoins for everything you do'],
    freeFeatures: [],
  },
  {
    id: 'gold', name: 'Gold', min: 250, tagline: 'Shine a little brighter',
    gradient: 'linear-gradient(135deg,#fde68a 0%,#f59e0b 55%,#b45309 100%)', glow: 'rgba(245,158,11,.5)', solid: '#f59e0b', onSolid: '#451a03',
    perks: ['Gold Design Pack: 4 exclusive QR designs', 'Designer Premium Frames, free', 'Gold badge next to your balance'],
    freeFeatures: ['premium-frames'],
  },
  {
    id: 'premium', name: 'Premium', min: 750, tagline: 'Power-user toolkit',
    gradient: 'linear-gradient(135deg,#c4b5fd 0%,#7c3aed 55%,#312e81 100%)', glow: 'rgba(124,58,237,.5)', solid: '#7c3aed', onSolid: '#fff',
    perks: ['Everything in Gold', 'Premium Design Pack: 4 more designs', '4K and Vector SVG export, free', 'Bulk Batch QR Generator, free'],
    freeFeatures: ['premium-frames', 'svg-4k-export', 'batch-generator'],
  },
  {
    id: 'shogun', name: 'Shogun VIP', min: 2000, tagline: 'The highest honour',
    gradient: 'linear-gradient(135deg,#fecaca 0%,#e11d48 40%,#7f1d1d 75%,#1c1917 100%)', glow: 'rgba(225,29,72,.55)', solid: '#e11d48', onSolid: '#fff',
    perks: ['Everything in Premium', 'Shogun Imperial Pack: 4 flagship designs', 'AI Brand Stylist, free', 'Animated Shogun VIP badge', 'First access to new tier rewards'],
    freeFeatures: ['premium-frames', 'svg-4k-export', 'batch-generator', 'ai-brand-stylist'],
  },
];

export const getTierIndex = (lifetime: number): number => {
  let idx = 0;
  TIERS.forEach((t, i) => { if (lifetime >= t.min) idx = i; });
  return idx;
};

export const getTier = (lifetime: number): TierDef => TIERS[getTierIndex(lifetime)];

export interface TierProgress {
  tier: TierDef;
  next: TierDef | null;
  /** 0..1 progress towards the next tier */
  ratio: number;
  remaining: number;
}

export const getTierProgress = (lifetime: number): TierProgress => {
  const i = getTierIndex(lifetime);
  const tier = TIERS[i];
  const next = TIERS[i + 1] || null;
  if (!next) return { tier, next: null, ratio: 1, remaining: 0 };
  return { tier, next, ratio: Math.min(1, Math.max(0, (lifetime - tier.min) / (next.min - tier.min))), remaining: Math.max(0, next.min - lifetime) };
};

export const tierGrantsFeature = (lifetime: number, featureId: string): TierDef | null => {
  const t = getTier(lifetime);
  if (!t.freeFeatures.includes(featureId)) return null;
  // the lowest tier that includes it is the one to credit
  return TIERS.find((x) => x.freeFeatures.includes(featureId)) || t;
};

export interface ExclusiveDesign {
  id: string;
  name: string;
  tier: TierId;
  colors: Pick<ColorSettings, 'foregroundType' | 'fgColor1' | 'fgColor2' | 'gradientAngle' | 'bgColor' | 'eyeOuterColor' | 'eyeInnerColor'>;
  shapes: ShapeSettings;
  frame?: Partial<FrameSettings>;
}

const d = (
  id: string, name: string, tier: TierId, fg1: string, fg2: string, bg: string, eyeOuter: string, eyeInner: string,
  shapes: ShapeSettings, frame?: Partial<FrameSettings>, angle = 135,
): ExclusiveDesign => ({
  id, name, tier,
  colors: { foregroundType: fg1 === fg2 ? 'none' : 'linear', fgColor1: fg1, fgColor2: fg2, gradientAngle: angle, bgColor: bg, eyeOuterColor: eyeOuter, eyeInnerColor: eyeInner },
  shapes, frame,
});

export const EXCLUSIVE_DESIGNS: ExclusiveDesign[] = [
  // Gold pack
  d('gold-sunrise', 'Sunrise Gold', 'gold', '#78350f', '#b45309', '#fffbeb', '#78350f', '#b45309', { dotType: 'rounded', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' }, { frameColor: '#78350f', textColor: '#fffbeb', badgeColor: '#78350f' }),
  d('gold-rosegold', 'Rose Gold', 'gold', '#881337', '#b45309', '#fff1f2', '#9f1239', '#be185d', { dotType: 'dots', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' }, { frameColor: '#9f1239', textColor: '#fff1f2', badgeColor: '#9f1239' }),
  d('gold-champagne', 'Champagne', 'gold', '#78350f', '#78350f', '#fef3c7', '#78350f', '#78350f', { dotType: 'classy-rounded', cornerSquareType: 'square', cornerDotType: 'square' }, { frameColor: '#78350f', textColor: '#fef3c7', badgeColor: '#78350f' }),
  d('gold-amber-noir', 'Amber Ink', 'gold', '#451a03', '#b45309', '#fef3c7', '#451a03', '#b45309', { dotType: 'extra-rounded', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' }, { frameColor: '#1c1917', textColor: '#fbbf24', badgeColor: '#1c1917' }),
  // Premium pack
  d('prem-aurora', 'Aurora', 'premium', '#0369a1', '#6d28d9', '#f8fafc', '#4338ca', '#0369a1', { dotType: 'dots', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' }, { frameColor: '#4338ca', textColor: '#ffffff', badgeColor: '#4338ca' }),
  d('prem-neon', 'Neon Grid', 'premium', '#0e7490', '#a21caf', '#f0fdff', '#0e7490', '#a21caf', { dotType: 'square', cornerSquareType: 'square', cornerDotType: 'square' }, { frameColor: '#0e7490', textColor: '#f0fdff', badgeColor: '#0e7490' }, 90),
  d('prem-orchid', 'Orchid Silk', 'premium', '#6d28d9', '#be185d', '#faf5ff', '#5b21b6', '#be185d', { dotType: 'classy', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' }, { frameColor: '#6d28d9', textColor: '#ffffff', badgeColor: '#6d28d9' }),
  d('prem-deepsea', 'Deep Sea', 'premium', '#0f766e', '#1e3a8a', '#ecfeff', '#115e59', '#1e40af', { dotType: 'rounded', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' }, { frameColor: '#0f766e', textColor: '#ecfeff', badgeColor: '#0f766e' }),
  // Shogun imperial pack
  d('shogun-crimson', 'Shogun Crimson', 'shogun', '#be123c', '#7f1d1d', '#fff1f2', '#881337', '#be123c', { dotType: 'classy-rounded', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' }, { frameColor: '#7f1d1d', textColor: '#fecdd3', badgeColor: '#7f1d1d' }),
  d('shogun-katana', 'Katana Steel', 'shogun', '#0f172a', '#475569', '#f1f5f9', '#0f172a', '#be123c', { dotType: 'classy', cornerSquareType: 'square', cornerDotType: 'square' }, { frameColor: '#0f172a', textColor: '#f1f5f9', badgeColor: '#0f172a' }),
  d('shogun-imperial', 'Imperial Gold', 'shogun', '#713f12', '#a16207', '#fef9c3', '#713f12', '#a16207', { dotType: 'extra-rounded', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' }, { frameColor: '#713f12', textColor: '#fef9c3', badgeColor: '#713f12' }),
  d('shogun-sakura', 'Sakura Ink', 'shogun', '#9d174d', '#be123c', '#fff1f2', '#831843', '#be123c', { dotType: 'dots', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' }, { frameColor: '#831843', textColor: '#fff1f2', badgeColor: '#831843' }),
];
