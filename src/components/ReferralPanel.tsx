import React, { useEffect, useState } from 'react';
import { Users, Copy, Check, Share2, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCoins } from '../context/CoinsContext';
import { fetchReferral, redeemReferralCode, referralLink, getPendingRef, clearPendingRef, type ReferralInfo } from '../utils/referral';

/** "Refer & earn": your code, share buttons, stats, and an optional box to add a friend's code. */
export const ReferralPanel: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const { setCoinsFromServer } = useCoins();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [input, setInput] = useState(() => getPendingRef());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let live = true;
    if (!user) { setInfo(null); return; }
    fetchReferral().then((i) => live && setInfo(i));
    return () => { live = false; };
  }, [user?.uid]);

  const bonus = info?.bonus ?? 25;

  if (!user) {
    return (
      <div id="referral-panel" className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white"><Users className="h-4 w-4 text-indigo-600" />Refer a friend, earn coins</h3>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Sign in to get your personal referral code. When a friend signs up and adds it, you both get {bonus} coins.</p>
        <button type="button" onClick={openAuthModal} className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white cursor-pointer">Sign in</button>
      </div>
    );
  }
  if (!info || !info.enabled) return null;

  const copy = async (what: 'code' | 'link') => {
    try { await navigator.clipboard.writeText(what === 'code' ? info.code! : referralLink(info.code!)); setCopied(what); setTimeout(() => setCopied(null), 1800); } catch { /* clipboard blocked */ }
  };
  const shareText = `Join me on MakeQR and use my referral code ${info.code} to get ${bonus} free coins: ${referralLink(info.code!)}`;
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'MakeQR', text: shareText });
      else window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener');
    } catch { /* user cancelled */ }
  };
  const apply = async () => {
    setBusy(true); setMsg(null);
    const r = await redeemReferralCode(input);
    setBusy(false);
    if (r.ok) {
      clearPendingRef();
      setCoinsFromServer(r.newCoins ?? 0, r.bonus ?? bonus, `Referral bonus! +${r.bonus ?? bonus} coins`);
      setInfo({ ...info, redeemed: true, canRedeem: false });
      setMsg({ ok: true, text: `Code applied. You and your friend each got ${r.bonus ?? bonus} coins.` });
    } else setMsg({ ok: false, text: r.error || 'Could not apply that code.' });
  };

  return (
    <div id="referral-panel" className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30 space-y-3">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white"><Users className="h-4 w-4 text-indigo-600" />Refer a friend, earn coins</h3>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Share your code. When a friend signs in and adds it, you both get <b>{bonus} coins</b>.</p>
      </div>
      <div className="flex items-center gap-2">
        <div id="my-referral-code" className="flex-1 rounded-xl border border-dashed border-indigo-300 bg-white px-3 py-2.5 text-center font-mono text-lg font-black tracking-[0.2em] text-indigo-700 dark:border-indigo-700 dark:bg-slate-900 dark:text-indigo-300 select-all">{info.code}</div>
        <button type="button" onClick={() => copy('code')} aria-label="Copy referral code" className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{copied === 'code' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={share} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-extrabold text-white cursor-pointer"><Share2 className="h-3.5 w-3.5" />Share invite</button>
        <button type="button" onClick={() => copy('link')} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{copied === 'link' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}Copy link</button>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{info.count || 0} of {info.cap} friends joined · {info.earned || 0} coins earned</p>

      {info.canRedeem ? (
        <div className="border-t border-indigo-100 pt-3 dark:border-indigo-900/60">
          <label htmlFor="referral-input" className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200"><Gift className="h-3.5 w-3.5 text-amber-500" />Have a friend's code? Add it for +{bonus} coins <span className="font-normal text-slate-400">(optional)</span></label>
          <div className="flex gap-2">
            <input id="referral-input" value={input} maxLength={8} onChange={(e) => setInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="8-character code" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm tracking-widest uppercase focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            <button type="button" id="referral-apply" onClick={apply} disabled={busy || input.length !== 8} className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50 cursor-pointer">{busy ? '…' : 'Apply'}</button>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Codes can be added within {info.windowDays} days of creating your account, once.</p>
        </div>
      ) : info.redeemed ? (
        <p className="flex items-center gap-1.5 border-t border-indigo-100 pt-3 text-xs font-semibold text-emerald-700 dark:border-indigo-900/60 dark:text-emerald-300"><Check className="h-3.5 w-3.5" />You joined with a friend's code.</p>
      ) : null}
      {msg && <p className={`text-xs ${msg.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'}`}>{msg.text}</p>}
    </div>
  );
};
