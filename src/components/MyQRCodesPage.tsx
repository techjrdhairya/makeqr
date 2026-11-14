import React, { useState, useEffect } from 'react';
import { 
  FolderHeart, 
  PlusCircle, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  Edit3, 
  Sparkles, 
  CheckCircle2,
  X,
  BarChart3,
  Activity,
  Folder,
  Tag,
  Printer,
  TrendingUp
} from 'lucide-react';
import { SavedQR, FileData, QRConfig } from '../types';
import { getConfigPayload } from '../utils/qr-generator';
import { DEFAULT_CONFIG } from '../utils/qr-constants';
import { QRAnalyticsModal } from './QRAnalyticsModal';
import { fetchQRAnalytics, isTrackable } from '../utils/analytics';
import { OrganiseModal, CampaignPanel, FolderTagChips } from './OrganisePanels';
import { exportLabelledSheetPDF } from '../utils/pdf-export';

interface MyQRCodesPageProps {
  savedItems: SavedQR[];
  userFiles?: FileData[];
  onSelectQR: (qr: SavedQR) => void;
  onDeleteQR: (id: string) => void;
  onDeleteFile?: (id: string) => void;
  onSelectFileAsQR?: (file: FileData) => void;
  onCreateNewQR: () => void;
  onBackToStudio?: () => void;
  user?: any;
  onSyncToCloud?: () => Promise<void>;
  onOpenAuthModal?: () => void;
  onUpdateMeta?: (id: string, meta: { folder?: string; tags: string[] }) => void;
}

export const MyQRCodesPage: React.FC<MyQRCodesPageProps> = ({
  savedItems,
  onSelectQR,
  onDeleteQR,
  onCreateNewQR,
  onBackToStudio,
  onUpdateMeta,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [analyticsModalQR, setAnalyticsModalQR] = useState<SavedQR | null>(null);
  const [scanCounts, setScanCounts] = useState<Record<string, number>>({});
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [organiseQR, setOrganiseQR] = useState<SavedQR | null>(null);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const folders = Array.from(new Set(savedItems.map((i) => i.folder).filter(Boolean) as string[])).sort();
  const allTags = Array.from(new Set(savedItems.flatMap((i) => i.tags || []))).sort();
  const toggleSelected = (id: string) => setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const printSelected = async () => {
    const chosen = savedItems.filter((i) => selectedIds.has(i.id) && i.previewThumbnail);
    if (!chosen.length) { showToast('Select at least one QR code first.'); return; }
    await exportLabelledSheetPDF(chosen.map((i) => ({ image: i.previewThumbnail, label: i.name || 'Scan me' })));
    showToast(`Print sheet created with ${chosen.length} QR ${chosen.length === 1 ? 'code' : 'codes'}.`);
  };

  // Asynchronously fetch scan counts for each card directly from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      await Promise.all(
        savedItems.filter(isTrackable).map(async (item) => {
          try {
            const data = await fetchQRAnalytics(item);
            counts[item.id] = data.scanCount || 0;
          } catch {}
        })
      );
      if (isMounted) {
        setScanCounts((prev) => ({ ...prev, ...counts }));
      }
    };

    if (savedItems.length > 0) {
      fetchCounts();
    }
    return () => {
      isMounted = false;
    };
  }, [savedItems]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const executeDelete = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    onDeleteQR(id);
    setConfirmDeleteId(null);
    showToast('QR code removed.');
  };

  const handleCopyLink = (qr: SavedQR) => {
    // Copy exactly what the QR code encodes (never a leftover default such as the URL tab's placeholder)
    let url = '';
    try { url = getConfigPayload({ ...DEFAULT_CONFIG, ...qr.config } as QRConfig); } catch { url = ''; }
    if (!url) url = qr.summaryText || window.location.origin;

    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(qr.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDownloadThumbnail = (qr: SavedQR) => {
    if (!qr.previewThumbnail) return;
    const a = document.createElement('a');
    a.href = qr.previewThumbnail;
    a.download = `${(qr.name || 'qr-code').toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  };

  const filteredItems = savedItems.filter((item) => {
    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.summaryText || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || (item.contentType === filterType || (filterType === 'url' && item.contentType === 'quicklink'));
    const matchesFolder = folderFilter === 'all' || (folderFilter === '__none' ? !item.folder : item.folder === folderFilter);
    const matchesTag = !tagFilter || (item.tags || []).includes(tagFilter);
    return matchesSearch && matchesType && matchesFolder && matchesTag;
  });

  const countsByType = {
    all: savedItems.length,
    url: savedItems.filter((i) => i.contentType === 'url' || i.contentType === 'quicklink').length,
    file: savedItems.filter((i) => i.contentType === 'file').length,
    vcard: savedItems.filter((i) => i.contentType === 'vcard').length,
    wifi: savedItems.filter((i) => i.contentType === 'wifi').length,
    social: savedItems.filter((i) => i.contentType === 'social').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Panel */}
      <div className="bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shadow-2xs">
              <FolderHeart className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  My QR Codes
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                  {savedItems.length} total
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your saved custom QR codes and high-resolution designs.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            {onBackToStudio && (
              <button
                type="button"
                onClick={onBackToStudio}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
              >
                Back to editor
              </button>
            )}
            <button
              type="button"
              onClick={onCreateNewQR}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Create New QR</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="max-w-6xl mx-auto mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, link, or content..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All', count: countsByType.all },
              { id: 'url', label: 'Links', count: countsByType.url },
              { id: 'file', label: 'Files', count: countsByType.file },
              { id: 'vcard', label: 'Contacts', count: countsByType.vcard },
              { id: 'wifi', label: 'Wi-Fi', count: countsByType.wifi },
              { id: 'social', label: 'Bio', count: countsByType.social },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-colors shrink-0 cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterType === tab.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Folders, tags and tools */}
        <div className="max-w-6xl mx-auto mt-3 space-y-2" id="organise-bar">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <Folder className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {[{ id: 'all', label: 'All folders' }, ...folders.map((f) => ({ id: f, label: f })), ...(folders.length ? [{ id: '__none', label: 'Unfiled' }] : [])].map((f) => (
              <button key={f.id} type="button" onClick={() => setFolderFilter(f.id)} className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${folderFilter === f.id ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>{f.label}</button>
            ))}
            {folders.length === 0 && <span className="text-[11px] text-slate-400">Use Organise on a QR to create your first folder.</span>}
          </div>
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <Tag className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {allTags.map((t) => (
                <button key={t} type="button" onClick={() => setTagFilter(tagFilter === t ? '' : t)} className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${tagFilter === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>#{t}</button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" id="toggle-campaigns" onClick={() => setShowCampaigns((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold cursor-pointer ${showCampaigns ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}><TrendingUp className="h-3.5 w-3.5" />Compare campaigns</button>
            <button type="button" id="toggle-select" onClick={() => { setSelectMode((v) => !v); setSelectedIds(new Set()); }} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold cursor-pointer ${selectMode ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}><Printer className="h-3.5 w-3.5" />{selectMode ? 'Cancel selection' : 'Print sheet'}</button>
            {selectMode && (
              <>
                <button type="button" onClick={() => setSelectedIds(new Set(filteredItems.map((i) => i.id)))} className="text-[11px] font-bold text-indigo-600 cursor-pointer dark:text-indigo-400">Select all shown</button>
                <button type="button" id="print-selected" onClick={printSelected} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-extrabold text-white cursor-pointer">Create PDF ({selectedIds.size})</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showCampaigns && <CampaignPanel items={savedItems} scanCounts={scanCounts} onPickTag={(t) => { setTagFilter(t); setShowCampaigns(false); }} />}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <FolderHeart className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {savedItems.length === 0 ? 'No saved QR codes yet' : 'No matching QR codes'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {savedItems.length === 0 
                ? 'Create and customize your first QR code, then save it to access it anytime.' 
                : 'Try adjusting your search query or type filters.'}
            </p>
            <button
              type="button"
              onClick={onCreateNewQR}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Your First QR</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white border border-slate-200/90 dark:bg-slate-900 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div 
                        onClick={() => (selectMode ? toggleSelected(item.id) : onSelectQR(item))}
                        className={`relative h-20 w-20 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center p-1.5 overflow-hidden shrink-0 cursor-pointer group-hover:border-indigo-400 transition-colors ${selectMode && selectedIds.has(item.id) ? 'ring-2 ring-indigo-600' : ''}`}
                      >
                        {selectMode && <input type="checkbox" readOnly checked={selectedIds.has(item.id)} aria-label={`Select ${item.name || 'QR'}`} className="absolute left-1 top-1 h-4 w-4 accent-indigo-600" />}
                        {item.previewThumbnail ? (
                          <img
                            src={item.previewThumbnail}
                            alt={item.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Sparkles className="h-6 w-6 text-indigo-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.contentType}
                            </span>
                            {scanCounts[item.id] !== undefined && (
                              <button
                                type="button"
                                onClick={() => setAnalyticsModalQR(item)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-[10px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                                title="Click to view analytics"
                              >
                                <Activity className="h-2.5 w-2.5 text-emerald-500 animate-pulse" />
                                <span>{scanCounts[item.id]} {scanCounts[item.id] === 1 ? 'scan' : 'scans'}</span>
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {formattedDate}
                          </span>
                        </div>

                        <h3 
                          onClick={() => onSelectQR(item)}
                          className="mt-1 text-sm font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title={item.name}
                        >
                          {item.name || 'Untitled QR'}
                        </h3>

                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 break-all" title={item.summaryText}>
                          {item.summaryText || 'No destination text'}
                        </p>
                        <FolderTagChips folder={item.folder} tags={item.tags} />
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onSelectQR(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-colors cursor-pointer"
                        title="Edit design in Studio"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* View Analytics Button */}
                      <button
                        type="button"
                        onClick={() => setAnalyticsModalQR(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                        title="View scan count and location data fetched from Firestore"
                      >
                        <BarChart3 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Analytics</span>
                        {scanCounts[item.id] !== undefined && scanCounts[item.id] > 0 && (
                          <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-black leading-none">
                            {scanCounts[item.id]}
                          </span>
                        )}
                      </button>

                      {onUpdateMeta && (
                        <button
                          type="button"
                          onClick={() => setOrganiseQR(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                          title="Set folder and tags"
                        >
                          <Folder className="h-3.5 w-3.5" />
                          <span className="text-[11px]">Organise</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyLink(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                        title="Copy what this QR opens or contains"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-600 text-[11px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span className="text-[11px]">Link</span>
                          </>
                        )}
                      </button>

                      {item.previewThumbnail && (
                        <button
                          type="button"
                          onClick={() => handleDownloadThumbnail(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Download QR image"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {confirmDeleteId === item.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 rounded-lg">
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Delete?</span>
                        <button
                          type="button"
                          onClick={(e) => executeDelete(item.id, e)}
                          className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="px-1 py-0.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-[10px] font-semibold cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(item.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete QR code"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OrganiseModal key={organiseQR?.id || 'none'} qr={organiseQR} folders={folders} tags={allTags} onClose={() => setOrganiseQR(null)} onSave={(id, meta) => onUpdateMeta?.(id, meta)} />

      {/* QR Analytics Modal (Fetched from Firestore) */}
      <QRAnalyticsModal
        isOpen={Boolean(analyticsModalQR)}
        onClose={() => setAnalyticsModalQR(null)}
        qr={analyticsModalQR}
      />
    </div>
  );
};
