export interface ReferralInfo {
  enabled: boolean;
  code?: string;
  count?: number;
  earned?: number;
  redeemed?: boolean;
  canRedeem?: boolean;
  bonus?: number;
  cap?: number;
  windowDays?: number;
  /** Friends who joined with this user's code, newest first. */
  friends?: { name: string; at: number; bonus: number }[];
  /** Name of the friend whose code this user used. */
  referredByName?: string;
}

const PENDING_KEY = 'makeqr_pending_ref';

/** Remembers ?ref=CODE from a shared link until the visitor signs in. */
export function capturePendingRef(): void {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref');
    const clean = (ref || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    if (clean.length === 8) localStorage.setItem(PENDING_KEY, clean);
  } catch { /* storage unavailable */ }
}
export const getPendingRef = (): string => { try { return localStorage.getItem(PENDING_KEY) || ''; } catch { return ''; } };
export const clearPendingRef = (): void => { try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ } };

export const referralLink = (code: string) => `${window.location.origin}/?ref=${code}`;

export async function fetchReferral(): Promise<ReferralInfo> {
  try {
    const r = await fetch('/api/referral');
    if (!r.ok) return { enabled: false };
    return await r.json();
  } catch { return { enabled: false }; }
}

export async function redeemReferralCode(code: string): Promise<{ ok: boolean; error?: string; newCoins?: number; bonus?: number; referrerName?: string }> {
  try {
    const r = await fetch('/api/referral/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true, newCoins: j.newCoins, bonus: j.bonus, referrerName: j.referrerName };
    return { ok: false, error: j.error || 'Could not apply that code.' };
  } catch { return { ok: false, error: 'Could not reach the server. Check your connection.' }; }
}
