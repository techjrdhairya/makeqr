import React from 'react';
import { 
  Plus, 
  ArrowRight, 
  Sparkles, 
  Globe, 
  FileUp, 
  Wifi, 
  UserCheck, 
  Share2, 
  FileText, 
  Camera, 
  History, 
  ShieldCheck, 
  Palette, 
  Download, 
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { ContentType, QRConfig, SavedQR } from '../types';
import { MakeQRLogo } from './MakeQRLogo';

interface HomePageProps {
  onStartNew: () => void;
  onContinue: () => void;
  onSelectType: (type: ContentType) => void;
  onOpenTemplates: () => void;
  onOpenScanner: () => void;
  onOpenHistory: () => void;
  onLoadItem: (item: SavedQR) => void;
  savedItems: SavedQR[];
  currentConfig: QRConfig;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartNew,
  onContinue,
  onSelectType,
  onOpenTemplates,
  onOpenScanner,
  onOpenHistory,
  onLoadItem,
  savedItems,
  currentConfig,
}) => {
  const contentStarters: Array<{
    type: ContentType;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentBg: string;
    accentText: string;
  }> = [
    {
      type: 'url',
      label: 'Website & Dynamic Link',
      description: 'Redirect to websites, promotions, or live editable dynamic links.',
      icon: Globe,
      accentBg: 'bg-blue-50 dark:bg-blue-950/60',
      accentText: 'text-blue-600 dark:text-blue-400',
    },
    {
      type: 'file',
      label: 'Host File & Video',
      description: 'Upload and host videos, PDFs, or photos with an instant mobile viewer.',
      icon: FileUp,
      accentBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      accentText: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      type: 'wifi',
      label: 'Wi-Fi Network',
      description: 'Allow guests and visitors to connect instantly without typing passwords.',
      icon: Wifi,
      accentBg: 'bg-purple-50 dark:bg-purple-950/60',
      accentText: 'text-purple-600 dark:text-purple-400',
    },
    {
      type: 'vcard',
      label: 'Digital Business Card',
      description: 'Contact card (vCard 3.0) that saves phone, email, and social info directly.',
      icon: UserCheck,
      accentBg: 'bg-amber-50 dark:bg-amber-950/60',
      accentText: 'text-amber-600 dark:text-amber-400',
    },
    {
      type: 'social',
      label: 'Social Bio Landing',
      description: 'Curated multi-link mobile bio page with links and profile branding.',
      icon: Share2,
      accentBg: 'bg-rose-50 dark:bg-rose-950/60',
      accentText: 'text-rose-600 dark:text-rose-400',
    },
    {
      type: 'text',
      label: 'Plain Text & Promo',
      description: 'Embed messages, coupon codes, Wi-Fi credentials, or raw text directly.',
      icon: FileText,
      accentBg: 'bg-slate-100 dark:bg-slate-800',
      accentText: 'text-slate-600 dark:text-slate-300',
    },
  ];

  return (
    <div className="flex-1 w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative border-b border-slate-200/80 bg-linear-to-b from-white via-slate-50 to-slate-100/60 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 dark:border-slate-800/80 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="mx-auto max-w-5xl text-center">
          {/* Logo Showcase with 'make' written inside QR image */}
          <div className="flex justify-center mb-5">
            <div className="p-1 rounded-2xl bg-white dark:bg-slate-850 shadow-md shadow-indigo-500/15 ring-4 ring-indigo-50 dark:ring-indigo-950/60 inline-flex hover:scale-105 transition-transform">
              <MakeQRLogo className="h-24 w-24 sm:h-28 sm:w-28" />
            </div>
          </div>

          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-2xs dark:border-indigo-900/60 dark:bg-indigo-950/60 dark:text-indigo-300 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
            <span>Vector & Dynamic QR Platform</span>
            <span className="text-indigo-300 dark:text-indigo-600">•</span>
            <span className="font-normal text-indigo-600 dark:text-indigo-400">SVG, Print PDF & Cloud Sync</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
            Design Branded, Scannable{' '}
            <span className="bg-linear-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent dark:from-indigo-400 dark:to-indigo-300">
              QR Codes
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Create high-contrast vector QR codes for websites, hosted files, Wi-Fi networks, and contact cards. 
            Customize dot shapes, eye frames, logos, and dynamic redirect links in real time.
          </p>

          {/* Primary Action Buttons: "+ New" and "Continue" */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              id="btn-home-start-new"
              onClick={onStartNew}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>New QR Code</span>
            </button>

            <button
              type="button"
              id="btn-home-continue"
              onClick={onContinue}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-indigo-600 active:scale-[0.98] transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white cursor-pointer"
            >
              <span>Continue to Studio</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Secondary Quick Action Links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={onOpenTemplates}
              className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Browse 20+ Designer Templates</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={onOpenScanner}
              className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Test Scan Camera / Image</span>
            </button>
            {savedItems.length > 0 && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <History className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{savedItems.length} Saved Design{savedItems.length > 1 ? 's' : ''}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        {/* Quick Type Starters Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Start with a Content Type
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Choose what your QR code does, or click <button onClick={onStartNew} className="text-indigo-600 dark:text-indigo-400 font-semibold underline">New</button> to configure from scratch.
              </p>
            </div>
            <button
              type="button"
              onClick={onContinue}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
            >
              <span>Open Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentStarters.map((starter) => {
              const Icon = starter.icon;
              return (
                <button
                  key={starter.type}
                  type="button"
                  id={`starter-${starter.type}`}
                  onClick={() => onSelectType(starter.type)}
                  className="group relative flex flex-col items-start p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-md hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600 transition-all text-left cursor-pointer"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${starter.accentBg} ${starter.accentText} mb-3.5 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition-colors">
                    {starter.label}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {starter.description}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Create code</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Codes Section (if user has saved items) */}
        {savedItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-500" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Recent QR Codes
                </h2>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {savedItems.length}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenHistory}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                View all in History drawer
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Quick + New card */}
              <button
                type="button"
                onClick={onStartNew}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all text-center min-h-[160px] cursor-pointer group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  + New QR Code
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Start fresh design
                </span>
              </button>

              {savedItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onLoadItem(item)}
                  className="group relative flex flex-col p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-md hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {item.previewThumbnail ? (
                      <img
                        src={item.previewThumbnail}
                        alt={item.name}
                        className="h-12 w-12 rounded-lg border border-slate-100 bg-white object-contain p-0.5 shadow-2xs dark:border-slate-800"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <Layers className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.summaryText || item.contentType.toUpperCase()}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <span>Continue Editing</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Highlights Bento Row */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="max-w-2xl">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Built for Professional Scannability & High Precision
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Everything required for retail packaging, business materials, events, and dynamic campaigns.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
                <Globe className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Dynamic Links & Symbols
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Update URLs post-print and claim custom slugs with symbols like <code className="font-mono text-indigo-600 dark:text-indigo-400">/@brand</code>.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Scannability Verification
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Automatic real-time decoding checks ensure your QR code never fails on phone cameras.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-400">
                <Download className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Multi-Format Export
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Download resolution up to 4K PNG, infinite-scale SVG vectors, and printable PDF sticker sheets.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400">
                <Palette className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Curated Design Presets
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Apply pre-configured palettes and eye designs with one click, or generate branded styles with AI.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
