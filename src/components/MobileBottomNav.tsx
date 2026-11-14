import React, { useState } from 'react';
import { 
  QrCode, 
  Grid, 
  Camera, 
  FolderHeart, 
  Home,
  MoreHorizontal,
  Barcode,
  Coins,
  LifeBuoy,
  Sparkles,
  Wand2,
  Moon,
  Sun
} from 'lucide-react';
import { AppViewMode } from './Navbar';

interface MobileBottomNavProps {
  currentView: AppViewMode;
  onNavigateHome: () => void;
  onNavigateChooseType: () => void;
  onNavigateStudio: () => void;
  onNavigateMyCodes: () => void;
  onOpenScanner: () => void;
  onNavigateView: (v: 'barcode' | 'pricing' | 'support') => void;
  onOpenTemplates?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onOpenAIChat?: () => void;
  historyCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigateHome,
  onNavigateChooseType,
  onNavigateStudio,
  onNavigateMyCodes,
  onOpenScanner,
  onNavigateView,
  onOpenTemplates,
  onOpenAIChat,
  isDark,
  onToggleTheme,
  historyCount,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = ['home', 'barcode', 'pricing', 'support'].includes(currentView);
  const go = (fn: () => void) => () => { setMoreOpen(false); fn(); };
  return (
    <div 
      id="mobile-app-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-lg px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-lg shadow-slate-900/10 dark:border-slate-800/90 dark:bg-slate-900/95 transition-colors"
    >
      <div className="mx-auto flex max-w-md items-center justify-between">
        {/* Home */}
        <button
          type="button"
          onClick={onNavigateHome}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer ${
            currentView === 'home'
              ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${
            currentView === 'home'
              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}>
            <Home className="h-4 w-4" />
          </div>
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* Content Types */}
        <button
          type="button"
          onClick={onNavigateChooseType}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer ${
            (currentView === 'choose-type' || currentView === 'studio')
              ? 'text-purple-600 dark:text-purple-400 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${
            (currentView === 'choose-type' || currentView === 'studio')
              ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 ring-2 ring-purple-500/20'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}>
            <Grid className="h-4 w-4" />
          </div>
          <span className="text-[10px] tracking-tight">Create</span>
        </button>

        {/* Center Scanner Action */}
        <div className="flex flex-1 flex-col items-center justify-center -mt-3">
          <button
            type="button"
            onClick={onOpenScanner}
            className="group flex flex-col items-center cursor-pointer"
            title="Scan QR Code"
            aria-label="Scan QR Code"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white shadow-md shadow-indigo-600/35 ring-4 ring-white dark:ring-slate-900 group-active:scale-95 transition-all">
              <Camera className="h-5 w-5" />
            </span>
            <span className="mt-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">Scan</span>
          </button>
        </div>

        {/* My QRs Library */}
        <button
          type="button"
          onClick={onNavigateMyCodes}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer relative ${
            currentView === 'my-codes'
              ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all relative ${
            currentView === 'my-codes'
              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}>
            <FolderHeart className="h-4 w-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-900">
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">My QRs</span>
        </button>

        {/* More */}
        <div className="relative flex flex-1 flex-col items-center justify-center">
          {moreOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
              <div className="absolute bottom-full right-0 z-50 mb-3 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                {[
                  { label: 'Home', icon: Home, fn: onNavigateHome },
                  ...(onOpenTemplates ? [{ label: 'Templates', icon: Sparkles, fn: onOpenTemplates }] : []),
                  ...(onOpenAIChat ? [{ label: 'AI assistant', icon: Wand2, fn: onOpenAIChat }] : []),
                  { label: 'Barcode generator', icon: Barcode, fn: () => onNavigateView('barcode') },
                  { label: 'Pricing & coins', icon: Coins, fn: () => onNavigateView('pricing') },
                  { label: 'Help & FAQ', icon: LifeBuoy, fn: () => onNavigateView('support') },
                  ...(onToggleTheme ? [{ label: isDark ? 'Light mode' : 'Dark mode', icon: isDark ? Sun : Moon, fn: onToggleTheme }] : []),
                ].map(({ label, icon: Icon, fn }) => (
                  <button key={label} type="button" onClick={go(fn)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer">
                    <Icon className="h-4 w-4 text-indigo-500" /> {label}
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            className={`flex w-full flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer ${
              moreActive ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${moreActive ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-400/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <MoreHorizontal className="h-4 w-4" />
            </div>
            <span className="text-[10px] tracking-tight">More</span>
          </button>
        </div>
      </div>
    </div>
  );
};
