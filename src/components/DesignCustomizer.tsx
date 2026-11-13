import React, { useState } from 'react';
import { 
  Palette, 
  Smile, 
  Frame, 
  Grid3X3, 
  Upload, 
  Trash2, 
  Check, 
  ShieldCheck,
  Coins,
  Lock,
} from 'lucide-react';
import { 
  QRConfig, 
  DotType, 
  CornerSquareType, 
  CornerDotType, 
  FrameStyle, 
  GradientType 
} from '../types';
import { BUILTIN_LOGOS, COLOR_PRESETS } from '../utils/qr-constants';
import { useCoins } from '../context/CoinsContext';

const AIBrandStylist = React.lazy(() => import('./AIBrandStylist').then(m => ({ default: m.AIBrandStylist })));

interface DesignCustomizerProps {
  config: QRConfig;
  onChange: (updater: Partial<QRConfig>) => void;
}

type TabType = 'frames' | 'colors' | 'logos' | 'shapes';

export const DesignCustomizer: React.FC<DesignCustomizerProps> = ({ config, onChange }) => {
  const [activeTab, setActiveTab] = useState<TabType>('frames');
  const { isFeatureUnlocked, openCoinsModal } = useCoins();
  const isFramesUnlocked = isFeatureUnlocked('premium-frames');

  // Handle logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onChange({
        logo: {
          ...config.logo,
          sourceType: 'upload',
          uploadedUrl: url,
        },
        errorCorrectionLevel: 'H', // automatically bump error correction for logos
      });
    };
    reader.readAsDataURL(file);
  };

  const clearLogo = () => {
    onChange({
      logo: {
        ...config.logo,
        sourceType: 'none',
        uploadedUrl: '',
      },
    });
  };

  // Color preset applicator
  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    onChange({
      colors: {
        ...config.colors,
        foregroundType: preset.fgType,
        fgColor1: preset.fgColor1,
        fgColor2: preset.fgColor2,
        bgColor: preset.bgColor,
        isTransparentBg: false,
        customEyeColors: Boolean(preset.eyeOuter),
        eyeOuterColor: preset.eyeOuter || preset.fgColor1,
        eyeInnerColor: preset.eyeInner || preset.fgColor1,
      },
      frame: {
        ...config.frame,
        frameColor: preset.badgeColor || preset.fgColor1,
      },
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900 transition-colors">
      {/* Tab Navigation Header */}
      <div className="flex border-b border-slate-200/80 bg-slate-50/50 p-1 sm:p-1.5 gap-1 dark:border-slate-800 dark:bg-slate-800/60">
        {[
          { id: 'frames', label: 'Frame & Branding', shortLabel: 'Frames', icon: Frame },
          { id: 'colors', label: 'Colors & Gradients', shortLabel: 'Colors', icon: Palette },
          { id: 'logos', label: 'Logos & Icons', shortLabel: 'Logos', icon: Smile },
          { id: 'shapes', label: 'Dots & Eyes', shortLabel: 'Shapes', icon: Grid3X3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/80 dark:bg-slate-700 dark:text-indigo-300 dark:ring-slate-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">
        {/* Gemini AI Brand Stylist */}
        <React.Suspense fallback={null}>
          <AIBrandStylist
            config={config}
            onApplyAITheme={(theme) => onChange(theme)}
          />
        </React.Suspense>

        {/* TAB 1: FRAMES & BRANDING */}
        {activeTab === 'frames' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Frame Style
                </label>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  Boosts physical scan engagement
                </span>
              </div>

              {/* Frame Style Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    id: 'none',
                    name: 'Clean QR',
                    desc: 'No Frame',
                    badge: 'Minimal',
                    isPro: false,
                  },
                  {
                    id: 'bottom-banner',
                    name: 'Bottom Banner',
                    desc: 'Classic "SCAN ME"',
                    badge: 'Popular',
                    isPro: false,
                  },
                  {
                    id: 'top-pill',
                    name: 'Top Ribbon',
                    desc: 'Header Pill',
                    badge: 'Modern',
                    isPro: false,
                  },
                  {
                    id: 'polaroid',
                    name: 'Polaroid',
                    desc: 'Photo Card Style',
                    badge: 'Artisan',
                    isPro: false,
                  },
                  {
                    id: 'badge-tag',
                    name: 'Hanging Tag',
                    desc: 'Ticket & Coupon',
                    badge: 'Retail',
                    isPro: true,
                  },
                  {
                    id: 'minimal-border',
                    name: 'Luxury Frame',
                    desc: 'Bracket Accents',
                    badge: 'Elegant',
                    isPro: true,
                  },
                  {
                    id: 'phone-frame',
                    name: 'Phone Screen',
                    desc: 'Device Silhouette',
                    badge: 'Tech',
                    isPro: true,
                  },
                  {
                    id: 'stamp',
                    name: 'Vintage Stamp',
                    desc: 'Dashed Edge',
                    badge: 'Retro',
                    isPro: true,
                  },
                ].map((f) => {
                  const isSelected = config.frame.style === f.id;
                  const isLocked = f.isPro && !isFramesUnlocked;

                  const handleClick = () => {
                    if (isLocked) {
                      openCoinsModal({
                        id: 'premium-frames',
                        name: 'Designer QR Frames Collection',
                        cost: 10,
                        description: 'Unlock luxury frames: Hanging Tag, Luxury Bracket, Phone Screen, and Vintage Stamp.',
                      });
                      return;
                    }

                    onChange({
                      frame: {
                        ...config.frame,
                        style: f.id as FrameStyle,
                      },
                    });
                  };

                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={handleClick}
                      className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {f.badge}
                        </span>
                        {f.isPro && (
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            isFramesUnlocked
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {isFramesUnlocked ? 'PRO' : '10🪙'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {f.name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {f.desc}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      {isLocked && !isSelected && (
                        <div className="absolute top-2 right-2 text-amber-500">
                          <Lock className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frame Customization Inputs */}
            {config.frame.style !== 'none' && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Call-To-Action (Main Title)
                    </label>
                    <input
                      type="text"
                      value={config.frame.title}
                      onChange={(e) =>
                        onChange({
                          frame: { ...config.frame, title: e.target.value },
                        })
                      }
                      placeholder="SCAN ME"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subtitle / Instructions
                    </label>
                    <input
                      type="text"
                      value={config.frame.subtitle}
                      onChange={(e) =>
                        onChange({
                          frame: { ...config.frame, subtitle: e.target.value },
                        })
                      }
                      placeholder="Point camera at code"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Frame Colors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Frame Banner Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.frame.frameColor}
                        onChange={(e) =>
                          onChange({
                            frame: { ...config.frame, frameColor: e.target.value },
                          })
                        }
                        className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5 bg-white dark:border-slate-700 dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        value={config.frame.frameColor}
                        onChange={(e) =>
                          onChange({
                            frame: { ...config.frame, frameColor: e.target.value },
                          })
                        }
                        className="w-28 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-mono text-slate-800 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.frame.textColor}
                        onChange={(e) =>
                          onChange({
                            frame: { ...config.frame, textColor: e.target.value },
                          })
                        }
                        className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5 bg-white dark:border-slate-700 dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        value={config.frame.textColor}
                        onChange={(e) =>
                          onChange({
                            frame: { ...config.frame, textColor: e.target.value },
                          })
                        }
                        className="w-28 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-mono text-slate-800 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Title Presets */}
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                    Quick Frame Labels:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'SCAN ME',
                      'SCAN FOR MENU',
                      'FREE WI-FI',
                      'VISIT WEBSITE',
                      'CONNECT WITH US',
                      'PAY HERE',
                      'EXCLUSIVE OFFER',
                    ].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          onChange({
                            frame: { ...config.frame, title: label },
                          })
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COLORS & GRADIENTS */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            {/* Quick Color Themes */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Curated Brand Palettes
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  1-Click Synchronize
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyColorPreset(p)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 p-2 text-left hover:border-indigo-300 hover:bg-slate-50/60 transition-all group dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-indigo-500 dark:hover:bg-slate-800"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-xs overflow-hidden"
                      style={{
                        background: p.fgType === 'linear' 
                          ? `linear-gradient(135deg, ${p.fgColor1}, ${p.fgColor2})`
                          : p.fgColor1,
                      }}
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate dark:text-slate-200 dark:group-hover:text-indigo-400">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                        {p.fgType === 'none' ? 'Solid' : 'Gradient'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Foreground Fill Mode */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  QR Dots Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: 'Solid Color' },
                    { id: 'linear', label: 'Linear Gradient' },
                    { id: 'radial', label: 'Radial Gradient' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() =>
                        onChange({
                          colors: {
                            ...config.colors,
                            foregroundType: mode.id as GradientType,
                          },
                        })
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        config.colors.foregroundType === mode.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {config.colors.foregroundType === 'none' ? 'Foreground Color' : 'Gradient Start'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.colors.fgColor1}
                      onChange={(e) =>
                        onChange({
                          colors: { ...config.colors, fgColor1: e.target.value },
                        })
                      }
                      className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5 bg-white dark:border-slate-700 dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      value={config.colors.fgColor1}
                      onChange={(e) =>
                        onChange({
                          colors: { ...config.colors, fgColor1: e.target.value },
                        })
                      }
                      className="w-28 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-mono text-slate-800 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {config.colors.foregroundType !== 'none' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Gradient End
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.colors.fgColor2}
                        onChange={(e) =>
                          onChange({
                            colors: { ...config.colors, fgColor2: e.target.value },
                          })
                        }
                        className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5 bg-white dark:border-slate-700 dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        value={config.colors.fgColor2}
                        onChange={(e) =>
                          onChange({
                            colors: { ...config.colors, fgColor2: e.target.value },
                          })
                        }
                        className="w-28 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-mono text-slate-800 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Gradient Angle Slider */}
              {config.colors.foregroundType === 'linear' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Gradient Angle
                    </label>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {config.colors.gradientAngle}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={config.colors.gradientAngle}
                    onChange={(e) =>
                      onChange({
                        colors: {
                          ...config.colors,
                          gradientAngle: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-indigo-600"
                  />
                </div>
              )}

              {/* Background Color & Transparent Background */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Background Color
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={config.colors.isTransparentBg}
                      onChange={(e) =>
                        onChange({
                          colors: {
                            ...config.colors,
                            isTransparentBg: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Transparent Background</span>
                  </label>
                </div>

                {!config.colors.isTransparentBg && (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.colors.bgColor}
                      onChange={(e) =>
                        onChange({
                          colors: { ...config.colors, bgColor: e.target.value },
                        })
                      }
                      className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5 bg-white dark:border-slate-700 dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      value={config.colors.bgColor}
                      onChange={(e) =>
                        onChange({
                          colors: { ...config.colors, bgColor: e.target.value },
                        })
                      }
                      className="w-28 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-mono text-slate-800 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Eye (Corner Finder) Colors */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.colors.customEyeColors}
                    onChange={(e) =>
                      onChange({
                        colors: {
                          ...config.colors,
                          customEyeColors: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Customize Corner Eye Colors
                  </span>
                </label>

                {config.colors.customEyeColors && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Outer Eye Frame Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.colors.eyeOuterColor}
                          onChange={(e) =>
                            onChange({
                              colors: {
                                ...config.colors,
                                eyeOuterColor: e.target.value,
                              },
                            })
                          }
                          className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5 bg-white dark:border-slate-700 dark:bg-slate-800"
                        />
                        <input
                          type="text"
                          value={config.colors.eyeOuterColor}
                          onChange={(e) =>
                            onChange({
                              colors: {
                                ...config.colors,
                                eyeOuterColor: e.target.value,
                              },
                            })
                          }
                          className="w-28 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-mono text-slate-800 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Inner Eye Center Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.colors.eyeInnerColor}
                          onChange={(e) =>
                            onChange({
                              colors: {
                                ...config.colors,
                                eyeInnerColor: e.target.value,
                              },
                            })
                          }
                          className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5 bg-white dark:border-slate-700 dark:bg-slate-800"
                        />
                        <input
                          type="text"
                          value={config.colors.eyeInnerColor}
                          onChange={(e) =>
                            onChange({
                              colors: {
                                ...config.colors,
                                eyeInnerColor: e.target.value,
                              },
                            })
                          }
                          className="w-28 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-mono text-slate-800 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOGOS & ICONS */}
        {activeTab === 'logos' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Custom Logo or Brand Icon
                </label>
                {config.logo.sourceType !== 'none' && (
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove Logo
                  </button>
                )}
              </div>

              {/* Upload Custom Brand Logo */}
              <div className="mb-4">
                <label className="relative flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-indigo-500">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml, image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Upload className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Upload Your Brand Logo (PNG, SVG, JPG)
                  </span>
                </label>
                {config.logo.sourceType === 'upload' && config.logo.uploadedUrl && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-indigo-50 p-2 text-xs font-medium text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200">
                    <img
                      src={config.logo.uploadedUrl}
                      alt="Uploaded brand logo"
                      className="h-6 w-6 object-contain rounded bg-white p-0.5 border dark:border-slate-700"
                    />
                    <span>Custom brand logo active</span>
                  </div>
                )}
              </div>

              {/* Built-in Brand Icons */}
              <div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                  Or select a popular brand icon:
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {BUILTIN_LOGOS.map((l) => {
                    const isSelected =
                      config.logo.sourceType === 'builtin' &&
                      config.logo.builtinId === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() =>
                          onChange({
                            logo: {
                              ...config.logo,
                              sourceType: 'builtin',
                              builtinId: l.id,
                            },
                            errorCorrectionLevel: 'H',
                          })
                        }
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/60'
                            : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700'
                        }`}
                        title={l.name}
                      >
                        <img
                          src={l.svgDataUri}
                          alt={l.name}
                          className="h-6 w-6 object-contain"
                        />
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium mt-1 truncate max-w-full">
                          {l.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Logo Settings: Size, Margin, Background */}
            {config.logo.sourceType !== 'none' && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Logo Size: {Math.round(config.logo.size * 100)}%
                    </label>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {config.logo.size <= 0.28 ? 'Safe Scan Range' : 'Large Logo'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.12"
                    max="0.36"
                    step="0.02"
                    value={config.logo.size}
                    onChange={(e) =>
                      onChange({
                        logo: { ...config.logo, size: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Logo Clear Margin / Padding
                    </label>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {config.logo.margin}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="1"
                    value={config.logo.margin}
                    onChange={(e) =>
                      onChange({
                        logo: { ...config.logo, margin: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-indigo-600"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.logo.hideBackgroundDots}
                    onChange={(e) =>
                      onChange({
                        logo: {
                          ...config.logo,
                          hideBackgroundDots: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remove QR dots behind logo (clean cutout)</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SHAPES & EYES */}
        {activeTab === 'shapes' && (
          <div className="space-y-6">
            {/* Body Dot Styles */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                Body Dot Pattern
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'rounded', label: 'Rounded Dots', desc: 'Soft & modern' },
                  { id: 'dots', label: 'Circular Dots', desc: 'Minimal bubbles' },
                  { id: 'extra-rounded', label: 'Extra Rounded', desc: 'Smooth pebbles' },
                  { id: 'classy', label: 'Classy Diamond', desc: 'Faceted luxury' },
                  { id: 'classy-rounded', label: 'Classy Soft', desc: 'Curved diamonds' },
                  { id: 'square', label: 'Standard Square', desc: 'Original classic' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        shapes: {
                          ...config.shapes,
                          dotType: s.id as DotType,
                        },
                      })
                    }
                    className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                      config.shapes.dotType === s.id
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {s.label}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {s.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Corner Square (Eye Outer) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                Corner Eye Frame (Outer)
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'extra-rounded', label: 'Curved Pill', desc: 'Modern curve' },
                  { id: 'dot', label: 'Circular Ring', desc: 'Clean circle' },
                  { id: 'square', label: 'Classic Square', desc: 'Sharp edges' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        shapes: {
                          ...config.shapes,
                          cornerSquareType: s.id as CornerSquareType,
                        },
                      })
                    }
                    className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                      config.shapes.cornerSquareType === s.id
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {s.label}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {s.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Corner Dot (Eye Inner) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                Corner Eye Center (Inner Dot)
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'dot', label: 'Circular Dot', desc: 'Spherical center' },
                  { id: 'square', label: 'Square Dot', desc: 'Square center' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        shapes: {
                          ...config.shapes,
                          cornerDotType: s.id as CornerDotType,
                        },
                      })
                    }
                    className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                      config.shapes.cornerDotType === s.id
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {s.label}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {s.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Correction Level */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Error Correction Level
                </label>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {config.errorCorrectionLevel === 'H'
                    ? 'Best for Logos (30% recovery)'
                    : `${config.errorCorrectionLevel} Level`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'L', label: 'L (7%)', desc: 'Low density' },
                  { id: 'M', label: 'M (15%)', desc: 'Standard' },
                  { id: 'Q', label: 'Q (25%)', desc: 'High' },
                  { id: 'H', label: 'H (30%)', desc: 'Maximum' },
                ].map((ec) => (
                  <button
                    key={ec.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        errorCorrectionLevel: ec.id as 'L' | 'M' | 'Q' | 'H',
                      })
                    }
                    className={`py-2 px-1 rounded-xl text-xs font-bold border text-center transition-all ${
                      config.errorCorrectionLevel === ec.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {ec.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
