import React, { useEffect, useState } from 'react';
import { Phone, Mail, Globe, MapPin, MessageCircle, UserPlus, ExternalLink, X, QrCode } from 'lucide-react';
import { cardToVcf, safeHref, type PageData } from '../utils/pages';

export const PagePublicView: React.FC<{ pageId: string; onCreateNewQR: () => void }> = ({ pageId, onCreateNewQR }) => {
  const [page, setPage] = useState<PageData | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    setState('loading');
    fetch(`/api/pages/${encodeURIComponent(pageId)}?v=1`)
      .then(async (r) => {
        if (!live) return;
        if (r.status === 404) return setState('missing');
        if (!r.ok) return setState('error');
        setPage(await r.json());
        setState('ok');
      })
      .catch(() => live && setState('error'));
    return () => { live = false; };
  }, [pageId]);

  useEffect(() => { if (page?.title) document.title = page.title; }, [page?.title]);

  if (state === 'loading') return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>;
  if (state !== 'ok' || !page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{state === 'missing' ? 'This page is not published' : 'Could not load this page'}</h1>
        <p className="max-w-sm text-sm text-slate-500">{state === 'missing' ? 'The owner may not have published it yet, or it was removed.' : 'Check your connection and try again.'}</p>
        <button type="button" onClick={onCreateNewQR} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white cursor-pointer">Make your own QR code</button>
      </div>
    );
  }

  const dark = page.theme === 'dark';
  const accent = page.accent || '#4f46e5';
  const bg = dark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';
  const card = dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';
  const c = page.card;

  const saveContact = () => {
    const blob = new Blob([cardToVcf(page)], { type: 'text/vcard' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(c.name || page.title || 'contact').replace(/[^\w-]+/g, '_')}.vcf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const Action: React.FC<{ href: string | null; icon: React.ElementType; label: string; value?: string }> = ({ href, icon: Icon, label, value }) =>
    href ? (
      <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={`flex items-center gap-3 rounded-2xl border p-3.5 ${card}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: accent }}><Icon className="h-5 w-5" /></span>
        <span className="min-w-0"><span className="block text-sm font-bold">{label}</span>{value && <span className={`block truncate text-xs ${muted}`}>{value}</span>}</span>
      </a>
    ) : null;

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="mx-auto max-w-md pb-10">
        <div className="relative h-40 w-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}>
          {page.cover && <img src={page.cover} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="-mt-12 px-4">
          <div className={`relative rounded-3xl border p-5 text-center shadow-sm ${card}`}>
            {page.logo ? (
              <img src={page.logo} alt="" className="mx-auto -mt-14 h-20 w-20 rounded-2xl border-4 border-white object-cover shadow" style={{ borderColor: dark ? '#0f172a' : '#fff' }} />
            ) : null}
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{page.kind === 'card' ? (c.name || page.title) : page.title}</h1>
            {page.kind === 'card' && (c.role || c.company) && <p className="text-sm font-semibold" style={{ color: accent }}>{[c.role, c.company].filter(Boolean).join(' · ')}</p>}
            {page.subtitle && <p className={`mt-1 text-sm ${muted}`}>{page.subtitle}</p>}
            {page.about && <p className={`mt-3 whitespace-pre-line text-sm leading-relaxed ${muted}`}>{page.about}</p>}
          </div>

          {page.kind === 'card' && (
            <div className="mt-4 space-y-2.5">
              <button type="button" onClick={saveContact} className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-extrabold text-white shadow cursor-pointer" style={{ background: accent }}>
                <UserPlus className="h-5 w-5" /> Save contact
              </button>
              <Action href={safeHref(c.phone, 'tel')} icon={Phone} label="Call" value={c.phone} />
              <Action href={safeHref(c.whatsapp, 'wa')} icon={MessageCircle} label="WhatsApp" value={c.whatsapp} />
              <Action href={safeHref(c.email, 'mail')} icon={Mail} label="Email" value={c.email} />
              <Action href={safeHref(c.website)} icon={Globe} label="Website" value={c.website} />
              {c.address && <Action href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}`} icon={MapPin} label="Directions" value={c.address} />}
              {c.links.map((l, i) => <Action key={i} href={safeHref(l.url)} icon={ExternalLink} label={l.label || l.url} />)}
            </div>
          )}

          {page.kind === 'menu' && (
            <div className="mt-4 space-y-4">
              {page.menu.sections.map((s, i) => (
                <section key={i} className={`rounded-2xl border p-4 ${card}`}>
                  {s.name && <h2 className="mb-2 text-base font-extrabold" style={{ color: accent }}>{s.name}</h2>}
                  <ul className={`divide-y ${dark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {s.items.map((it, j) => (
                      <li key={j} className="flex items-start justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-bold">{it.name}{it.tag && <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: accent }}>{it.tag}</span>}</p>
                          {it.desc && <p className={`mt-0.5 text-xs ${muted}`}>{it.desc}</p>}
                        </div>
                        {it.price && <span className="shrink-0 text-sm font-extrabold">{page.menu.currency}{it.price}</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {page.menu.note && <p className={`text-center text-xs ${muted}`}>{page.menu.note}</p>}
            </div>
          )}

          {page.kind === 'gallery' && (
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {page.gallery.items.map((it, i) => (
                <button key={i} type="button" onClick={() => setLightbox(i)} className={`overflow-hidden rounded-2xl border text-left cursor-pointer ${card}`}>
                  <img src={it.src} alt={it.caption || `Photo ${i + 1}`} loading="lazy" className="aspect-square w-full object-cover" />
                  {it.caption && <p className="p-2 text-xs font-medium">{it.caption}</p>}
                </button>
              ))}
            </div>
          )}

          <button type="button" onClick={onCreateNewQR} className={`mx-auto mt-8 flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${muted}`}>
            <QrCode className="h-3.5 w-3.5" /> Made with MakeQR
          </button>
        </div>
      </div>

      {lightbox !== null && page.gallery.items[lightbox] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <button type="button" aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white cursor-pointer"><X className="h-5 w-5" /></button>
          <figure className="max-h-full max-w-full text-center">
            <img src={page.gallery.items[lightbox].src} alt={page.gallery.items[lightbox].caption || ''} className="max-h-[80vh] max-w-full rounded-lg object-contain" />
            {page.gallery.items[lightbox].caption && <figcaption className="mt-2 text-sm text-white">{page.gallery.items[lightbox].caption}</figcaption>}
          </figure>
        </div>
      )}
    </div>
  );
};
