import React, { useEffect, useMemo } from 'react';
import { ExternalLink, QrCode } from 'lucide-react';
import { safeHref } from '../utils/pages';

type BioPayload = { n?: string; b?: string; t?: string; l?: { p?: string; l?: string; u?: string }[] };

export function decodeBio(raw: string): BioPayload | null {
  try {
    const fixed = raw.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
    const data = JSON.parse(decodeURIComponent(escape(atob(fixed))));
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

const THEMES: Record<string, { wrap: string; card: string; muted: string }> = {
  dark: { wrap: 'bg-slate-950 text-white', card: 'bg-slate-800 hover:bg-slate-700 border-slate-700', muted: 'text-slate-400' },
  glass: { wrap: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white', card: 'bg-white/20 hover:bg-white/30 border-white/30 backdrop-blur', muted: 'text-white/80' },
  minimal: { wrap: 'bg-white text-slate-900', card: 'bg-slate-50 hover:bg-slate-100 border-slate-200', muted: 'text-slate-500' },
  gradient: { wrap: 'bg-gradient-to-b from-emerald-500 to-sky-600 text-white', card: 'bg-white/20 hover:bg-white/30 border-white/30', muted: 'text-white/80' },
};

export const BioPublicView: React.FC<{ data: string; onCreateNewQR: () => void }> = ({ data, onCreateNewQR }) => {
  const bio = useMemo(() => decodeBio(data), [data]);
  useEffect(() => { if (bio?.n) document.title = bio.n; }, [bio?.n]);
  const th = THEMES[bio?.t || 'dark'] || THEMES.dark;
  const links = (bio?.l || []).map((x) => ({ ...x, href: safeHref(x.u || '', 'web') })).filter((x) => x.href);

  if (!bio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-extrabold">This link page could not be opened</h1>
        <button type="button" onClick={onCreateNewQR} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white cursor-pointer">Make your own QR code</button>
      </div>
    );
  }
  return (
    <div className={`min-h-screen ${th.wrap}`}>
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-10">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-black">{(bio.n || '?').slice(0, 1).toUpperCase()}</div>
        <h1 className="mt-3 text-2xl font-black">{bio.n || 'My links'}</h1>
        {bio.b && <p className={`mt-1 text-center text-sm ${th.muted}`}>{bio.b}</p>}
        <div className="mt-6 w-full space-y-3">
          {links.map((l, i) => (
            <a key={i} href={l.href!} target="_blank" rel="noreferrer noopener" className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-sm font-bold transition-colors ${th.card}`}>
              <span className="truncate">{l.l || l.p || l.u}</span><ExternalLink className="h-4 w-4 shrink-0 opacity-70" />
            </a>
          ))}
          {links.length === 0 && <p className={`text-center text-sm ${th.muted}`}>No links added yet.</p>}
        </div>
        <button type="button" onClick={onCreateNewQR} className={`mt-10 inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${th.muted}`}><QrCode className="h-3.5 w-3.5" />Made with MakeQR</button>
      </div>
    </div>
  );
};
