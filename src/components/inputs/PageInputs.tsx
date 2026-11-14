import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, ImagePlus, ArrowLeft, ArrowRight, UploadCloud, Check, ExternalLink, Copy, CloudUpload, AlertCircle, UserRound, UtensilsCrossed, Images } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  PAGE_KINDS, compressImage, pageUrl, publishPage, pageHasContent,
  type PageData, type PageKind, type MenuSection,
} from '../../utils/pages';

interface Props {
  page: PageData;
  onChange: (next: PageData) => void;
  onKindChange?: (kind: PageKind) => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white';
const labelCls = 'mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300';
const ACCENTS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#7c3aed', '#0f172a'];
const KIND_ICON = { card: UserRound, menu: UtensilsCrossed, gallery: Images } as const;
const TAGS = ['', 'Veg', 'Non-veg', 'Spicy', 'Popular', 'New', 'Chef special'];

const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <div className={className}><label className={labelCls}>{label}</label>{children}</div>
);

export const PageInputs: React.FC<Props> = ({ page, onChange, onKindChange }) => {
  const { user, openAuthModal } = useAuth();
  const set = (patch: Partial<PageData>) => onChange({ ...page, ...patch });
  const setCard = (patch: Partial<PageData['card']>) => onChange({ ...page, card: { ...page.card, ...patch } });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [imgErr, setImgErr] = useState('');
  const publishedSnap = useRef<string | null>(page.publishedAt ? JSON.stringify({ ...page, publishedAt: undefined }) : null);
  const [, force] = useState(0);
  useEffect(() => { force((n) => n + 1); }, [page.publishedAt]);

  const snapshot = JSON.stringify({ ...page, publishedAt: undefined });
  const dirty = publishedSnap.current !== snapshot;
  const sizeKB = Math.round(new Blob([snapshot]).size / 1024);

  const pickImage = async (file: File | undefined, max: number, apply: (dataUrl: string) => void) => {
    if (!file) return;
    setImgErr('');
    try { apply(await compressImage(file, max, 0.72)); } catch (e: any) { setImgErr(e?.message || 'Could not use that image.'); }
  };

  const publish = async () => {
    if (!user) { openAuthModal(); return; }
    setBusy(true); setMsg(null);
    const r = await publishPage(page);
    setBusy(false);
    if (r.ok) {
      publishedSnap.current = snapshot;
      onChange({ ...page, publishedAt: Date.now() });
      setMsg({ ok: true, text: 'Published. Your QR code now opens this page, and you can keep editing it later.' });
    } else setMsg({ ok: false, text: r.error || 'Could not publish.' });
  };

  const sections = page.menu.sections;
  const setSections = (next: MenuSection[]) => onChange({ ...page, menu: { ...page.menu, sections: next } });
  const move = <T,>(arr: T[], i: number, d: number) => { const j = i + d; if (j < 0 || j >= arr.length) return arr; const c = [...arr]; [c[i], c[j]] = [c[j], c[i]]; return c; };

  return (
    <div className="space-y-5" id="page-editor">
      {/* kind switch */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(PAGE_KINDS) as PageKind[]).map((k) => {
          const Icon = KIND_ICON[k];
          const on = page.kind === k;
          return (
            <button key={k} type="button" id={`page-kind-${k}`} onClick={() => { set({ kind: k, menu: k === 'menu' && page.menu.sections.length === 0 ? { ...page.menu, sections: [{ name: 'Starters', items: [{ name: '', price: '', desc: '', tag: '' }] }] } : page.menu }); onKindChange?.(k); }}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-bold cursor-pointer transition-colors ${on ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>
              <Icon className="h-5 w-5" />
              <span>{PAGE_KINDS[k].short}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{PAGE_KINDS[page.kind].description}</p>

      {/* basics */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={page.kind === 'menu' ? 'Restaurant name *' : page.kind === 'gallery' ? 'Gallery title *' : 'Page title (your name or brand)'}>
          <input id="page-title" className={inputCls} value={page.title} maxLength={80} onChange={(e) => set({ title: e.target.value })} placeholder={page.kind === 'menu' ? 'e.g. Spice Route Cafe' : page.kind === 'gallery' ? 'e.g. Wedding Album' : 'e.g. Dhairya Agrawal'} />
        </Field>
        <Field label="Tagline (optional)">
          <input className={inputCls} value={page.subtitle} maxLength={120} onChange={(e) => set({ subtitle: e.target.value })} placeholder="A short line under the title" />
        </Field>
      </div>

      {/* look */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 space-y-3 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Colour</span>
          {ACCENTS.map((c) => (
            <button key={c} type="button" aria-label={`Accent ${c}`} onClick={() => set({ accent: c })} style={{ background: c }}
              className={`h-6 w-6 rounded-full cursor-pointer ring-offset-2 dark:ring-offset-slate-900 ${page.accent === c ? 'ring-2 ring-slate-900 dark:ring-white' : ''}`} />
          ))}
          <input type="color" aria-label="Custom colour" value={page.accent} onChange={(e) => set({ accent: e.target.value })} className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0" />
          <div className="ml-auto inline-flex rounded-lg border border-slate-200 p-0.5 text-[11px] font-bold dark:border-slate-700">
            {(['light', 'dark'] as const).map((t) => (
              <button key={t} type="button" onClick={() => set({ theme: t })} className={`rounded-md px-2.5 py-1 cursor-pointer ${page.theme === t ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>{t === 'light' ? 'Light' : 'Dark'}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([['logo', 'Logo / photo', 320], ['cover', 'Cover image', 1000]] as const).map(([key, label, max]) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              {page[key] ? (
                <div className="relative">
                  <img src={page[key]} alt={label} className={`w-full rounded-lg border border-slate-200 object-cover dark:border-slate-700 ${key === 'logo' ? 'h-20' : 'h-20'}`} />
                  <button type="button" aria-label={`Remove ${label}`} onClick={() => set({ [key]: '' } as any)} className="absolute right-1 top-1 rounded-md bg-white/90 p-1 text-rose-600 shadow cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <label className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 text-[11px] font-semibold text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-400">
                  <ImagePlus className="h-4 w-4" /> Add image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { pickImage(e.target.files?.[0], max, (d) => set({ [key]: d } as any)); e.target.value = ''; }} />
                </label>
              )}
            </div>
          ))}
        </div>
        {imgErr && <p className="text-xs text-rose-600">{imgErr}</p>}
      </div>

      {/* BUSINESS CARD */}
      {page.kind === 'card' && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name *"><input id="card-name" className={inputCls} value={page.card.name} onChange={(e) => setCard({ name: e.target.value })} placeholder="Your name" /></Field>
            <Field label="Job title"><input className={inputCls} value={page.card.role} onChange={(e) => setCard({ role: e.target.value })} placeholder="e.g. Founder" /></Field>
            <Field label="Company"><input className={inputCls} value={page.card.company} onChange={(e) => setCard({ company: e.target.value })} /></Field>
            <Field label="Phone"><input id="card-phone" type="tel" inputMode="tel" className={inputCls} value={page.card.phone} onChange={(e) => setCard({ phone: e.target.value })} placeholder="+91 98765 43210" /></Field>
            <Field label="WhatsApp number"><input type="tel" inputMode="tel" className={inputCls} value={page.card.whatsapp} onChange={(e) => setCard({ whatsapp: e.target.value })} placeholder="Same or different number" /></Field>
            <Field label="Email"><input type="email" className={inputCls} value={page.card.email} onChange={(e) => setCard({ email: e.target.value })} /></Field>
            <Field label="Website"><input className={inputCls} value={page.card.website} onChange={(e) => setCard({ website: e.target.value })} placeholder="yourbrand.com" /></Field>
            <Field label="Address"><input className={inputCls} value={page.card.address} onChange={(e) => setCard({ address: e.target.value })} /></Field>
          </div>
          <Field label="About (optional)"><textarea rows={3} maxLength={1200} className={inputCls} value={page.about} onChange={(e) => set({ about: e.target.value })} placeholder="A few lines about you or your business" /></Field>
          <div>
            <div className="mb-1 flex items-center justify-between"><span className={labelCls + ' mb-0'}>Extra links (Instagram, portfolio, booking…)</span>
              {page.card.links.length < 8 && <button type="button" onClick={() => setCard({ links: [...page.card.links, { label: '', url: '' }] })} className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 cursor-pointer dark:text-indigo-400"><Plus className="h-3 w-3" />Add link</button>}
            </div>
            <div className="space-y-2">
              {page.card.links.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input className={inputCls + ' !w-1/3'} placeholder="Label" value={l.label} onChange={(e) => setCard({ links: page.card.links.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
                  <input className={inputCls} placeholder="https://…" value={l.url} onChange={(e) => setCard({ links: page.card.links.map((x, j) => j === i ? { ...x, url: e.target.value } : x) })} />
                  <button type="button" aria-label="Remove link" onClick={() => setCard({ links: page.card.links.filter((_, j) => j !== i) })} className="rounded-lg p-2 text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MENU */}
      {page.kind === 'menu' && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Currency" className="sm:col-span-1"><input className={inputCls} value={page.menu.currency} maxLength={4} onChange={(e) => onChange({ ...page, menu: { ...page.menu, currency: e.target.value } })} /></Field>
            <Field label="Note at the bottom (optional)" className="sm:col-span-3"><input className={inputCls} value={page.menu.note} maxLength={300} onChange={(e) => onChange({ ...page, menu: { ...page.menu, note: e.target.value } })} placeholder="e.g. Prices include GST" /></Field>
          </div>
          {sections.map((sec, si) => (
            <div key={si} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <input className={inputCls + ' font-bold'} placeholder="Section name (e.g. Starters)" value={sec.name} maxLength={60} onChange={(e) => setSections(sections.map((s, j) => j === si ? { ...s, name: e.target.value } : s))} />
                <button type="button" aria-label="Move section up" onClick={() => setSections(move(sections, si, -1))} className="rounded-lg p-2 text-slate-400 hover:text-indigo-600 cursor-pointer"><ArrowLeft className="h-4 w-4 rotate-90" /></button>
                <button type="button" aria-label="Move section down" onClick={() => setSections(move(sections, si, 1))} className="rounded-lg p-2 text-slate-400 hover:text-indigo-600 cursor-pointer"><ArrowRight className="h-4 w-4 rotate-90" /></button>
                <button type="button" aria-label="Remove section" onClick={() => setSections(sections.filter((_, j) => j !== si))} className="rounded-lg p-2 text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
              </div>
              {sec.items.map((it, ii) => {
                const upd = (patch: Partial<typeof it>) => setSections(sections.map((s, j) => j === si ? { ...s, items: s.items.map((x, k) => k === ii ? { ...x, ...patch } : x) } : s));
                return (
                  <div key={ii} className="grid grid-cols-12 gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                    <input className={inputCls + ' col-span-8'} placeholder="Item name" value={it.name} maxLength={80} onChange={(e) => upd({ name: e.target.value })} />
                    <input className={inputCls + ' col-span-4'} placeholder="Price" inputMode="decimal" value={it.price} maxLength={16} onChange={(e) => upd({ price: e.target.value })} />
                    <input className={inputCls + ' col-span-7'} placeholder="Description (optional)" value={it.desc} maxLength={200} onChange={(e) => upd({ desc: e.target.value })} />
                    <select className={inputCls + ' col-span-4'} value={it.tag} onChange={(e) => upd({ tag: e.target.value })} aria-label="Tag">
                      {TAGS.map((t) => <option key={t} value={t}>{t || 'No tag'}</option>)}
                    </select>
                    <button type="button" aria-label="Remove item" onClick={() => setSections(sections.map((s, j) => j === si ? { ...s, items: s.items.filter((_, k) => k !== ii) } : s))} className="col-span-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="mx-auto h-4 w-4" /></button>
                  </div>
                );
              })}
              {sec.items.length < 60 && <button type="button" onClick={() => setSections(sections.map((s, j) => j === si ? { ...s, items: [...s.items, { name: '', price: '', desc: '', tag: '' }] } : s))} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 cursor-pointer dark:text-indigo-400"><Plus className="h-3.5 w-3.5" />Add item</button>}
            </div>
          ))}
          {sections.length < 20 && <button type="button" id="menu-add-section" onClick={() => setSections([...sections, { name: '', items: [{ name: '', price: '', desc: '', tag: '' }] }])} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 px-3 py-2 text-xs font-bold text-indigo-600 cursor-pointer dark:border-indigo-700 dark:text-indigo-300"><Plus className="h-4 w-4" />Add section</button>}
        </div>
      )}

      {/* GALLERY */}
      {page.kind === 'gallery' && (
        <div className="space-y-3">
          <Field label="Description (optional)"><textarea rows={2} maxLength={1200} className={inputCls} value={page.about} onChange={(e) => set({ about: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {page.gallery.items.map((it, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-900">
                <div className="relative">
                  <img src={it.src} alt={it.caption || `Photo ${i + 1}`} className="h-24 w-full rounded-lg object-cover" />
                  <div className="absolute inset-x-1 top-1 flex justify-between">
                    <span className="flex gap-1">
                      <button type="button" aria-label="Move left" onClick={() => onChange({ ...page, gallery: { items: move(page.gallery.items, i, -1) } })} className="rounded bg-white/90 p-1 text-slate-700 cursor-pointer"><ArrowLeft className="h-3 w-3" /></button>
                      <button type="button" aria-label="Move right" onClick={() => onChange({ ...page, gallery: { items: move(page.gallery.items, i, 1) } })} className="rounded bg-white/90 p-1 text-slate-700 cursor-pointer"><ArrowRight className="h-3 w-3" /></button>
                    </span>
                    <button type="button" aria-label="Remove photo" onClick={() => onChange({ ...page, gallery: { items: page.gallery.items.filter((_, j) => j !== i) } })} className="rounded bg-white/90 p-1 text-rose-600 cursor-pointer"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
                <input className="mt-1.5 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Caption" maxLength={120} value={it.caption} onChange={(e) => onChange({ ...page, gallery: { items: page.gallery.items.map((x, j) => j === i ? { ...x, caption: e.target.value } : x) } })} />
              </div>
            ))}
            {page.gallery.items.length < 12 && (
              <label className="flex min-h-[8.5rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 text-xs font-semibold text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-400">
                <UploadCloud className="h-5 w-5" /> Add photos
                <span className="text-[10px] font-normal">{page.gallery.items.length}/12</span>
                <input id="gallery-input" type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                  const files = Array.from(e.target.files || []).slice(0, 12 - page.gallery.items.length);
                  e.target.value = '';
                  const added: { src: string; caption: string }[] = [];
                  for (const f of files) { try { added.push({ src: await compressImage(f, 1000, 0.7), caption: '' }); } catch { setImgErr('One of the files was not a usable image.'); } }
                  if (added.length) onChange({ ...page, gallery: { items: [...page.gallery.items, ...added] } });
                }} />
              </label>
            )}
          </div>
        </div>
      )}

      {/* publish */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 space-y-2.5 dark:border-indigo-900/60 dark:bg-indigo-950/30">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-100">Publish your page</span>
          <span className={`${sizeKB > 800 ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400'}`}>{sizeKB} KB / 900 KB</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">The QR code always opens <span className="font-mono break-all">{pageUrl(page.id)}</span>. Publish to make it live, and publish again after any change.</p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" id="page-publish" onClick={publish} disabled={busy || !pageHasContent(page)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
            <CloudUpload className="h-4 w-4" />
            <span>{busy ? 'Publishing…' : !user ? 'Sign in to publish' : page.publishedAt ? (dirty ? 'Update page' : 'Published') : 'Publish page'}</span>
          </button>
          {page.publishedAt && (
            <>
              <a href={`/p/${page.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><ExternalLink className="h-3.5 w-3.5" />Open</a>
              <button type="button" onClick={() => navigator.clipboard?.writeText(pageUrl(page.id))} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><Copy className="h-3.5 w-3.5" />Copy link</button>
            </>
          )}
        </div>
        {!pageHasContent(page) && <p className="text-[11px] text-amber-700 dark:text-amber-300">Add a title and at least one {page.kind === 'card' ? 'contact detail' : page.kind === 'menu' ? 'menu item' : 'photo'} to publish.</p>}
        {msg && <p className={`flex items-start gap-1.5 text-xs ${msg.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'}`}>{msg.ok ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}<span>{msg.text}</span></p>}
      </div>
    </div>
  );
};
