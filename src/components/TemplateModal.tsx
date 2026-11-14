import React, { useEffect, useMemo, useState } from 'react';
import { X, Sparkles, ArrowRight, Search } from 'lucide-react';
import { QRConfig } from '../types';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (partialConfig: Partial<QRConfig>) => void;
}

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  previewGradient: string;
  config: Partial<QRConfig>;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: 'startup',
    name: 'Tech Startup & SaaS',
    category: 'Business',
    description: 'Indigo-violet gradient with rounded dots and high-converting "SCAN ME" badge.',
    previewGradient: 'linear-gradient(135deg, #3730a3, #6366f1)',
    config: {
      contentType: 'url',
      url: 'https://github.com/my-startup',
      colors: {
        foregroundType: 'linear',
        fgColor1: '#3730a3',
        fgColor2: '#6366f1',
        gradientAngle: 45,
        bgColor: '#ffffff',
        isTransparentBg: false,
        customEyeColors: true,
        eyeOuterColor: '#312e81',
        eyeInnerColor: '#4f46e5',
      },
      shapes: {
        dotType: 'rounded',
        cornerSquareType: 'extra-rounded',
        cornerDotType: 'dot',
      },
      logo: {
        sourceType: 'builtin',
        builtinId: 'github',
        uploadedUrl: '',
        size: 0.22,
        margin: 4,
        bgShape: 'circle',
        bgColor: '#ffffff',
        hideBackgroundDots: true,
      },
      frame: {
        style: 'bottom-banner',
        title: 'SCAN ME',
        subtitle: 'Explore our open source repository',
        frameColor: '#312e81',
        textColor: '#ffffff',
        badgeColor: '#4f46e5',
      },
      errorCorrectionLevel: 'H',
    },
  },
  {
    id: 'cafe',
    name: 'Artisan Cafe Wi-Fi',
    category: 'Hospitality',
    description: 'Warm mocha tones, coffee icon, and "FREE WI-FI" banner for tabletop tents.',
    previewGradient: 'linear-gradient(135deg, #451a03, #b45309)',
    config: {
      contentType: 'wifi',
      wifi: {
        ssid: 'Artisan_Roasters_Guest',
        password: 'BrewHappy2026',
        encryption: 'WPA',
        hidden: false,
      },
      colors: {
        foregroundType: 'linear',
        fgColor1: '#451a03',
        fgColor2: '#92400e',
        gradientAngle: 120,
        bgColor: '#ffffff',
        isTransparentBg: false,
        customEyeColors: true,
        eyeOuterColor: '#78350f',
        eyeInnerColor: '#92400e',
      },
      shapes: {
        dotType: 'classy',
        cornerSquareType: 'extra-rounded',
        cornerDotType: 'dot',
      },
      logo: {
        sourceType: 'builtin',
        builtinId: 'coffee',
        uploadedUrl: '',
        size: 0.22,
        margin: 4,
        bgShape: 'circle',
        bgColor: '#ffffff',
        hideBackgroundDots: true,
      },
      frame: {
        style: 'bottom-banner',
        title: 'FREE WI-FI',
        subtitle: 'Connect instantly without typing password',
        frameColor: '#451a03',
        textColor: '#ffffff',
        badgeColor: '#b45309',
      },
      errorCorrectionLevel: 'H',
    },
  },
  {
    id: 'executive',
    name: 'Executive vCard',
    category: 'Networking',
    description: 'Sophisticated Noir styling with luxury bracket frame and full contact card.',
    previewGradient: 'linear-gradient(135deg, #0f172a, #334155)',
    config: {
      contentType: 'vcard',
      vcard: {
        firstName: 'Sophia',
        lastName: 'Laurent',
        phone: '+1 (555) 482-1920',
        email: 'sophia@laurentstudio.com',
        company: 'Laurent Architectural Studio',
        title: 'Principal Architect',
        website: 'https://laurentstudio.com',
        address: '500 Madison Ave, Floor 18',
        notes: 'Contact for residential & commercial commissions',
      },
      colors: {
        foregroundType: 'none',
        fgColor1: '#0f172a',
        fgColor2: '#0f172a',
        gradientAngle: 0,
        bgColor: '#ffffff',
        isTransparentBg: false,
        customEyeColors: false,
        eyeOuterColor: '#0f172a',
        eyeInnerColor: '#0f172a',
      },
      shapes: {
        dotType: 'classy',
        cornerSquareType: 'square',
        cornerDotType: 'square',
      },
      logo: {
        sourceType: 'builtin',
        builtinId: 'user',
        uploadedUrl: '',
        size: 0.20,
        margin: 3,
        bgShape: 'circle',
        bgColor: '#ffffff',
        hideBackgroundDots: true,
      },
      frame: {
        style: 'minimal-border',
        title: 'SAVE DIGITAL CONTACT',
        subtitle: 'Tap to add directly to your address book',
        frameColor: '#0f172a',
        textColor: '#ffffff',
        badgeColor: '#0f172a',
      },
      errorCorrectionLevel: 'H',
    },
  },
  {
    id: 'menu',
    name: 'Restaurant Tasting Menu',
    category: 'Dining',
    description: 'Emerald organic palette in a clean Polaroid frame for fine dining tables.',
    previewGradient: 'linear-gradient(135deg, #064e3b, #10b981)',
    config: {
      contentType: 'url',
      url: 'https://bistro-menu.example.com',
      colors: {
        foregroundType: 'linear',
        fgColor1: '#064e3b',
        fgColor2: '#059669',
        gradientAngle: 90,
        bgColor: '#ffffff',
        isTransparentBg: false,
        customEyeColors: true,
        eyeOuterColor: '#064e3b',
        eyeInnerColor: '#059669',
      },
      shapes: {
        dotType: 'extra-rounded',
        cornerSquareType: 'extra-rounded',
        cornerDotType: 'dot',
      },
      logo: {
        sourceType: 'none',
        builtinId: 'globe',
        uploadedUrl: '',
        size: 0.20,
        margin: 4,
        bgShape: 'circle',
        bgColor: '#ffffff',
        hideBackgroundDots: true,
      },
      frame: {
        style: 'polaroid',
        title: 'DIGITAL MENU & ORDER',
        subtitle: 'Scan with your camera to view wine list and daily specials',
        frameColor: '#064e3b',
        textColor: '#064e3b',
        badgeColor: '#059669',
      },
      errorCorrectionLevel: 'Q',
    },
  },
  {
    id: 'social',
    name: 'Social Media & Creator',
    category: 'Influencer',
    description: 'Sunset coral gradient with Instagram icon and curved top pill ribbon.',
    previewGradient: 'linear-gradient(135deg, #e11d48, #f97316)',
    config: {
      contentType: 'url',
      url: 'https://instagram.com/studiobrand',
      colors: {
        foregroundType: 'linear',
        fgColor1: '#e11d48',
        fgColor2: '#f97316',
        gradientAngle: 45,
        bgColor: '#ffffff',
        isTransparentBg: false,
        customEyeColors: true,
        eyeOuterColor: '#be123c',
        eyeInnerColor: '#ea580c',
      },
      shapes: {
        dotType: 'dots',
        cornerSquareType: 'extra-rounded',
        cornerDotType: 'dot',
      },
      logo: {
        sourceType: 'builtin',
        builtinId: 'instagram',
        uploadedUrl: '',
        size: 0.22,
        margin: 4,
        bgShape: 'circle',
        bgColor: '#ffffff',
        hideBackgroundDots: true,
      },
      frame: {
        style: 'top-pill',
        title: 'FOLLOW ON INSTAGRAM',
        subtitle: '@studiobrand',
        frameColor: '#e11d48',
        textColor: '#ffffff',
        badgeColor: '#e11d48',
      },
      errorCorrectionLevel: 'H',
    },
  },
  {
    id: 'ticket',
    name: 'Event VIP Pass / Ticket',
    category: 'Entertainment',
    description: 'Royal purple ticket badge tag with star icon and dashed perforation line.',
    previewGradient: 'linear-gradient(135deg, #581c87, #9333ea)',
    config: {
      contentType: 'text',
      text: 'VIP EVENT ACCESS PASS\nAdmit One\nID: TKT-2026-99482\nValid for all stages & lounge',
      colors: {
        foregroundType: 'linear',
        fgColor1: '#581c87',
        fgColor2: '#9333ea',
        gradientAngle: 135,
        bgColor: '#ffffff',
        isTransparentBg: false,
        customEyeColors: true,
        eyeOuterColor: '#3b0764',
        eyeInnerColor: '#7e22ce',
      },
      shapes: {
        dotType: 'rounded',
        cornerSquareType: 'extra-rounded',
        cornerDotType: 'dot',
      },
      logo: {
        sourceType: 'builtin',
        builtinId: 'star',
        uploadedUrl: '',
        size: 0.20,
        margin: 4,
        bgShape: 'circle',
        bgColor: '#ffffff',
        hideBackgroundDots: true,
      },
      frame: {
        style: 'badge-tag',
        title: 'VIP PASS',
        subtitle: 'Present at entrance',
        frameColor: '#581c87',
        textColor: '#ffffff',
        badgeColor: '#7e22ce',
      },
      errorCorrectionLevel: 'H',
    },
  },

  ...[
    mk('realestate', 'Real Estate Open House', 'Real Estate', 'Teal and emerald listing code with a map pin and polaroid frame for yard signs.', 'url', 'https://example.com/listing', '#0f766e', '#10b981', 'map-pin', 'polaroid', 'OPEN HOUSE', 'Scan for photos, price & tour', 'rounded'),
    mk('fitness', 'Fitness & Gym', 'Health', 'High-energy red to orange gradient for class sign-ups and membership offers.', 'url', 'https://example.com/join', '#b91c1c', '#f97316', 'star', 'top-pill', 'JOIN TODAY', 'First class is free', 'extra-rounded'),
    mk('wedding', 'Wedding RSVP', 'Events', 'Soft rose dots and a minimal border. Perfect for invitations and table cards.', 'url', 'https://example.com/rsvp', '#9f1239', '#e11d48', 'calendar', 'minimal-border', 'RSVP HERE', 'Kindly reply by the 1st', 'dots'),
    mk('retail', 'Product Packaging', 'Retail', 'Clean black stamp style for boxes, labels and hang tags.', 'url', 'https://example.com/product', '#0f172a', '#334155', 'shopping', 'stamp', 'SCAN ME', 'Manuals, warranty and care tips', 'square'),
    mk('review', 'Google Review', 'Business', 'Golden star badge that makes leaving a review one scan away.', 'url', 'https://g.page/r/your-business/review', '#b45309', '#f59e0b', 'star', 'bottom-banner', 'LOVED IT? REVIEW US', 'It takes 10 seconds', 'rounded'),
    mk('whatsapp', 'WhatsApp Chat', 'Social', 'Green chat code that opens a WhatsApp conversation instantly.', 'url', 'https://wa.me/15551234567', '#166534', '#22c55e', 'whatsapp', 'bottom-banner', 'CHAT WITH US', 'Reply within minutes', 'extra-rounded'),
    mk('instagram', 'Instagram Follow', 'Social', 'Sunset pink and purple gradient with a badge tag for your profile.', 'url', 'https://instagram.com/yourname', '#9d174d', '#7c3aed', 'instagram', 'badge-tag', 'FOLLOW ME', '@yourname', 'rounded'),
    mk('youtube', 'YouTube Channel', 'Social', 'Bold red pill header that sends viewers to your channel or video.', 'url', 'https://youtube.com/@yourchannel', '#991b1b', '#ef4444', 'youtube', 'top-pill', 'WATCH & SUBSCRIBE', 'New videos every week', 'rounded'),
    mk('upi', 'Pay Me (UPI)', 'Finance', 'Trusted teal code for shop counters. Edit the UPI ID to your own.', 'text', 'upi://pay?pa=yourname@upi&pn=Your%20Name', '#115e59', '#0d9488', 'shopping', 'minimal-border', 'SCAN & PAY', 'Any UPI app', 'rounded'),
    mk('crypto', 'Crypto Donation', 'Finance', 'Gold bitcoin badge for tip jars and donation pages. Replace the address.', 'text', 'bitcoin:YOUR_WALLET_ADDRESS', '#92400e', '#f59e0b', 'bitcoin', 'badge-tag', 'TIP ME', 'Bitcoin accepted', 'dots'),
    mk('salon', 'Salon & Spa', 'Hospitality', 'Rose-gold classy dots for booking links on mirrors and receipts.', 'url', 'https://example.com/book', '#9f1239', '#be7a5b', 'star', 'polaroid', 'BOOK NOW', 'Reserve your appointment', 'classy-rounded'),
    mk('education', 'Class & Course', 'Education', 'Trustworthy blue gradient for syllabi, worksheets and course pages.', 'url', 'https://example.com/course', '#1e3a8a', '#3b82f6', 'globe', 'top-pill', 'START LEARNING', 'Notes, videos and quizzes', 'rounded'),
    mk('homewifi', 'Home Guest Wi-Fi', 'Home', 'Cool slate code that joins guests to your Wi-Fi with one scan.', 'wifi', '', '#1e293b', '#0ea5e9', 'wifi', 'minimal-border', 'GUEST WI-FI', 'Scan to connect', 'rounded'),
    mk('mono', 'Minimal Mono', 'Minimal', 'Pure black on white with sharp squares. No frame, no fuss.', 'url', 'https://example.com', '#000000', '#000000', 'makeqr', 'none', '', '', 'square'),
  ],
];

function mk(
  id: string, name: string, category: string, description: string,
  type: 'url' | 'text' | 'wifi', value: string,
  c1: string, c2: string, logoId: string, frameStyle: any,
  title: string, subtitle: string, dot: any,
): TemplateItem {
  const content: Partial<QRConfig> =
    type === 'url' ? { contentType: 'url', url: value }
    : type === 'text' ? { contentType: 'text', text: value }
    : { contentType: 'wifi', wifi: { ssid: 'My_Home_WiFi', password: 'change-me-123', encryption: 'WPA', hidden: false } };
  return {
    id, name, category, description,
    previewGradient: `linear-gradient(135deg, ${c1}, ${c2})`,
    config: {
      ...content,
      colors: {
        foregroundType: c1 === c2 ? 'none' : 'linear',
        fgColor1: c1, fgColor2: c2, gradientAngle: 45,
        bgColor: '#ffffff', isTransparentBg: false,
        customEyeColors: true, eyeOuterColor: c1, eyeInnerColor: c2,
      } as any,
      shapes: {
        dotType: dot,
        cornerSquareType: dot === 'square' ? 'square' : 'extra-rounded',
        cornerDotType: dot === 'square' ? 'square' : 'dot',
      },
      logo: {
        sourceType: 'builtin', builtinId: logoId, uploadedUrl: '',
        size: 0.2, margin: 4, bgShape: 'circle', bgColor: '#ffffff', hideBackgroundDots: true,
      } as any,
      frame: {
        style: frameStyle, title, subtitle,
        frameColor: c1, textColor: '#ffffff', badgeColor: c2,
      } as any,
      errorCorrectionLevel: 'H',
    },
  };
}

/** Small stylised preview built from the template's own colours and shapes. */
const MiniQR: React.FC<{ tmpl: TemplateItem }> = ({ tmpl }) => {
  const c: any = tmpl.config.colors || {};
  const c1 = c.fgColor1 || '#0f172a';
  const c2 = c.fgColor2 || c1;
  const eyeO = c.customEyeColors ? c.eyeOuterColor || c1 : c1;
  const eyeI = c.customEyeColors ? c.eyeInnerColor || c1 : c1;
  const dot = tmpl.config.shapes?.dotType || 'square';
  const N = 21, cell = 5;
  const gid = `g-${tmpl.id}`;
  const cells = useMemo(() => {
    let seed = tmpl.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 7);
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const out: [number, number][] = [];
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const inEye = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
        const inLogo = x > 7 && x < 13 && y > 7 && y < 13;
        if (!inEye && !inLogo && rnd() > 0.52) out.push([x, y]);
      }
    return out;
  }, [tmpl.id]);
  const r = dot === 'square' || dot === 'classy' ? 0 : dot === 'dots' ? cell / 2 : cell * 0.35;
  const eye = (x: number, y: number) => (
    <g key={`${x}${y}`}>
      <rect x={x * cell + 0.5} y={y * cell + 0.5} width={7 * cell - 1} height={7 * cell - 1} rx={r ? 8 : 0} fill="none" stroke={eyeO} strokeWidth={cell} />
      <rect x={(x + 2) * cell} y={(y + 2) * cell} width={3 * cell} height={3 * cell} rx={r ? 7 : 0} fill={eyeI} />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${N * cell} ${N * cell}`} className="h-24 w-24" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      <rect width={N * cell} height={N * cell} fill="#fff" />
      <g fill={`url(#${gid})`}>
        {cells.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x * cell + 0.3} y={y * cell + 0.3} width={cell - 0.6} height={cell - 0.6} rx={r} />
        ))}
      </g>
      {eye(0, 0)}{eye(14, 0)}{eye(0, 14)}
      <circle cx={(N * cell) / 2} cy={(N * cell) / 2} r={cell * 2.6} fill="#fff" />
      <circle cx={(N * cell) / 2} cy={(N * cell) / 2} r={cell * 1.7} fill={`url(#${gid})`} />
    </svg>
  );
};

export const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, onApplyTemplate }) => {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(TEMPLATES.map((t) => t.category)))], []);
  const list = useMemo(() => {
    const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const q = norm(query);
    return TEMPLATES.filter(
      (t) => (cat === 'All' || t.category === cat) && (!q || norm(`${t.name} ${t.category} ${t.description}`).includes(q)),
    );
  }, [query, cat]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Brand templates"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 pb-4 pt-5 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Templates</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{TEMPLATES.length} ready-made designs. Pick one, then swap in your own link.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates…"
                aria-label="Search templates"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                    cat === c ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-5">
          {list.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">No templates match. Try another word or category.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => { onApplyTemplate(tmpl.config); onClose(); }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-indigo-500 cursor-pointer"
                >
                  <div className="relative flex h-36 items-center justify-center" style={{ background: tmpl.previewGradient }}>
                    <div className="rounded-xl bg-white p-2 shadow-lg">
                      <MiniQR tmpl={tmpl} />
                      {tmpl.config.frame?.title && (
                        <div className="-mb-0.5 mt-1.5 truncate rounded-md px-2 py-0.5 text-center text-[9px] font-extrabold tracking-wide text-white" style={{ background: tmpl.config.frame.frameColor }}>
                          {tmpl.config.frame.title}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <span className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{tmpl.category}</span>
                    <h4 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">{tmpl.name}</h4>
                    <p className="mt-1 line-clamp-2 flex-1 text-xs text-slate-500 dark:text-slate-400">{tmpl.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Use this template <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
