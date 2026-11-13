import React, { useEffect, useState } from 'react';
import { Smartphone, Timer, Lock, Gauge, History, Save, Check, ChevronDown } from 'lucide-react';
import { QRConfig, LinkRules } from '../../types';

interface Props {
  config: QRConfig;
  onChange: (updater: Partial<QRConfig>) => void;
}

interface HistoryItem { at: number; from: string; to: string }

/** Advanced rules for a dynamic (short-link) QR: per-device redirect, scan limit, schedule, password, change history. */
export const LinkRulesPanel: React.FC<Props> = ({ config, onChange }) => {
  const dynamic = config.dynamic;
  const activeId = dynamic?.customSlug || dynamic?.dynamicId || '';
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState<LinkRules>(dynamic?.rules || {});
  const [password, setPassword] = useState('');
  const [clearPassword, setClearPassword] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Load what the server currently has for this link
  useEffect(() => {
    if (!open || !activeId) return;
    let cancelled = false;
    fetch(`/api/dynamic/${encodeURIComponent(activeId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || cancelled) return;
        if (d.rules) setRules((prev) => ({ ...d.rules, ...prev, hasPassword: d.rules.hasPassword }));
        setHistory(Array.isArray(d.history) ? d.history : []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open, activeId]);

  if (!dynamic?.isDynamic || !activeId) return null;

  const set = (patch: Partial<LinkRules>) => setRules((r) => ({ ...r, ...patch }));
  const toLocalInput = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : '');

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const destination = (config.contentType === 'file' && config.file
        ? `/?file=${encodeURIComponent(config.file.id)}`
        : dynamic.targetUrl || config.url || 'https://example.com').trim();
      const payload: Record<string, any> = {
        iosUrl: rules.iosUrl || '',
        androidUrl: rules.androidUrl || '',
        maxScans: rules.maxScans || 0,
        activeFrom: rules.activeFrom || '',
        activeUntil: rules.activeUntil || '',
      };
      if (clearPassword) payload.password = '';
      else if (password) payload.password = password;

      const res = await fetch('/api/dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeId,
          customSlug: dynamic.customSlug,
          title: config.frame.title || 'Dynamic QR',
          targetUrl: destination,
          contentType: config.contentType,
          rules: payload,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save rules');
      const saved: LinkRules = data.link?.rules || {};
      setRules(saved);
      setHistory(Array.isArray(data.link?.history) ? data.link.history : history);
      setPassword('');
      setClearPassword(false);
      onChange({ dynamic: { ...dynamic, rules: saved } });
      setMessage({ ok: true, text: 'Rules saved. They apply to scans immediately.' });
    } catch (e: any) {
      setMessage({ ok: false, text: e?.message || 'Could not save rules. Are you signed in?' });
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
  const label = 'mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="text-sm font-bold text-slate-900 dark:text-white">Advanced link rules</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-200 p-4 dark:border-slate-800">
          <div>
            <p className={label}><Smartphone className="h-3.5 w-3.5" /> Send phones to different places</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={field} placeholder="iPhone / iPad link (App Store)" value={rules.iosUrl || ''} onChange={(e) => set({ iosUrl: e.target.value })} />
              <input className={field} placeholder="Android link (Google Play)" value={rules.androidUrl || ''} onChange={(e) => set({ androidUrl: e.target.value })} />
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Everyone else goes to the main destination.</p>
          </div>

          <div>
            <p className={label}><Gauge className="h-3.5 w-3.5" /> Scan limit</p>
            <input
              type="number" min={0} className={field} placeholder="Unlimited"
              value={rules.maxScans || ''} onChange={(e) => set({ maxScans: Number(e.target.value) || undefined })}
            />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">After this many scans the QR shows “limit reached”.</p>
          </div>

          <div>
            <p className={label}><Timer className="h-3.5 w-3.5" /> Active between</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input type="datetime-local" className={field} value={toLocalInput(rules.activeFrom)} onChange={(e) => set({ activeFrom: fromLocalInput(e.target.value) })} />
              <input type="datetime-local" className={field} value={toLocalInput(rules.activeUntil)} onChange={(e) => set({ activeUntil: fromLocalInput(e.target.value) })} />
            </div>
          </div>

          <div>
            <p className={label}><Lock className="h-3.5 w-3.5" /> Password {rules.hasPassword && <span className="text-emerald-600">(set)</span>}</p>
            <input
              type="password" className={field} autoComplete="new-password"
              placeholder={rules.hasPassword ? 'Type a new password to change it' : 'No password'}
              value={password} onChange={(e) => { setPassword(e.target.value); setClearPassword(false); }}
            />
            {rules.hasPassword && (
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={clearPassword} onChange={(e) => { setClearPassword(e.target.checked); if (e.target.checked) setPassword(''); }} />
                Remove the password
              </label>
            )}
          </div>

          <button
            type="button" onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : (<><Save className="h-3.5 w-3.5" /> Save rules</>)}
          </button>
          {message && (
            <p className={`flex items-center gap-1.5 text-xs font-semibold ${message.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
              {message.ok && <Check className="h-3.5 w-3.5" />} {message.text}
            </p>
          )}

          {history.length > 0 && (
            <div>
              <p className={label}><History className="h-3.5 w-3.5" /> Destination history</p>
              <ul className="space-y-1.5">
                {history.slice(0, 8).map((h, i) => (
                  <li key={i} className="rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <span className="font-semibold">{new Date(h.at).toLocaleString()}</span>
                    <div className="break-all">{h.from} → {h.to}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
