import React from 'react';
import { Mail, LifeBuoy } from 'lucide-react';
import { MakeQRLogo } from './MakeQRLogo';

interface FooterProps {
  onNavigate?: (v: 'home' | 'studio' | 'choose-type' | 'my-codes' | 'barcode' | 'pricing' | 'support') => void;
  onOpenScanner?: () => void;
}

const SUPPORT_EMAIL = 'techjr.dhairya@gmail.com';

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => (
  <footer
    id="site-footer"
    className="mt-12 w-full border-t border-slate-200/80 bg-white/95 dark:border-slate-800/80 dark:bg-slate-900/95 pb-24 lg:pb-6"
  >
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 overflow-hidden rounded-lg shrink-0">
          <MakeQRLogo className="h-full w-full" />
        </div>
        <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">MakeQR</span>
      </div>

      <div id="footer-support" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <LifeBuoy className="h-3.5 w-3.5" /> Support
        </span>
        <button
          type="button"
          onClick={() => onNavigate?.('support')}
          className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 cursor-pointer"
        >
          Help &amp; FAQ
        </button>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300"
        >
          <Mail className="h-3.5 w-3.5" />
          <span className="break-all">{SUPPORT_EMAIL}</span>
        </a>
      </div>
    </div>
  </footer>
);
