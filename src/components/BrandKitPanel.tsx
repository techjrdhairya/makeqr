import React, { useState } from 'react';
import { Palette, Plus, Trash2, Star, Check } from 'lucide-react';
import type { QRConfig } from '../types';
import { applyKit, kitFromConfig, loadKits, saveKits, MAX_KITS, type BrandKit } from '../utils/brandkit';

export const BrandKitPanel: React.FC<{ config: QRConfig; onApply: (next: QRConfig) => void }> = ({ config, onApply }) => {
  const [kits, setKits] = useState<BrandKit[]>(() => loadKits());
  const [name, setName] = useState('');
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState(false);

  const persist = (next: BrandKit[], okText: string) => {
    if (saveKits(next)) { setKits(next); setNote({ ok: true, text: okText }); }
    else setNote({ ok: false, text: 'Could not save: your browser blocked storage, or the logo is too large.' });
  };
  const create = () => {
    if (kits.length >= MAX_KITS) { setNote({ ok: false, text: `You can keep up to ${MAX_KITS} brand kits. Delete one first.` }); return; }
    const kit = kitFromConfig(name, config);
    persist([...kits, { ...kit, isDefault: kits.length === 0 }], `Saved “${kit.name}”.`);
    setName('');
  };

  return (
    <div id="brand-kit" className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left cursor-pointer">
        <span className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white"><Palette className="h-4 w-4 text-indigo-600" />Brand kit</span>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{kits.length ? `${kits.length} saved` : 'Reuse your colours, logo and style'}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          {kits.length > 0 && (
            <ul className="space-y-2">
              {kits.map((k) => (
                <li key={k.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
                  <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700" aria-hidden>
                    <span className="h-full w-1/2" style={{ background: k.colors.fgColor1 || '#000' }} />
                    <span className="h-full w-1/2" style={{ background: k.colors.bgColor || '#fff' }} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-800 dark:text-slate-100">{k.name}{k.isDefault && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-700">DEFAULT</span>}</span>
                  <button type="button" onClick={() => { onApply(applyKit(config, k)); setNote({ ok: true, text: `Applied “${k.name}”.` }); }} className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-extrabold text-white cursor-pointer">Apply</button>
                  <button type="button" aria-label={`Use ${k.name} for new QR codes`} title="Use for every new QR code" onClick={() => persist(kits.map((x) => ({ ...x, isDefault: x.id === k.id ? !x.isDefault : false })), k.isDefault ? 'Default removed.' : `“${k.name}” will be applied to new QR codes.`)} className={`rounded-lg p-1.5 cursor-pointer ${k.isDefault ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}><Star className="h-4 w-4" /></button>
                  <button type="button" aria-label={`Delete ${k.name}`} onClick={() => persist(kits.filter((x) => x.id !== k.id), 'Brand kit deleted.')} className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input id="brandkit-name" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="Name this look, e.g. Cafe brand" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <button type="button" id="brandkit-save" onClick={create} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-extrabold text-indigo-700 cursor-pointer dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"><Plus className="h-3.5 w-3.5" />Save current look</button>
          </div>
          <p className="text-[11px] text-slate-400">Saves colours, dot and eye shapes, logo and frame colours. Kits stay in this browser.</p>
          {note && <p className={`flex items-center gap-1 text-xs ${note.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{note.ok && <Check className="h-3.5 w-3.5" />}{note.text}</p>}
        </div>
      )}
    </div>
  );
};
