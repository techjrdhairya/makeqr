import React, { useState, useEffect } from 'react';
import {
  X,
  BarChart3,
  Globe2,
  Smartphone,
  Calendar,
  RefreshCw,
  MapPin,
  Flame,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  Monitor,
  Tablet,
  Check,
  Copy
} from 'lucide-react';
import { SavedQR, QRAnalyticsData, QRScanLocation, QRScanEvent } from '../types';
import { fetchQRAnalytics, isTrackable } from '../utils/analytics';
import { AnalyticsCharts } from './AnalyticsCharts';

interface QRAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  qr: SavedQR | null;
}

export const QRAnalyticsModal: React.FC<QRAnalyticsModalProps> = ({
  isOpen,
  onClose,
  qr
}) => {
  const [analytics, setAnalytics] = useState<QRAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isSimulating = false;
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'locations' | 'scans' | 'devices'>('locations');

  // Load analytics from Firestore
  const fetchAnalytics = async (showLoading = true) => {
    if (!qr) return;
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      setAnalytics(await fetchQRAnalytics(qr));
    } catch (err) {
      console.warn('Failed fetching QR analytics from Firestore:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !qr) return;

    fetchAnalytics(true);

    // Live updates: poll the server every 10s while open
    const timer = setInterval(() => fetchAnalytics(false), 10000);
    return () => clearInterval(timer);
  }, [isOpen, qr?.id]);

  if (!isOpen || !qr) return null;

  const totalScans = analytics?.scanCount || 0;
  const locations = analytics?.locations || [];
  const recentScans = analytics?.recentScans || [];
  const devices = analytics?.devices || { mobile: 0, desktop: 0, tablet: 0 };

  const totalDeviceCount = (devices.mobile || 0) + (devices.desktop || 0) + (devices.tablet || 0);
  const mobilePct = totalDeviceCount > 0 ? Math.round(((devices.mobile || 0) / totalDeviceCount) * 100) : 0;
  const desktopPct = totalDeviceCount > 0 ? Math.round(((devices.desktop || 0) / totalDeviceCount) * 100) : 0;
  const tabletPct = totalDeviceCount > 0 ? Math.round(((devices.tablet || 0) / totalDeviceCount) * 100) : 0;

  const formatTimeAgo = (ts?: number | null) => {
    if (!ts) return 'Never scanned';
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Build target link to simulate/test
  const getShareLink = () => {
    if (qr.config?.contentType === 'file' && qr.config?.file) {
      const f = qr.config.file;
      return f.customSlug ? `${window.location.origin}/${f.customSlug}` : `${window.location.origin}/?file=${encodeURIComponent(f.id)}`;
    }
    if (qr.config?.dynamic?.customSlug) {
      return `${window.location.origin}/${qr.config.dynamic.customSlug}`;
    }
    if (qr.config?.file?.id) {
      return `${window.location.origin}/?file=${qr.config.file.id}`;
    }
    if (qr.config?.url) {
      return qr.config.url;
    }
    return `${window.location.origin}/?qr=${encodeURIComponent(qr.id)}`;
  };

  const handleCopyLink = () => {
    const link = getShareLink();
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Opens the real link in a new tab — that visit is recorded as a genuine scan
  const handleSimulateScan = () => {
    window.open(getShareLink(), '_blank', 'noopener');
    setTimeout(() => fetchAnalytics(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-3 min-w-0">
            {qr.previewThumbnail ? (
              <img
                src={qr.previewThumbnail}
                alt={qr.name}
                className="h-10 w-10 rounded-xl object-contain bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 shrink-0 shadow-2xs"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                <BarChart3 className="h-5 w-5" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {qr.name || 'QR Code'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  {qr.contentType}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live scan data
                </span>
                <span>•</span>
                <span className="text-[11px]">
                  Created {new Date(qr.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => fetchAnalytics(false)}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="h-7 w-7 animate-spin text-indigo-600 mb-3" />
              <p className="text-sm font-semibold">Loading scan data...</p>
            </div>
          ) : (
            <>
              {!isTrackable(qr) && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                  <strong>Scans can't be counted for this QR.</strong> It opens its destination directly. Turn on <em>Dynamic QR</em> (a short link), or use a File QR, to track scans.
                </div>
              )}
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Scans */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 shadow-2xs">
                  <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total Scans</span>
                    <Flame className="h-4 w-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {totalScans.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Counted on every open
                  </div>
                </div>

                {/* Unique Locations */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-100 dark:border-emerald-900/50 shadow-2xs">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Locations</span>
                    <Globe2 className="h-4 w-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {locations.length}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Unique cities logged
                  </div>
                </div>

                {/* Last Scanned */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900 border border-amber-100 dark:border-amber-900/50 shadow-2xs">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Last Scan</span>
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate mt-1">
                    {formatTimeAgo(analytics?.lastScannedAt)}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Real-time activity
                  </div>
                </div>

                {/* Top Location */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/40 dark:to-slate-900 border border-purple-100 dark:border-purple-900/50 shadow-2xs">
                  <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Top Area</span>
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate mt-1">
                    {locations.length > 0 ? locations[0].city : 'None yet'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {locations.length > 0 ? locations[0].country : 'Awaiting scans'}
                  </div>
                </div>
              </div>

              {analytics && isTrackable(qr) && <AnalyticsCharts analytics={analytics} qrName={qr.name} />}

              {/* Navigation Tabs */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('locations')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'locations'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Location Data ({locations.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('scans')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'scans'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    <span>Recent Scans ({recentScans.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('devices')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'devices'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Devices</span>
                  </button>
                </div>

                {/* Simulate / Test Scan Button */}
                <button
                  type="button"
                  onClick={handleSimulateScan}
                  disabled={isSimulating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  title="Open the QR link in a new tab (counts as a real scan)"
                >
                  <Zap className={`h-3.5 w-3.5 text-amber-400 ${isSimulating ? 'animate-bounce' : ''}`} />
                  <span>Test Scan</span>
                </button>
              </div>

              {/* Tab 1: Location Data */}
              {activeTab === 'locations' && (
                <div className="space-y-3">
                  {locations.length === 0 ? (
                    <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                      <Globe2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        No Location Data Yet
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        Scans are geotagged when visitors scan your QR code. Click <strong>Test Scan</strong> above to record a sample scan from your current region!
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {locations.map((loc, idx) => {
                          const pct = totalScans > 0 ? Math.round((loc.count / totalScans) * 100) : 100;
                          return (
                            <div
                              key={`${loc.city}-${loc.country}-${idx}`}
                              className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-black shrink-0">
                                  {loc.countryCode || '🌐'}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                      {loc.city}
                                    </span>
                                    {loc.region && (
                                      <span className="text-[11px] text-slate-400">
                                        ({loc.region})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {loc.country}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                                <div className="w-28 hidden sm:block">
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-1">
                                    <span>Share</span>
                                    <span>{pct}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-600 rounded-full transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-xs">
                                    {loc.count} {loc.count === 1 ? 'scan' : 'scans'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Recent Scans */}
              {activeTab === 'scans' && (
                <div className="space-y-3">
                  {recentScans.length === 0 ? (
                    <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                      <Flame className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        No Scans Recorded Yet
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        Share your QR code link or scan with your smartphone camera to log real-time scan events.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentScans.map((scan, idx) => (
                          <div
                            key={`${scan.timestamp}-${idx}`}
                            className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                                <Smartphone className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {scan.city ? `${scan.city}, ${scan.country}` : 'Verified Scan Event'}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                                  <span>{scan.device || 'Mobile'}</span>
                                  {scan.browser && (
                                    <>
                                      <span>•</span>
                                      <span>{scan.browser}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                              {formatTimeAgo(scan.timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Devices Breakdown */}
              {activeTab === 'devices' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
                      <Smartphone className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Mobile</div>
                      <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{mobilePct}%</div>
                      <div className="text-[10px] text-slate-400">{devices.mobile || 0} scans</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
                      <Monitor className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Desktop</div>
                      <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{desktopPct}%</div>
                      <div className="text-[10px] text-slate-400">{devices.desktop || 0} scans</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
                      <Tablet className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Tablet</div>
                      <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{tabletPct}%</div>
                      <div className="text-[10px] text-slate-400">{devices.tablet || 0} scans</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-semibold text-indigo-900 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      Privacy-Preserving Telemetry
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      MakeQR aggregates scan metrics without collecting personally identifiable information. Device and geographic signals are anonymized at the city/region level.
                    </p>
                  </div>
                </div>
              )}

              {/* Share / Scan Target Link Box */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Encoded QR Destination Link
                  </span>
                  <div className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {getShareLink()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Scans are counted when the QR link is opened
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
