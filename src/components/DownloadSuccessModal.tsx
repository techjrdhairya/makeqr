import React from 'react';
import { CheckCircle2, PlusCircle, FolderHeart, X, Sparkles, Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface DownloadSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrName?: string;
  qrUrl?: string;
  onRestartNewQR: () => void;
  onGoToMyQRCodes: () => void;
}

export const DownloadSuccessModal: React.FC<DownloadSuccessModalProps> = ({
  isOpen,
  onClose,
  qrName,
  qrUrl,
  onRestartNewQR,
  onGoToMyQRCodes,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 transition-all scale-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            QR Code Ready!
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Your QR code has been generated, downloaded, and saved to your library.
          </p>

          {/* QR Details */}
          {qrName && (
            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Name: </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{qrName}</span>
              {qrUrl && (
                <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="truncate font-mono text-[11px] text-slate-500 dark:text-slate-400 max-w-[220px]">
                    {qrUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Actions matching video 01:02 */}
          <div className="mt-6 flex flex-col gap-2.5">
            {/* Primary: Create New QR Code (Restarts process) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onRestartNewQR();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Create New QR Code</span>
            </button>

            {/* Secondary: My QR Codes */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoToMyQRCodes();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 px-4 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <FolderHeart className="h-4 w-4 text-indigo-500" />
              <span>My QR Codes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
