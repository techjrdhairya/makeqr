import React, { useState } from 'react';
import { X, Folder, Tag, TrendingUp, Download } from 'lucide-react';
import type { SavedQR } from '../types';

export const parseTags = (raw: string): string[] =>
  Array.from(new Set(raw.split(',').map((t) => t.trim().replace(/^#/, '').slice(0, 24)).filter(Boolean))).slice(0, 8);

/** Small dialog to set a folder and tags for one QR. */
export const OrganiseModal: React.FC<{
  qr: SavedQR | null;
  folders: string[];
  tags: string[];
  onClose: () => void;
  onSave: (id: string, meta: { folder?: string; tags: string[] }) => void;
}> = ({ qr, folders, tags, onClose, onSave }) => {
  const [folder, setFolder] = useState(qr?.folder || '');
  const [tagText, setTagText] = useState((qr?.tags || []).join(', '));
  if (!qr) return null;
  const current = parseTags(tagText);
  const addTag = (t: string) => setTagText(Array.from(new Set([...current, t])).join(', '));
  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={onClose} role="dialog" aria-modal="true" aria-label="Organise QR code">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Organise</h3>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{qr.name || 'Untitled QR'}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
        <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">Folder</label>
        <input id="organise-folder" list="organise-folders" className={inputCls} value={folder} maxLength={40} onChange={(e) => setFolder(e.target.value)} placeholder="e.g. Diwali Campaign" />
        <datalist id="organise-folders">{folders.map((f) => <option key={f} value={f} />)}</datalist>
        <label className="mb-1 mt-3 block text-[11px] font-bold text-slate-600 dark:text-slate-300">Tags (comma separated, up to 8)</label>
        <input id="organise-tags" className={inputCls} value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="e.g. flyer, instagram, poster" />
        {tags.filter((t) => !current.includes(t)).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.filter((t) => !current.includes(t)).slice(0, 12).map((t) => (
              <button key={t} type="button" onClick={() => addTag(t)} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 cursor-pointer dark:bg-slate-800 dark:text-slate-300">+ {t}</button>
            ))}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 cursor-pointer dark:border-slate-700 dark:text-slate-200">Cancel</button>
          <button type="button" id="organise-save" onClick={() => { onSave(qr.id, { folder: folder.trim() || undefined, tags: current }); onClose(); }} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white cursor-pointer">Save</button>
        </div>
      </div>
    </div>
  );
};

/** Compare tags (campaigns) by number of codes and real scans. */
export const CampaignPanel: React.FC<{ items: SavedQR[]; scanCounts: Record<string, number>; onPickTag: (t: string) => void }> = ({ items, scanCounts, onPickTag }) => {
  const rows = new Map<string, { tag: string; codes: number; tracked: number; scans: number; best?: { name: string; scans: number } }>();
  for (const it of items) {
    for (const tag of it.tags || []) {
      const r = rows.get(tag) || { tag, codes: 0, tracked: 0, scans: 0 };
      r.codes++;
      const n = scanCounts[it.id];
      if (n !== undefined) {
        r.tracked++; r.scans += n;
        if (!r.best || n > r.best.scans) r.best = { name: it.name || 'Untitled', scans: n };
      }
      rows.set(tag, r);
    }
  }
  const list = Array.from(rows.values()).sort((a, b) => b.scans - a.scans || b.codes - a.codes);
  const max = Math.max(1, ...list.map((r) => r.scans));
  const exportCsv = () => {
    const csv = ['Tag,QR codes,Tracked codes,Total scans,Top QR,Top QR scans', ...list.map((r) => [r.tag, r.codes, r.tracked, r.scans, `"${(r.best?.name || '').replace(/"/g, '""')}"`, r.best?.scans ?? ''].join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `makeqr-campaigns-${Date.now()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  return (
    <section id="campaign-panel" className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white"><TrendingUp className="h-4 w-4 text-indigo-600" />Campaign comparison</h2>
        {list.length > 0 && <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 cursor-pointer dark:border-slate-700 dark:text-slate-300"><Download className="h-3 w-3" />CSV</button>}
      </div>
      {list.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">Add the same tag to QR codes that belong to one campaign (for example “diwali-flyer”), then compare their scans here. Use Organise on any QR to add tags.</p>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <button key={r.tag} type="button" onClick={() => onPickTag(r.tag)} className="block w-full text-left cursor-pointer">
              <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-100">#{r.tag}</span>
                <span className="text-slate-500 dark:text-slate-400">{r.scans} {r.scans === 1 ? 'scan' : 'scans'} · {r.codes} {r.codes === 1 ? 'code' : 'codes'}{r.tracked < r.codes ? ` (${r.codes - r.tracked} not tracked)` : ''}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.max(r.scans ? 4 : 0, (r.scans / max) * 100)}%` }} /></div>
              {r.best && r.tracked > 1 && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Top: {r.best.name} ({r.best.scans})</p>}
            </button>
          ))}
          <p className="text-[11px] text-slate-400">Only codes with a short link, a file or a hosted page can be counted. Plain static QR codes open their destination directly.</p>
        </div>
      )}
    </section>
  );
};

export const FolderTagChips: React.FC<{ folder?: string; tags?: string[] }> = ({ folder, tags }) =>
  folder || (tags && tags.length) ? (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {folder && <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"><Folder className="h-2.5 w-2.5" />{folder}</span>}
      {(tags || []).map((t) => <span key={t} className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Tag className="h-2.5 w-2.5" />{t}</span>)}
    </div>
  ) : null;
