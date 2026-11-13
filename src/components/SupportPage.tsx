import React, { useMemo, useState } from 'react';
import { ChevronDown, Search, Mail, LifeBuoy } from 'lucide-react';

interface Faq { q: string; a: string; cat: 'Basics' | 'Dynamic & files' | 'Design & print' | 'Account & coins' }

const FAQS: Faq[] = [
  { cat: 'Basics', q: 'Is MakeQR really free?', a: 'Yes. Static QR codes, all content types, design tools, scanning and barcodes are free. A few premium tools are unlocked once with coins you earn by using the site.' },
  { cat: 'Basics', q: 'Do my QR codes expire?', a: 'Static codes (URL, text, Wi-Fi, contact and similar) hold the data inside the image, so they work forever. Dynamic and file codes point to a short link, and you can set an expiry on those yourself.' },
  { cat: 'Basics', q: 'What is the difference between static and dynamic QR codes?', a: 'A static code stores your content directly and cannot be edited. A dynamic code stores a short link, so you can change where it points later without reprinting, and see scan analytics.' },
  { cat: 'Basics', q: 'How do I scan a QR code?', a: 'Open the Scanner from the top menu or the bottom bar on mobile. Allow camera access, or upload a picture of a QR code.' },
  { cat: 'Dynamic & files', q: 'Can I change the link after printing?', a: 'Yes, for dynamic codes. Open My QRs, pick the code and edit its destination. The printed code keeps working.' },
  { cat: 'Dynamic & files', q: 'Can I share a PDF, image, audio or video with a QR code?', a: 'Yes. Choose the File type, upload it, and MakeQR creates a landing page for it. Hosting larger media is a coin unlock.' },
  { cat: 'Dynamic & files', q: 'Can I see how many times my code was scanned?', a: 'Yes. Dynamic codes have an analytics view with scan counts and approximate locations.' },
  { cat: 'Design & print', q: 'Which file format should I download?', a: 'Use PNG for screens and documents, SVG for large prints such as posters and signs, and the PDF sheet for printing several codes at once.' },
  { cat: 'Design & print', q: 'Why will my QR code not scan?', a: 'The most common causes are low contrast, a very light foreground colour, a logo that is too large, or printing too small. Use the scannability test in the studio and keep a quiet margin around the code.' },
  { cat: 'Design & print', q: 'How big should I print a QR code?', a: 'At least 2 cm × 2 cm (about 0.8 in) for close-range scanning. Add roughly 1 cm of size for every 10 cm of scanning distance.' },
  { cat: 'Design & print', q: 'What barcode formats are supported?', a: 'Code 128, Code 39, EAN-13, EAN-8, UPC-A, ITF-14, Interleaved 2 of 5, Codabar, MSI and Pharmacode.' },
  { cat: 'Account & coins', q: 'Do I need an account?', a: 'No, but signing in saves your QR codes, coins and unlocks to the cloud so you can use them on any device.' },
  { cat: 'Account & coins', q: 'How do I earn coins?', a: 'You earn 10 coins for each new QR code you create. See the Pricing page for what coins unlock.' },
];

const CATS = ['All', 'Basics', 'Dynamic & files', 'Design & print', 'Account & coins'] as const;
const OWNER_EMAIL = 'techjr.dhairya@gmail.com';

export const SupportPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<(typeof CATS)[number]>('All');
  const [open, setOpen] = useState<number | null>(0);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((f) => (cat === 'All' || f.cat === cat) && (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)));
  }, [query, cat]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 pb-28 lg:pb-12">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"><LifeBuoy className="h-6 w-6" /></div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">Help &amp; FAQ</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Quick answers about making, printing and managing QR codes.</p>
      </header>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(null); }}
          placeholder="Search questions…"
          aria-label="Search questions"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => { setCat(c); setOpen(null); }}
            className={`rounded-full border px-3 py-1 text-xs font-bold cursor-pointer transition-colors ${
              cat === c ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {list.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">No matches. Try different words, or email us below.</p>}
        {list.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left cursor-pointer"
              >
                <span className="text-sm font-bold text-slate-900 dark:text-white">{f.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && <p className="px-4 pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.a}</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200/70 bg-indigo-50/60 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/30">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Still stuck?</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">Send us a message and we will get back to you.</p>
        </div>
        <a
          href={`mailto:${OWNER_EMAIL}?subject=MakeQR%20support`}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
        >
          <Mail className="h-4 w-4" /> Email support
        </a>
      </div>
    </main>
  );
};
