import React, { useEffect, useState, useRef } from 'react';
import { 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Globe, 
  Share2, 
  Copy, 
  Sparkles, 
  QrCode,
  FileCheck2
} from 'lucide-react';
import { FileData } from '../types';
import { getFileFromStore } from '../utils/file-store';

interface FileViewerModalProps {
  fileId: string | null;
  onClose: () => void;
  onSelectForQR?: (file: FileData) => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({ 
  fileId, 
  onClose,
  onSelectForQR
}) => {
  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!fileId) return;

    let mounted = true;
    setLoading(true);

    getFileFromStore(fileId).then((data) => {
      if (mounted) {
        setFile(data);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [fileId]);

  const handleClose = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('file');
      url.searchParams.delete('viewFile');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    } catch {}
    onClose();
  };

  if (!fileId) return null;

  const handleDownload = () => {
    if (!file) return;
    const a = document.createElement('a');
    a.href = file.dataUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const handleCopyLink = async () => {
    try {
      const publicLink = `${window.location.origin}/?file=${encodeURIComponent(fileId)}`;
      await navigator.clipboard.writeText(publicLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const isVideo = file?.type?.startsWith('video/') || file?.name?.endsWith('.mp4') || file?.name?.endsWith('.webm') || false;
  const isImage = file?.type?.startsWith('image/') || false;
  const isAudio = file?.type?.startsWith('audio/') || false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-10 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="py-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mb-4" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Retrieving file from database...
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              ID: {fileId}
            </p>
          </div>
        ) : !file ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-3 dark:bg-rose-950/50 dark:text-rose-400">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              File Not Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              This file has been deleted or does not exist.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <span>Back to MakeQR</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header with verified database pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800 pr-8">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/80">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Public Media Link</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60">
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>Database Configured</span>
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                {file.id}
              </span>
            </div>

            {/* Video Player Display */}
            {isVideo ? (
              <div className="space-y-3">
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg border border-slate-800">
                  <video
                    ref={videoRef}
                    controls
                    playsInline
                    preload="metadata"
                    poster={file.previewUrl}
                    className="h-full w-full object-contain"
                  >
                    <source src={file.dataUrl} type={file.type || 'video/mp4'} />
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Title & Metadata */}
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-750">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {file.title || file.name}
                      </h3>
                      {file.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {file.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <span>Format: MP4 (H.264 / AAC)</span>
                    {file.honoree && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Honoree: {file.honoree}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Optional Transcript Accordion */}
                {file.transcript && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowTranscript((prev) => !prev)}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                        <span>View Tribute Poem &amp; Video Transcript</span>
                      </span>
                      <span className="text-slate-400">{showTranscript ? 'Hide' : 'Show'}</span>
                    </button>
                    {showTranscript && (
                      <div className="p-3.5 bg-white dark:bg-slate-900 text-xs leading-relaxed text-slate-600 dark:text-slate-300 italic border-t border-slate-200 dark:border-slate-800 font-serif">
                        "{file.transcript}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : isImage ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 max-h-72 flex items-center justify-center dark:border-slate-800 dark:bg-slate-950">
                <img
                  src={file.dataUrl}
                  alt={file.name}
                  className="max-h-72 w-full object-contain p-2"
                />
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3 shadow-inner dark:bg-indigo-950/60 dark:text-indigo-400">
                  {isAudio ? <Music className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate px-4">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB • {file.type || 'Document'}
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all cursor-pointer"
              >
                {downloaded ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Download Started!</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Download Video (MP4)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Share Link</span>
                  </>
                )}
              </button>

              {onSelectForQR && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectForQR(file);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 py-2.5 px-4 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Make QR Code</span>
                </button>
              )}
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                Close &amp; return to MakeQR Creator
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
