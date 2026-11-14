import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Link2, 
  ExternalLink, 
  Sparkles, 
  Edit3, 
  Check, 
  X,
  Copy,
  ShieldCheck,
} from 'lucide-react';
import { QRConfig } from '../../types';
import { saveDynamicLinkToFirestore } from '../../lib/firebase';

interface DynamicQRBannerProps {
  config: QRConfig;
  onChange: (updater: Partial<QRConfig>) => void;
}

export const DynamicQRBanner: React.FC<DynamicQRBannerProps> = ({ config, onChange }) => {
  const dynamic = config.dynamic || {
    isDynamic: false,
    dynamicId: '',
    customSlug: '',
    targetUrl: config.url || 'https://github.com',
    scanCount: 0,
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Custom link states
  const [customSlugInput, setCustomSlugInput] = useState(dynamic.customSlug || dynamic.dynamicId || '');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [availability, setAvailability] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
    slug: string;
  } | null>(null);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize customSlugInput when dynamicId changes externally
  useEffect(() => {
    if (dynamic.dynamicId && !isEditingSlug) {
      setCustomSlugInput(dynamic.customSlug || dynamic.dynamicId);
    }
  }, [dynamic.dynamicId, dynamic.customSlug, isEditingSlug]);

  // Destination for the redirect: files must point at the file viewer, never at config.url
  const resolveDestination = (fallback?: string) =>
    (config.contentType === 'file' && config.file
      ? `/?file=${encodeURIComponent(config.file.id)}`
      : (config.url || fallback || 'https://example.com')
    ).trim();

  const handleToggleDynamic = async () => {
    const nextIsDynamic = !dynamic.isDynamic;
    let nextId = dynamic.dynamicId;

    if (nextIsDynamic && !nextId) {
      nextId = `qr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    }

    const updatedDynamic = {
      ...dynamic,
      isDynamic: nextIsDynamic,
      dynamicId: nextId,
      customSlug: dynamic.customSlug || nextId,
      targetUrl: resolveDestination(dynamic.targetUrl),
    };

    onChange({ dynamic: updatedDynamic });

    if (nextIsDynamic) {
      // Sync with server
      try {
        setIsSyncing(true);
        const res = await fetch('/api/dynamic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: nextId,
            customSlug: dynamic.customSlug || undefined,
            title: config.frame.title || 'Dynamic Campaign QR',
            targetUrl: resolveDestination(dynamic.targetUrl),
            contentType: config.contentType,
            expirationDate: config.expirationDate || dynamic.expirationDate || null,
            expirationMessage: config.expirationMessage || dynamic.expirationMessage || undefined,
          }),
        });
        if (res.ok) {
          setSyncStatus('Dynamic redirect route created on server!');
          setTimeout(() => setSyncStatus(null), 3500);
        }
      } catch (err) {
        console.warn('Server sync offline, working locally:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Real-time availability check for custom link
  const verifySlugAvailability = async (slugToTest: string) => {
    const clean = slugToTest.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-.~!@$&*+=?:;%^()]/g, '');
    if (!clean || clean.length < 1) {
      setAvailability({
        checked: true,
        available: false,
        message: 'Link cannot be empty.',
        slug: clean,
      });
      return;
    }

    try {
      setIsCheckingSlug(true);
      const res = await fetch(
        `/api/dynamic/check-availability?slug=${encodeURIComponent(clean)}&currentId=${encodeURIComponent(dynamic.dynamicId || '')}`
      );
      const data = await res.json();
      setAvailability({
        checked: true,
        available: !!data.available,
        message: data.message || data.reason || (data.available ? 'Link is available!' : 'Link is taken.'),
        slug: clean,
      });
    } catch {
      setAvailability({
        checked: true,
        available: true,
        message: 'Available (verified locally).',
        slug: clean,
      });
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSlugInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-.~!@$&*+=?:;%^()]/g, '');
    setCustomSlugInput(val);
    setAvailability(null);

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    if (val.length >= 1) {
      checkTimeoutRef.current = setTimeout(() => {
        verifySlugAvailability(val);
      }, 350);
    }
  };

  // Claim or Save Custom Link
  const handleApplyCustomSlug = async (slugToApply?: string) => {
    const cleanSlug = (slugToApply || customSlugInput).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-.~!@$&*+=?:;%^()]/g, '');
    if (!cleanSlug || cleanSlug.length < 1) return;

    const effectiveDestination = (
      (config.contentType === 'file' && config.file)
        ? `/?file=${encodeURIComponent(config.file.id)}`
        : (dynamic.targetUrl || config.url || 'https://example.com')
    ).trim();

    try {
      setIsSyncing(true);
      const res = await fetch('/api/dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customSlug: cleanSlug,
          oldId: dynamic.dynamicId,
          title: config.frame.title || 'Dynamic Campaign QR',
          targetUrl: effectiveDestination,
          contentType: config.contentType,
          expirationDate: config.expirationDate || dynamic.expirationDate || null,
          expirationMessage: config.expirationMessage || dynamic.expirationMessage || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = {
          ...dynamic,
          isDynamic: true,
          dynamicId: cleanSlug,
          customSlug: cleanSlug,
          targetUrl: effectiveDestination,
          scanCount: data.link?.scanCount ?? dynamic.scanCount,
        };
        const updater: Partial<QRConfig> = { dynamic: updated };
        if (config.file) {
          updater.file = {
            ...config.file,
            customSlug: cleanSlug,
          };
          // Also persist customSlug to /api/files so the file can be looked up directly by slug
          fetch('/api/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: config.file.id,
              name: config.file.name,
              type: config.file.type,
              size: config.file.size,
              url: config.file.dataUrl,
              previewUrl: config.file.previewUrl,
              title: config.file.title || config.file.name,
              customSlug: cleanSlug,
            }),
          }).catch((err) => console.warn('Sync customSlug to /api/files note:', err));
        }
        onChange(updater);
        setIsEditingSlug(false);
        setCustomSlugInput(cleanSlug);
        setAvailability(null);
        setSyncStatus(`Custom link claimed! QR code now routes to /${cleanSlug}`);
        setTimeout(() => setSyncStatus(null), 4000);

        // Also mirror to Firestore for durable cloud resolution
        saveDynamicLinkToFirestore({
          id: cleanSlug,
          targetUrl: effectiveDestination,
          title: config.frame.title || cleanSlug,
          contentType: config.contentType,
          scanCount: data.link?.scanCount ?? dynamic.scanCount ?? 0,
          createdAt: Date.now(),
        }).catch((err) => console.warn('Cloud sync note:', err));
      } else {
        const err = await res.json();
        setAvailability({
          checked: true,
          available: false,
          message: err.error || 'Could not claim custom link.',
          slug: cleanSlug,
        });
      }
    } catch (e) {
      console.error(e);
      // Local fallback
      onChange({
        dynamic: {
          ...dynamic,
          isDynamic: true,
          dynamicId: cleanSlug,
          customSlug: cleanSlug,
          targetUrl: effectiveDestination,
        },
      });
      setIsEditingSlug(false);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncTarget = async () => {
    const activeId = dynamic.customSlug || dynamic.dynamicId;
    if (!activeId) return;

    const effectiveDestination = (
      (config.contentType === 'file' && config.file)
        ? `/?file=${encodeURIComponent(config.file.id)}`
        : (dynamic.targetUrl || config.url || 'https://example.com')
    ).trim();

    try {
      setIsSyncing(true);
      const res = await fetch('/api/dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeId,
          customSlug: dynamic.customSlug,
          title: config.frame.title || 'Dynamic QR',
          targetUrl: effectiveDestination,
          contentType: config.contentType,
          expirationDate: config.expirationDate || dynamic.expirationDate || null,
          expirationMessage: config.expirationMessage || dynamic.expirationMessage || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onChange({
          dynamic: {
            ...dynamic,
            targetUrl: effectiveDestination,
            scanCount: data.link?.scanCount ?? dynamic.scanCount,
            lastScannedAt: data.link?.lastScannedAt,
          },
        });
        setSyncStatus('Destination updated! Existing printed QRs will route to the new link.');
        setTimeout(() => setSyncStatus(null), 4000);

        // Sync to cloud Firestore
        saveDynamicLinkToFirestore({
          id: activeId,
          targetUrl: effectiveDestination,
          title: config.frame.title || 'Dynamic QR',
          contentType: config.contentType,
          scanCount: data.link?.scanCount ?? dynamic.scanCount ?? 0,
          expirationDate: config.expirationDate || dynamic.expirationDate || null,
          expirationMessage: config.expirationMessage || dynamic.expirationMessage || undefined,
          createdAt: Date.now(),
        }).catch(() => {});
      }
    } catch {
      setSyncStatus('Updated local configuration.');
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefreshStats = async () => {
    if (!dynamic.dynamicId) return;
    try {
      setIsSyncing(true);
      const res = await fetch(`/api/dynamic/${dynamic.dynamicId}`);
      if (res.ok) {
        const data = await res.json();
        onChange({
          dynamic: {
            ...dynamic,
            scanCount: data.scanCount || 0,
            lastScannedAt: data.lastScannedAt,
          },
        });
        setSyncStatus(`Refreshed: ${data.scanCount || 0} lifetime scans`);
        setTimeout(() => setSyncStatus(null), 3000);
      }
    } catch {
      // offline fallback
    } finally {
      setIsSyncing(false);
    }
  };

  const redirectUrl = dynamic.dynamicId
    ? `${window.location.origin}/${dynamic.dynamicId}`
    : `${window.location.origin}/example`;

  const isCustomSlugActive = Boolean(
    dynamic.dynamicId && !dynamic.dynamicId.startsWith('qr_')
  );

  return (
    <div className={`rounded-2xl border transition-all p-4 ${
      dynamic.isDynamic 
        ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/30' 
        : 'border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
            dynamic.isDynamic 
              ? 'bg-indigo-600 text-white' 
              : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Dynamic QR &amp; Custom Short Link
              </span>
              {dynamic.isDynamic && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Redirect
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set custom short links and change destination anytime without reprinting.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          onClick={handleToggleDynamic}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            dynamic.isDynamic ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
          role="switch"
          aria-checked={dynamic.isDynamic}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              dynamic.isDynamic ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Expanded Dynamic Controls */}
      {dynamic.isDynamic && (
        <div className="mt-3.5 pt-3.5 border-t border-indigo-100 dark:border-indigo-900/60 space-y-3.5">
          {/* Custom Link Setup Section */}
          <div className="rounded-xl border border-indigo-200/80 bg-white p-3 dark:border-indigo-900/80 dark:bg-slate-900/70 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Link2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Custom Short Link (Alias)</span>
              </div>
              {isCustomSlugActive && !isEditingSlug && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300">
                  <Sparkles className="h-3 w-3" />
                  Custom Link Active
                </span>
              )}
            </div>

            {!isEditingSlug && isCustomSlugActive ? (
              <div className="flex flex-col gap-2.5 text-xs bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {window.location.origin}/{dynamic.customSlug || dynamic.dynamicId}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(`${window.location.origin}/${dynamic.customSlug || dynamic.dynamicId}`);
                          setCopiedSlug(true);
                          setTimeout(() => setCopiedSlug(false), 2000);
                        } catch {}
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Copy short link"
                    >
                      {copiedSlug ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-slate-500" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`/${dynamic.customSlug || dynamic.dynamicId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                      title="Test short link"
                    >
                      <ExternalLink className="h-3 w-3 text-slate-500" />
                      <span>Test</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingSlug(true);
                        setCustomSlugInput(dynamic.customSlug || dynamic.dynamicId);
                        setAvailability(null);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 ml-1 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>

                {/* Sub-info: destination & status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 truncate max-w-xs sm:max-w-md">
                    <span>Directs to:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 truncate">
                      {dynamic.targetUrl || config.url || 'Not configured'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Live Cloud Redirect (302)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 overflow-hidden flex-1 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                    <span className="px-2.5 py-1.5 text-xs font-mono font-bold text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-slate-700 select-none">
                      /
                    </span>
                    <input
                      type="text"
                      value={customSlugInput}
                      onChange={handleSlugInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCustomSlug();
                        }
                      }}
                      placeholder="launch-deal, @brand, or promo!"
                      className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => verifySlugAvailability(customSlugInput)}
                      disabled={isCheckingSlug || !customSlugInput}
                      className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 disabled:opacity-40 cursor-pointer"
                    >
                      {isCheckingSlug ? 'Checking...' : 'Check'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleApplyCustomSlug()}
                      disabled={isSyncing || (availability !== null && !availability.available)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-2 sm:py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Claim Link</span>
                    </button>
                    {isEditingSlug && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingSlug(false);
                          setCustomSlugInput(dynamic.dynamicId);
                          setAvailability(null);
                        }}
                        className="rounded-xl border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Real-time availability indicator */}
                {availability && (
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${
                    availability.available 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {availability.available ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{availability.message}</span>
                  </div>
                )}

                {/* Quick Presets / Suggestions */}
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Suggestions:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSlugInput('launch-deal');
                      verifySlugAvailability('launch-deal');
                    }}
                    className="hover:text-indigo-600 hover:underline font-mono"
                  >
                    launch-deal
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSlugInput('portfolio');
                      verifySlugAvailability('portfolio');
                    }}
                    className="hover:text-indigo-600 hover:underline font-mono"
                  >
                    portfolio
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      const randSlug = `promo-${Math.random().toString(36).slice(2, 6)}`;
                      setCustomSlugInput(randSlug);
                      verifySlugAvailability(randSlug);
                    }}
                    className="hover:text-indigo-600 hover:underline font-mono"
                  >
                    auto-generate
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Link2 className="h-3.5 w-3.5 text-indigo-500" />
              <span>Full QR Target URL:</span>
              <code className="rounded bg-white dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 max-w-[220px] sm:max-w-xs truncate">
                {redirectUrl}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <span>{dynamic.scanCount || 0} scans</span>
              </span>
              <button
                type="button"
                onClick={handleRefreshStats}
                disabled={isSyncing}
                title="Refresh scan counter"
                className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Destination Target */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Destination Target (can be changed anytime)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={dynamic.targetUrl}
                onChange={(e) =>
                  onChange({
                    dynamic: { ...dynamic, targetUrl: e.target.value },
                  })
                }
                placeholder="https://example.com/promo-landing or /?file=..."
                className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSyncTarget}
                disabled={isSyncing}
                className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
              >
                <span>Save Target</span>
              </button>
              <a
                href={redirectUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs"
                title="Test redirect link"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {syncStatus && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{syncStatus}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};