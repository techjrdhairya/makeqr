import React from 'react';
import { Medal, Crown, Gem, Swords } from 'lucide-react';
import { TierDef, TierId } from '../utils/tiers';

export const TIER_ICONS: Record<TierId, React.ComponentType<{ className?: string }>> = {
  bronze: Medal,
  gold: Crown,
  premium: Gem,
  shogun: Swords,
};

interface Props {
  tier: TierDef;
  size?: 'xs' | 'sm' | 'md';
  iconOnly?: boolean;
  className?: string;
}

/** Small tier chip. The Shogun VIP chip shimmers. */
export const TierBadge: React.FC<Props> = ({ tier, size = 'sm', iconOnly = false, className = '' }) => {
  const Icon = TIER_ICONS[tier.id];
  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';
  const ic = size === 'md' ? 'h-4 w-4' : 'h-3 w-3';
  return (
    <span
      className={`relative inline-flex items-center gap-1 overflow-hidden rounded-full font-black uppercase tracking-wide shadow-sm ${pad} ${className}`}
      style={{ background: tier.gradient, color: tier.onSolid, boxShadow: `0 0 0 1px rgba(255,255,255,.25) inset, 0 2px 10px ${tier.glow}` }}
      title={`${tier.name} member`}
    >
      {tier.id === 'shogun' && <span className="tier-shimmer pointer-events-none absolute inset-0" />}
      <Icon className={`relative ${ic}`} />
      {!iconOnly && <span className="relative">{tier.name}</span>}
    </span>
  );
};
