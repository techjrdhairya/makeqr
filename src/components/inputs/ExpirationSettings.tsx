import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Trash2,
  Hourglass,
  Info
} from 'lucide-react';
import { QRConfig } from '../../types';

interface ExpirationSettingsProps {
  config: QRConfig;
  onChange: (updates: Partial<QRConfig>) => void;
  className?: string;
}

export const ExpirationSettings: React.FC<ExpirationSettingsProps> = ({
  config,
  onChange,
  className = '',
}) => {
  const isEnabled = Boolean(config.expirationDate);
  const [localDate, setLocalDate] = useState<string>(config.expirationDate || '');
  const [localMessage, setLocalMessage] = useState<string>(config.expirationMessage || '');

  // Keep local state in sync when config updates
  useEffect(() => {
    setLocalDate(config.expirationDate || '');
    setLocalMessage(config.expirationMessage || '');
  }, [config.expirationDate, config.expirationMessage]);

  // Calculate current expiration status
  const getExpirationStatus = () => {
    if (!config.expirationDate) return null;
    const expTime = new Date(config.expirationDate).getTime();
    if (isNaN(expTime)) return null;

    const now = Date.now();
    const isExpired = now > expTime;
    const diffMs = Math.abs(expTime - now);

    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let relativeTime = '';
    if (diffDays > 1) {
      relativeTime = `${diffDays} days`;
    } else if (diffHours > 1) {
      relativeTime = `${diffHours} hours`;
    } else {
      relativeTime = `${Math.max(1, diffMins)} minutes`;
    }

    const formattedDate = new Date(config.expirationDate).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return {
      isExpired,
      formattedDate,
      relativeTime,
    };
  };

  const status = getExpirationStatus();

  // Helper to format ISO date to datetime-local string
  const toDateTimeLocal = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  };

  const handleToggle = (enable: boolean) => {
    if (enable) {
      // Default to 7 days in future if not already set
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const val = toDateTimeLocal(future);
      setLocalDate(val);

      // Auto-enable dynamic routing if not yet dynamic so scans can be intercepted
      const updates: Partial<QRConfig> = {
        expirationDate: val,
        expirationMessage: config.expirationMessage || '',
      };

      if (!config.dynamic?.isDynamic) {
        const generatedId = config.dynamic?.dynamicId || `exp_${Date.now().toString(36)}`;
        updates.dynamic = {
          ...config.dynamic,
          isDynamic: true,
          dynamicId: generatedId,
          targetUrl: config.url || window.location.origin,
          expirationDate: val,
          expirationMessage: config.expirationMessage || '',
        };
      } else {
        updates.dynamic = {
          ...config.dynamic,
          expirationDate: val,
          expirationMessage: config.expirationMessage || '',
        };
      }

      onChange(updates);
    } else {
      setLocalDate('');
      onChange({
        expirationDate: null,
        dynamic: config.dynamic
          ? {
              ...config.dynamic,
              expirationDate: null,
              // Routing that was only switched on for the expiry goes away with it
              ...(!config.dynamic.customSlug && /^exp_/.test(config.dynamic.dynamicId || '') ? { isDynamic: false } : {}),
            }
          : undefined,
      });
    }
  };

  const handleDateChange = (newDateString: string) => {
    setLocalDate(newDateString);
    onChange({
      expirationDate: newDateString || null,
      dynamic: config.dynamic
        ? {
            ...config.dynamic,
            expirationDate: newDateString || null,
          }
        : undefined,
    });
  };

  const handleMessageChange = (newMsg: string) => {
    setLocalMessage(newMsg);
    onChange({
      expirationMessage: newMsg,
      dynamic: config.dynamic
        ? {
            ...config.dynamic,
            expirationMessage: newMsg,
          }
        : undefined,
    });
  };

  const applyPreset = (daysAhead: number) => {
    const target = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    // Align to 23:59:00 for cleaner end-of-day cutoff
    target.setHours(23, 59, 0, 0);
    const val = toDateTimeLocal(target);
    handleDateChange(val);
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isEnabled
          ? 'border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 dark:border-amber-900/60 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 shadow-xs'
          : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
      } p-4 sm:p-5 ${className}`}
    >
      {/* Header & Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isEnabled
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Expiration Date
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Optional
              </span>
              {status && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    status.isExpired
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/90 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/90 dark:text-emerald-300'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      status.isExpired ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  {status.isExpired ? 'Code Expired' : 'Active'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automatically display a 'Code Expired' message when this date passes.
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <label className="relative inline-flex cursor-pointer items-center shrink-0">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-amber-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-400/20 dark:bg-slate-700 transition-colors after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
        </label>
      </div>

      {/* Expanded controls when enabled */}
      {isEnabled && (
        <div className="mt-4 space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Status Alert Banner */}
          {status && (
            <div
              className={`flex items-start gap-2.5 rounded-xl p-3 text-xs border ${
                status.isExpired
                  ? 'bg-rose-50/90 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300'
                  : 'bg-emerald-50/90 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300'
              }`}
            >
              {status.isExpired ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">
                {status.isExpired ? (
                  <span>
                    <strong>This code is currently expired!</strong> Scanners will immediately see the{' '}
                    <em>'Code Expired'</em> screen instead of your original content (expired on{' '}
                    {status.formattedDate}).
                  </span>
                ) : (
                  <span>
                    <strong>Valid &amp; Active.</strong> This QR code will remain active for{' '}
                    <strong>{status.relativeTime}</strong> (until {status.formattedDate}), after which it
                    will automatically show the <em>'Code Expired'</em> message.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Date & Time Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Expiration Date &amp; Time
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="datetime-local"
                  value={localDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 shadow-xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Reset to now or clear */}
              <button
                type="button"
                onClick={() => handleToggle(false)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                title="Remove expiration date"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
              Quick Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(1)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-amber-600 dark:hover:bg-amber-950/40 transition-colors"
              >
                +24 Hours
              </button>
              <button
                type="button"
                onClick={() => applyPreset(3)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-amber-600 dark:hover:bg-amber-950/40 transition-colors"
              >
                +3 Days
              </button>
              <button
                type="button"
                onClick={() => applyPreset(7)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-amber-600 dark:hover:bg-amber-950/40 transition-colors"
              >
                +7 Days
              </button>
              <button
                type="button"
                onClick={() => applyPreset(30)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-amber-600 dark:hover:bg-amber-950/40 transition-colors"
              >
                +30 Days
              </button>
              <button
                type="button"
                onClick={() => applyPreset(90)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-amber-600 dark:hover:bg-amber-950/40 transition-colors"
              >
                +90 Days
              </button>
            </div>
          </div>

          {/* Custom Expired Message */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Custom Expired Message <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {localMessage.length}/160
              </span>
            </div>
            <input
              type="text"
              maxLength={160}
              value={localMessage}
              onChange={(e) => handleMessageChange(e.target.value)}
              placeholder="e.g. This seasonal promotion has ended. Visit makeqr.app for new offers!"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 shadow-xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              Leave blank to use the default: <em>"This QR code has reached its expiration date and is no longer available."</em>
            </p>
          </div>

          {/* Dynamic routing explanation */}
          <div className="flex items-center gap-2 rounded-xl bg-amber-50/70 p-3 text-[11px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-300/90 border border-amber-200/50 dark:border-amber-900/40">
            <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Dynamic link routing is automatically synced so the server can evaluate validity each time a user scans your code.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
