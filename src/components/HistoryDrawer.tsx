import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  RotateCcw, 
  Download, 
  Bookmark, 
  Calendar,
  Cloud,
  CheckCircle2,
  Search,
  UploadCloud,
  LogIn
} from 'lucide-react';
import { SavedQR } from '../types';
import { useAuth } from '../context/AuthContext';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedItems: SavedQR[];
  onLoadItem: (item: SavedQR) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onSyncLocalToCloud?: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  savedItems,
  onLoadItem,
  onDeleteItem,
  onClearAll,
  onSyncLocalToCloud,
}) => {
  const { user, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems = savedItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.contentType.toLowerCase().includes(q) ||
      (item.summaryText && item.summaryText.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200 dark:bg-slate-900 dark:border-l dark:border-slate-800">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Saved QR Codes ({savedItems.length})
                </h3>
                {user && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                    <Cloud className="h-3 w-3" />
                    Cloud
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user ? `Synced with Cloud (${user.email})` : 'Stored locally on this device'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cloud Sync Status Banner */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/40">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Cloud Sync Active</span>
              </div>
              {onSyncLocalToCloud && (
                <button
                  type="button"
                  onClick={onSyncLocalToCloud}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  title="Upload all local QR codes to Firebase"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Sync to Cloud</span>
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs dark:border-indigo-900/50 dark:bg-indigo-950/40 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-indigo-950 dark:text-indigo-200">
                  Save all QR codes to Firebase Cloud
                </p>
                <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                  Sign in with Google or Apple to keep all your designs synced across devices.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal();
                }}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        {savedItems.length > 3 && (
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved codes by title or type..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {savedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3 dark:bg-slate-800 dark:text-slate-500">
                <Bookmark className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No Saved QR Codes Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                Customize your code and click &quot;Save to Library&quot; to keep your branded designs here for fast re-export and cloud sync.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No QR codes match &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3.5 rounded-2xl border border-slate-200 p-3.5 hover:border-indigo-300 hover:shadow-xs transition-all bg-white dark:border-slate-800 dark:bg-slate-800/70 dark:hover:border-indigo-500"
              >
                {/* Thumbnail */}
                <img
                  src={item.previewThumbnail}
                  alt={item.name}
                  className="h-16 w-16 rounded-xl border border-slate-200 object-contain bg-slate-50 p-1 shrink-0 dark:border-slate-700 dark:bg-slate-900"
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {item.contentType}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.summaryText}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadItem(item);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors dark:bg-indigo-950/70 dark:text-indigo-300 dark:hover:bg-indigo-900"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Edit</span>
                    </button>

                    <a
                      href={item.previewThumbnail}
                      download={`qr-${item.contentType}-${item.id}.png`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </a>

                    {confirmDeleteId === item.id ? (
                      <div className="ml-auto flex items-center gap-1 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 px-1.5 py-0.5 rounded-lg">
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Del?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteItem(item.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1 py-0.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-[9px] font-semibold cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="ml-auto rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors dark:hover:bg-rose-950/50 dark:hover:text-rose-400 cursor-pointer"
                        title="Delete saved QR"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {savedItems.length > 0 && (
          <div className="border-t border-slate-200 p-4 flex justify-between items-center bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
            >
              Clear All Saved
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
