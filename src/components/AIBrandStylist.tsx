import React, { useState } from 'react';
import { Sparkles, Wand2, Loader2, Check, RefreshCw, Layers, Coins, Lock } from 'lucide-react';
import { QRConfig, GradientType } from '../types';
import { useCoins } from '../context/CoinsContext';

interface AIBrandStylistProps {
  config: QRConfig;
  onApplyAITheme: (suggested: Partial<QRConfig>) => void;
}

export const AIBrandStylist: React.FC<AIBrandStylistProps> = ({ config, onApplyAITheme }) => {
  const { isFeatureUnlocked, openCoinsModal, guestTrialAvailable } = useCoins();
  const isUnlocked = isFeatureUnlocked('ai-brand-stylist');

  const [brandInput, setBrandInput] = useState('');
  const [industry, setIndustry] = useState('');
  const [vibe, setVibe] = useState('modern');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSuggestion, setLastSuggestion] = useState<{
    themeName: string;
    explanation: string;
    frame: any;
    colors: any;
    shapes: any;
  } | null>(null);

  const presets = [
    { label: 'Artisan Coffee Roasters', industry: 'Specialty Coffee', vibe: 'warm artisanal' },
    { label: 'Fintech & Crypto SaaS', industry: 'Finance / Blockchain', vibe: 'sleek tech' },
    { label: 'Boutique Design Studio', industry: 'Creative Agency', vibe: 'minimalist brutalist' },
    { label: 'Botanical & Wellness', industry: 'Health & Spa', vibe: 'natural calming' },
    { label: 'Nightclub & Electronic DJ', industry: 'Nightlife / Events', vibe: 'vibrant neon' },
  ];

  const handleGenerate = async (query?: string, selectedIndustry?: string, selectedVibe?: string) => {
    if (!isUnlocked) {
      openCoinsModal({
        id: 'ai-brand-stylist',
        name: 'AI Brand Stylist & Theme Studio',
        cost: 15,
        description: 'Uses Gemini AI to intelligently analyze your brand, vibe, and colors to craft bespoke QR themes.',
      });
      return;
    }

    const brand = query !== undefined ? query : brandInput;
    const ind = selectedIndustry || industry;
    const vb = selectedVibe || vibe;

    if (!brand.trim()) {
      setError('Please enter a brand, event, or concept name.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/brand-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brand,
          industry: ind || 'General',
          vibe: vb,
          contextUrl: config.url || '',
        }),
      });

      if (!res.ok) {
        throw new Error('AI stylist service temporarily unavailable');
      }

      const data = await res.json();
      setLastSuggestion(data);

      // Immediately apply to QR code
      onApplyAITheme({
        frame: {
          ...config.frame,
          ...data.frame,
        },
        colors: {
          ...config.colors,
          ...data.colors,
        },
        shapes: {
          ...config.shapes,
          ...data.shapes,
        },
      });
    } catch (err: any) {
      console.warn('AI fallback used:', err);
      // Client-side fallback styling based on vibe
      applyLocalFallback(brand, vb);
    } finally {
      setLoading(false);
    }
  };

  const applyLocalFallback = (brand: string, vb: string) => {
    let fallbackTheme = {
      themeName: `${brand} Signature`,
      explanation: 'Crafted high-contrast palette with ergonomic corner styling.',
      frame: {
        style: 'polaroid' as const,
        title: `SCAN FOR ${brand.toUpperCase()}`,
        subtitle: 'Point camera to view & connect',
        frameColor: '#4f46e5',
        textColor: '#1e1b4b',
        badgeColor: '#4f46e5',
        badgeTextColor: '#ffffff',
      },
      colors: {
        foregroundType: 'linear' as GradientType,
        fgColor1: '#4338ca',
        fgColor2: '#6366f1',
        bgColor: '#ffffff',
        isTransparentBg: false,
        gradientAngle: 45,
        customEyeColors: true,
        eyeOuterColor: '#312e81',
        eyeInnerColor: '#4f46e5',
      },
      shapes: {
        dotType: 'rounded' as const,
        cornerSquareType: 'extra-rounded' as const,
        cornerDotType: 'dot' as const,
      },
    };

    if (vb.includes('warm') || vb.includes('coffee')) {
      fallbackTheme.colors = {
        foregroundType: 'linear' as GradientType,
        fgColor1: '#78350f',
        fgColor2: '#b45309',
        bgColor: '#fffbeb',
        isTransparentBg: false,
        gradientAngle: 45,
        customEyeColors: true,
        eyeOuterColor: '#451a03',
        eyeInnerColor: '#92400e',
      };
      fallbackTheme.frame.frameColor = '#78350f';
      fallbackTheme.frame.title = `TASTE & EXPLORE`;
    } else if (vb.includes('neon') || vb.includes('night')) {
      fallbackTheme.colors = {
        foregroundType: 'radial' as GradientType,
        fgColor1: '#06b6d4',
        fgColor2: '#3b82f6',
        bgColor: '#0f172a',
        isTransparentBg: false,
        gradientAngle: 45,
        customEyeColors: true,
        eyeOuterColor: '#38bdf8',
        eyeInnerColor: '#0ea5e9',
      };
      fallbackTheme.frame.frameColor = '#0f172a';
      fallbackTheme.frame.title = `EXPERIENCE VIP`;
    }

    setLastSuggestion(fallbackTheme);
    onApplyAITheme(fallbackTheme);
  };

  return (
    <div className="rounded-2xl border border-indigo-200/80 bg-linear-to-br from-indigo-50/70 via-purple-50/40 to-white p-4 dark:border-indigo-900/60 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Gemini AI Brand Stylist
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Auto-generate bespoke palettes, titles, and shapes for your brand
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isUnlocked ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
              <Check className="h-3 w-3" /> Unlocked (PRO)
            </span>
          ) : (
            <button
              type="button"
              onClick={() => openCoinsModal({
                id: 'ai-brand-stylist',
                name: 'AI Brand Stylist & Theme Studio',
                cost: 15,
                description: 'Uses Gemini AI to intelligently analyze your brand, vibe, and colors to craft bespoke QR themes.',
              })}
              className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 text-[10px] font-black text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 hover:bg-amber-200 cursor-pointer transition-colors shadow-2xs"
            >
              <Coins className="h-3 w-3 text-amber-600" /> PRO • 15 🪙
            </button>
          )}
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            Gemini 2.5
          </span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setBrandInput(p.label);
              setIndustry(p.industry);
              setVibe(p.vibe);
              handleGenerate(p.label, p.industry, p.vibe);
            }}
            disabled={loading}
            className="rounded-lg border border-indigo-200/70 bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-all dark:border-indigo-900/50 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={brandInput}
            onChange={(e) => setBrandInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGenerate();
            }}
            placeholder="Describe your brand or event (e.g. Kyoto Matcha Bar, Web3 Summit)..."
            className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-indigo-900 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={() => handleGenerate()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Styling...</span>
            </>
          ) : (
            <>
              <Wand2 className="h-3.5 w-3.5" />
              <span>Generate Design</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </p>
      )}

      {/* Last Generated Result */}
      {lastSuggestion && (
        <div className="mt-3 rounded-xl border border-indigo-100 bg-white/90 p-2.5 dark:border-indigo-900/60 dark:bg-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Applied: {lastSuggestion.themeName}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Frame: &quot;{lastSuggestion.frame.title}&quot;
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {lastSuggestion.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
