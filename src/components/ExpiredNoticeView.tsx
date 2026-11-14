import React from 'react';
import { Hourglass, AlertCircle, ArrowLeft, PlusCircle, ShieldAlert } from 'lucide-react';

interface ExpiredNoticeViewProps {
  message?: string;
  expiredDateFormatted?: string;
  onGoToStudio?: () => void;
  onCreateNew?: () => void;
}

export const ExpiredNoticeView: React.FC<ExpiredNoticeViewProps> = ({
  message,
  expiredDateFormatted,
  onGoToStudio,
  onCreateNew,
}) => {
  const displayMessage =
    message?.trim() ||
    'This QR code has reached its scheduled expiration date and its destination content is no longer available.';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/40 text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-3xl border border-rose-500/20 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-rose-950/20 text-center relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-400" />
        
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-inner">
          <Hourglass className="h-8 w-8 animate-pulse" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-rose-300 mb-4">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Notice</span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Code Expired
        </h1>

        {/* Message */}
        <p className="text-sm text-slate-300 leading-relaxed mb-6 font-normal">
          {displayMessage}
        </p>

        {/* Date Pill if available */}
        {expiredDateFormatted && (
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400 flex items-center justify-between">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Expired On
            </span>
            <span className="font-bold text-rose-300 font-mono">
              {expiredDateFormatted}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {onCreateNew ? (
            <button
              type="button"
              onClick={onCreateNew}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Your Own QR Code</span>
            </button>
          ) : (
            <a
              href="/"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Your Own QR Code</span>
            </a>
          )}

          {onGoToStudio && (
            <button
              type="button"
              onClick={onGoToStudio}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-800/40 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to MakeQR</span>
            </button>
          )}
        </div>

        <p className="mt-6 text-[11px] text-slate-500">
          MakeQR Protected Expiration &amp; Link Security
        </p>
      </div>
    </div>
  );
};
