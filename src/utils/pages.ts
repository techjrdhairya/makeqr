/** Hosted pages: business card, restaurant menu and photo gallery that stay editable after printing. */

export type PageKind = 'card' | 'menu' | 'gallery';

export interface PageLink { label: string; url: string }
export interface MenuItem { name: string; price: string; desc: string; tag: string }
export interface MenuSection { name: string; items: MenuItem[] }
export interface GalleryItem { src: string; caption: string }

export interface PageData {
  id: string;
  kind: PageKind;
  title: string;
  subtitle: string;
  about: string;
  accent: string;
  theme: 'light' | 'dark';
  cover: string;
  logo: string;
  card: {
    name: string; role: string; company: string; phone: string; whatsapp: string;
    email: string; website: string; address: string; links: PageLink[];
  };
  menu: { currency: string; note: string; sections: MenuSection[] };
  gallery: { items: GalleryItem[] };
  publishedAt?: number;
}

export const PAGE_KINDS: Record<PageKind, { title: string; short: string; frameTitle: string; description: string }> = {
  card: { title: 'Business Card Page', short: 'Business card', frameTitle: 'SAVE MY CONTACT', description: 'A mobile page with your details, one-tap call, WhatsApp, email and a Save contact button.' },
  menu: { title: 'Restaurant Menu', short: 'Menu', frameTitle: 'SCAN FOR MENU', description: 'A menu with sections, prices and tags. Change a price any time without reprinting.' },
  gallery: { title: 'Photo Gallery', short: 'Gallery', frameTitle: 'VIEW PHOTOS', description: 'A photo gallery with captions. Add or swap photos later and the QR stays the same.' },
};

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export function newPageId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function createPage(kind: PageKind = 'card'): PageData {
  return {
    id: newPageId(),
    kind,
    title: '',
    subtitle: '',
    about: '',
    accent: '#4f46e5',
    theme: 'light',
    cover: '',
    logo: '',
    card: { name: '', role: '', company: '', phone: '', whatsapp: '', email: '', website: '', address: '', links: [] },
    menu: {
      currency: '₹',
      note: '',
      sections: kind === 'menu' ? [{ name: 'Starters', items: [{ name: '', price: '', desc: '', tag: '' }] }] : [],
    },
    gallery: { items: [] },
  };
}

export const pageUrl = (id: string) => `${window.location.origin}/p/${id}`;

export function pageHasContent(p?: PageData | null): boolean {
  if (!p) return false;
  if (p.kind === 'card') return Boolean((p.card.name || p.title).trim() && (p.card.phone || p.card.email || p.card.whatsapp || p.card.website || p.card.links.length));
  if (p.kind === 'menu') return Boolean(p.title.trim() && p.menu.sections.some((s) => s.items.some((i) => i.name.trim())));
  return Boolean(p.title.trim() && p.gallery.items.length);
}

/** Only allow safe link schemes on hosted pages. */
export function safeHref(raw: string, kind: 'web' | 'tel' | 'mail' | 'wa' = 'web'): string | null {
  const v = (raw || '').trim();
  if (!v) return null;
  if (kind === 'tel') { const d = v.replace(/[^\d+]/g, ''); return d ? `tel:${d}` : null; }
  if (kind === 'wa') { const d = v.replace(/\D/g, ''); return d ? `https://wa.me/${d}` : null; }
  if (kind === 'mail') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? `mailto:${v}` : null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch { return null; }
}

/** Resize + compress a photo in the browser so a page stays small. */
export function compressImage(file: File, maxDim: number, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); return reject(new Error('Canvas unavailable')); }
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
}

export async function publishPage(page: PageData): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: page.id, data: page }),
    });
    if (res.ok) return { ok: true };
    const j = await res.json().catch(() => ({}));
    return { ok: false, error: j.error || (res.status === 401 ? 'Please sign in to publish this page.' : 'Could not publish the page.') };
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection and try again.' };
  }
}

/** vCard text for the "Save contact" button. */
export function cardToVcf(p: PageData): string {
  const esc = (s: string) => (s || '').replace(/[\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  const name = p.card.name || p.title || 'Contact';
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${esc(name)}`, `N:${esc(name)};;;;`];
  if (p.card.company) lines.push(`ORG:${esc(p.card.company)}`);
  if (p.card.role) lines.push(`TITLE:${esc(p.card.role)}`);
  if (p.card.phone) lines.push(`TEL;TYPE=CELL:${p.card.phone.replace(/[^\d+]/g, '')}`);
  if (p.card.email) lines.push(`EMAIL:${esc(p.card.email)}`);
  const site = safeHref(p.card.website);
  if (site) lines.push(`URL:${site}`);
  if (p.card.address) lines.push(`ADR;TYPE=WORK:;;${esc(p.card.address)};;;;`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}
