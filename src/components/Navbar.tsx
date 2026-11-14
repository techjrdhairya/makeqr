import React, { useState, useRef, useEffect } from 'react';
import { 
  QrCode, 
  Sparkles, 
  History, 
  Camera, 
  Download, 
  Cloud, 
  LogOut, 
  CheckCircle2, 
  User, 
  ChevronDown,
  Home,
  Plus,
  Grid,
  FolderHeart,
  Coins,
  ShieldCheck,
  MoreHorizontal,
  Barcode,
  LifeBuoy
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { MakeQRLogo } from './MakeQRLogo';
import { useAuth } from '../context/AuthContext';
import { useCoins } from '../context/CoinsContext';

export type AppViewMode = 'home' | 'choose-type' | 'studio' | 'my-codes' | 'file-view' | 'expired' | 'barcode' | 'pricing' | 'support' | 'page-view';

interface NavbarProps {
  currentView: AppViewMode;
  onNavigateHome: () => void;
  onNavigateChooseType: () => void;
  onNavigateStudio: () => void;
  onNavigateMyCodes: () => void;
  onNavigateView?: (v: 'barcode' | 'pricing' | 'support') => void;
  onStartNew: () => void;
  onOpenTemplates: () => void;
  onOpenHistory: () => void;
  onOpenScanner: () => void;
  onQuickExport: () => void;
  onOpenAIChat?: (role?: 'consultant' | 'places' | 'fast' | 'architect') => void;
  historyCount: number;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigateHome,
  onNavigateChooseType,
  onNavigateStudio,
  onNavigateMyCodes,
  onNavigateView,
  onStartNew,
  onOpenTemplates,
  onOpenHistory,
  onOpenScanner,
  onQuickExport,
  onOpenAIChat,
  historyCount,
  isDark,
  onToggleTheme,
}) => {
  const { user, openAuthModal, signOut } = useAuth();
  const { coins, guestTrialAvailable, openCoinsModal } = useCoins();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 transition-colors">
      <div className="mx-auto flex h-12 sm:h-14 lg:h-16 max-w-7xl items-center justify-between px-2.5 min-[380px]:px-3 sm:px-6 lg:px-8 gap-1.5 sm:gap-2">
        {/* Brand Title (Clickable to return Home) */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 sm:gap-2 text-left group cursor-pointer focus:outline-none shrink-0"
          title="Return to MakeQR Homepage"
        >
          <MakeQRLogo className="h-9 w-9 min-[380px]:h-10 min-[380px]:w-10 sm:h-11 sm:w-11 lg:h-10 lg:w-10 xl:h-11 xl:w-11 shrink-0 group-hover:scale-105 transition-transform" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black tracking-tight text-slate-900 dark:text-white text-base min-[380px]:text-lg sm:text-xl lg:text-lg xl:text-xl group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                MakeQR
              </span>
              <span className="hidden min-[400px]:inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-700/10 dark:ring-indigo-400/20">
                PRO
              </span>
            </div>
            <p className="hidden 2xl:block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Branded QR codes &amp; cloud storage
            </p>
          </div>
        </button>

        {/* Center: Segmented Navigation Control */}
        <nav className="hidden lg:flex items-center p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
          <button
            type="button"
            onClick={onNavigateChooseType}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              (currentView === 'choose-type' || currentView === 'studio')
                ? 'bg-white text-purple-700 shadow-sm dark:bg-slate-900 dark:text-purple-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Create QR</span>
          </button>

          <button
            type="button"
            onClick={onNavigateMyCodes}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentView === 'my-codes'
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FolderHeart className="h-3.5 w-3.5 text-indigo-500" />
            <span>My QRs</span>
            {historyCount > 0 && (
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.2 text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300">
                {historyCount}
              </span>
            )}
          </button>

          {onNavigateView && (
            <>
              <span className="mx-1 hidden h-4 w-px bg-slate-300 dark:bg-slate-600 2xl:block" />
              {([
                ['barcode', 'Barcode'],
                ['pricing', 'Pricing'],
                ['support', 'Help'],
              ] as const).map(([id, text]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onNavigateView(id)}
                  className={`hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    currentView === id
                      ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-300'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {text}
                </button>
              ))}

              <div className="relative 2xl:hidden" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen((o) => !o)}
                  aria-expanded={isMoreOpen}
                  aria-label="More pages"
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    ['barcode', 'pricing', 'support'].includes(currentView)
                      ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-300'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <MoreHorizontal className="h-4 w-4" /> More
                </button>
                {isMoreOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                    {([
                      ['barcode', 'Barcode generator', Barcode],
                      ['pricing', 'Pricing & coins', Coins],
                      ['support', 'Help & FAQ', LifeBuoy],
                    ] as const).map(([id, text, Icon]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => { setIsMoreOpen(false); onNavigateView(id); }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <Icon className="h-4 w-4 text-indigo-500" /> {text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </nav>

        {/* Right Section: Actions & Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick "+ New" Action */}
          <button
            type="button"
            id="nav-btn-new"
            onClick={onStartNew}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-white hover:from-indigo-700 hover:to-violet-700 shadow-sm shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
            title="Create a new QR code"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden md:inline lg:hidden 2xl:inline">New QR</span>
          </button>

          {/* Utility Tools Group */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            {/* Templates Preset */}
            <button
              type="button"
              onClick={onOpenTemplates}
              className="hidden lg:flex p-2 rounded-lg text-slate-600 hover:text-amber-500 hover:bg-white dark:text-slate-300 dark:hover:text-amber-400 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Templates" aria-label="Templates"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
            </button>

            {/* Test Scanner - desktop only since mobile has center bottom nav scanner */}
            <button
              type="button"
              onClick={onOpenScanner}
              className="hidden lg:flex p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white dark:text-slate-300 dark:hover:text-indigo-400 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Scan a QR code" aria-label="Scan a QR code"
            >
              <Camera className="h-4 w-4" />
            </button>

            {/* History Drawer - desktop only since mobile has My QRs in bottom nav */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="hidden lg:flex relative p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white dark:text-slate-300 dark:hover:text-indigo-400 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="My saved QR codes" aria-label="My saved QR codes"
            >
              <History className="h-4 w-4" />
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-extrabold text-white ring-2 ring-white dark:ring-slate-900">
                  {historyCount > 9 ? '9+' : historyCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

            {/* AI Assistant & Maps Grounding Button */}
            {onOpenAIChat && (
              <button
                type="button"
                onClick={() => onOpenAIChat('consultant')}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 hover:border-indigo-300 dark:hover:bg-indigo-900/60 font-bold text-xs shadow-2xs transition-all cursor-pointer group"
                title="AI Assistant & Maps" aria-label="AI Assistant and Maps"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
                <span className="hidden 2xl:inline font-extrabold">AI &amp; Maps</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              </button>
            )}

          </div>

          {/* Coins & Rewards Pill Button */}
          <button
            type="button"
            onClick={() => openCoinsModal()}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-900 dark:border-amber-700/60 dark:bg-gradient-to-r dark:from-amber-950/40 dark:to-amber-900/30 dark:text-amber-300 font-extrabold text-xs shadow-2xs hover:shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
            title="MakeQR Coins & Rewards"
          >
            <div className="h-4 w-4 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 shadow-2xs group-hover:rotate-12 transition-transform shrink-0">
              <Coins className="h-2.5 w-2.5" />
            </div>
            <span className="font-black">{coins}</span>
            {guestTrialAvailable && (
              <span className="hidden 2xl:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-500 text-white shadow-2xs">
                <Sparkles className="h-2.5 w-2.5" /> Free Pass
              </span>
            )}
          </button>

          {/* Cloud Auth / User Profile Pill */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                title="Manage cloud account"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-6 w-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs dark:bg-indigo-950 dark:text-indigo-300">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden 2xl:inline max-w-[85px] truncate font-semibold">
                  {user.displayName?.split(' ')[0] || 'Account'}
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user.displayName || 'MakeQR Creator'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Cloud Sync Active</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openCoinsModal();
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-amber-500" />
                        <span>Coins &amp; Rewards</span>
                      </div>
                      <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                        {coins} 🪙
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigateMyCodes();
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FolderHeart className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span>My Saved QR Codes</span>
                      </div>
                      <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
                        {historyCount}
                      </span>
                    </button>

                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 sm:py-2 text-xs font-bold text-white shadow-sm shadow-indigo-600/25 hover:from-indigo-700 hover:to-violet-700 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              title="Sign in to save your QR codes to the cloud"
              aria-label="Sign in"
            >
              <User className="h-3.5 w-3.5" />
              <span>Sign in</span>
            </button>
          )}

          {/* Quick Download Button */}
          <button
            type="button"
            onClick={onQuickExport}
            className="hidden lg:inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 px-3 py-2 text-xs font-bold text-white shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Download QR code"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};
