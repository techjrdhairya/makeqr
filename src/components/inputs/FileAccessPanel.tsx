import React, { useState } from 'react';
import { Lock, Download, Check } from 'lucide-react';
import { QRConfig } from '../../types';

interface Props {
  config: QRConfig;
  onChange: (updater: Partial<QRConfig>) => void;
}

/** Who can do what with an uploaded file: view-only mode and an optional password. */
export const FileAccessPanel: React.FC<Props> = ({ config, onChange }) => {
  const file = config.file;
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (config.contentType !== 'file' || !file) return null;
  const allowDownload = file.allowDownload !== false;

  const call = async (body: Record<string, any>) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/files/${encodeURIComponent(file.id)}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || (res.status === 401 ? 'Please sign in first.' : 'Could not save.'));
      onChange({ file: { ...file, allowDownload: data.allowDownload, hasPassword: data.hasPassword } });
      return data;
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || 'Could not save.' });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const toggleDownload = async () => {
    const data = await call({ allowDownload: !allowDownload });
    if (data) setMsg({ ok: true, text: data.allowDownload ? 'Downloads allowed.' : 'View-only: the download button is hidden.' });
  };
  const savePassword = async () => {
    const data = await call({ password });
    if (data) {
      setPassword('');
      setMsg({ ok: true, text: data.hasPassword ? 'Password set. People must enter it to open the file.' : 'Password removed.' });
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-sm font-bold text-slate-900 dark:text-white">File access</p>

      <label className="flex cursor-pointer items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
        <input type="checkbox" className="mt-0.5" checked={allowDownload} disabled={busy} onChange={toggleDownload} />
        <span>
          <span className="flex items-center gap-1.5 font-bold"><Download className="h-3.5 w-3.5" /> Allow downloads</span>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400">Turn off for view-only. This hides the download button; it can't stop screenshots.</span>
        </span>
      </label>

      <div>
        <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Lock className="h-3.5 w-3.5" /> Password {file.hasPassword && <span className="text-emerald-600">(set)</span>}
        </p>
        <div className="flex gap-2">
          <input
            type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={file.hasPassword ? 'New password' : 'No password'}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <button type="button" disabled={busy || !password} onClick={savePassword}
            className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Set</button>
          {file.hasPassword && (
            <button type="button" disabled={busy} onClick={() => { setPassword(''); call({ password: '' }).then((d) => d && setMsg({ ok: true, text: 'Password removed.' })); }}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-300">Remove</button>
          )}
        </div>
      </div>

      {msg && (
        <p className={`flex items-center gap-1.5 text-xs font-semibold ${msg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
          {msg.ok && <Check className="h-3.5 w-3.5" />} {msg.text}
        </p>
      )}
    </div>
  );
};
