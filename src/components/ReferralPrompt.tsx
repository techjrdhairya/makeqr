import React, { useEffect, useState } from 'react';
import { Gift, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCoins } from '../context/CoinsContext';
import { fetchReferral, redeemReferralCode, getPendingRef, clearPendingRef } from '../utils/referral';

/** After signing in, offers (once) to add a friend's referral code. Always skippable. */
export const ReferralPrompt: React.FC = () => {
  const { user } = useAuth();
  const { setCoinsFromServer } = useCoins();
  const [open, setOpen] = useState(false);
  const [bonus, setBonus] = useState(25);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!user) { setOpen(false); return; }
    const key = `makeqr_ref_prompt_${user.uid}`;
    let seen = false;
    try { seen = localStorage.getItem(key) === 'done'; } catch { /* ignore */ }
    if (seen) return;
    let live = true;
    // small delay so the sign-in bonus toast and profile creation finish first
    const t = setTimeout(async () => {
      const info = await fetchReferral();
      if (!live) return;
      if (info.enabled && info.canRedeem) { setBonus(info.bonus ?? 25); setCode(getPendingRef()); setOpen(true); }
      else { try { localStorage.setItem(key, 'done'); } catch { /* ignore */ } }
    }, 2500);
    return () => { live = false; clearTimeout(t); };
  }, [user?.uid]);

  if (!open || !user) return null;
  const finish = () => { try { localStorage.setItem(`makeqr_ref_prompt_${user.uid}`, 'done'); } catch { /* ignore */ } setOpen(false); };
  const apply = async () => {
    setBusy(true); setErr('');
    const r = await redeemReferralCode(code);
    setBusy(false);
    if (r.ok) { clearPendingRef(); setCoinsFromServer(r.newCoins ?? 0, r.bonus ?? bonus, `Referral bonus! +${r.bonus ?? bonus} coins`); finish(); }
    else setErr(r.error || 'Could not apply that code.');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Add a referral code">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60"><Gift className="h-6 w-6" /></div>
          <button type="button" aria-label="Skip" onClick={finish} className="rounded-lg p-1 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
        <h3 className="mt-3 text-base font-extrabold text-slate-900 dark:text-white">Did a friend invite you?</h3>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Add their referral code and you both get <b>{bonus} coins</b>. This is optional.</p>
        <input id="referral-prompt-input" value={code} maxLength={8} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="8-character code" className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center font-mono text-lg tracking-[0.25em] uppercase focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={finish} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 cursor-pointer dark:border-slate-700 dark:text-slate-200">Skip</button>
          <button type="button" id="referral-prompt-apply" onClick={apply} disabled={busy || code.length !== 8} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-extrabold text-white disabled:opacity-50 cursor-pointer">{busy ? 'Applying…' : `Apply +${bonus} coins`}</button>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">You can also add it later from the coins window.</p>
      </div>
    </div>
  );
};
