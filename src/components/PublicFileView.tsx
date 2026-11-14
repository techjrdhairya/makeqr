import React, { useEffect, useState, useRef } from 'react';
import { 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowLeft,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { FileData } from '../types';
import { getFileFromStore, unlockFile, FileLockedError } from '../utils/file-store';
import { ExpiredNoticeView } from './ExpiredNoticeView';

interface PublicFileViewProps {
  fileId: string;
  onGoToStudio: () => void;
  onCreateNewQR: () => void;
}

export const PublicFileView: React.FC<PublicFileViewProps> = ({
  fileId,
  onGoToStudio,
  onCreateNewQR,
}) => {
  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectingUrl, setRedirectingUrl] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [expiredInfo, setExpiredInfo] = useState<{ message?: string; dateFormatted?: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [locked, setLocked] = useState<{ id: string; title: string } | null>(null);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const canDownload = file?.allowDownload !== false;

  const handleUnlock = async () => {
    if (!locked || !pw) return;
    setUnlocking(true);
    setPwError(false);
    const token = await unlockFile(locked.id, pw);
    if (!token) {
      setPwError(true);
      setUnlocking(false);
      return;
    }
    try {
      const data = await getFileFromStore(locked.id, token);
      if (data) {
        setFile(data);
        setLocked(null);
        setPw('');
      }
    } catch {
      setPwError(true);
    }
    setUnlocking(false);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const resolveDynamicOrFile = async () => {
      // 1. Check if this is a dynamic short link
      try {
        const dynRes = await fetch(`/api/dynamic/${encodeURIComponent(fileId)}`);
        if (dynRes.ok) {
          const dyn = await dynRes.json();
          if (dyn) {
            // Check dynamic expiration
            if (dyn.expirationDate) {
              const expTime = new Date(dyn.expirationDate).getTime();
              if (!isNaN(expTime) && Date.now() > expTime) {
                if (mounted) {
                  setExpiredInfo({
                    message: dyn.expirationMessage || 'This QR code has reached its expiration date and is no longer available.',
                    dateFormatted: new Date(dyn.expirationDate).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }),
                  });
                  setLoading(false);
                }
                return;
              }
            }

            if (dyn.targetUrl) {
              if (/^https?:\/\//i.test(dyn.targetUrl)) {
                if (mounted) {
                  setRedirectingUrl(dyn.targetUrl);
                  setLoading(false);
                }
                window.location.replace(dyn.targetUrl);
                return;
              }
              const match = dyn.targetUrl.match(/[?&]file=([^&]+)/);
              if (match && match[1]) {
                const underlying = decodeURIComponent(match[1]);
                let fData: FileData | null = null;
                try {
                  fData = await getFileFromStore(underlying);
                } catch (e) {
                  if (e instanceof FileLockedError) {
                    if (mounted) { setLocked({ id: e.fileId, title: e.title }); setLoading(false); }
                    return;
                  }
                  throw e;
                }
                if (mounted) {
                  // Check underlying file expiration
                  if (fData?.expirationDate) {
                    const expTime = new Date(fData.expirationDate).getTime();
                    if (!isNaN(expTime) && Date.now() > expTime) {
                      setExpiredInfo({
                        message: fData.expirationMessage || 'This shared file QR code has expired.',
                        dateFormatted: new Date(fData.expirationDate).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }),
                      });
                      setLoading(false);
                      return;
                    }
                  }

                  setFile(fData);
                  setLoading(false);
                }
                return;
              }
            }
          }
        }
      } catch {}

      // 2. Fetch file directly
      try {
        let data = await getFileFromStore(fileId);
        if (!data && mounted) {
          // Quick retry in case of slight sync propagation delay
          await new Promise((r) => setTimeout(r, 800));
          if (!mounted) return;
          data = await getFileFromStore(fileId);
        }

        if (data?.expirationDate) {
          const expTime = new Date(data.expirationDate).getTime();
          if (!isNaN(expTime) && Date.now() > expTime) {
            if (mounted) {
              setExpiredInfo({
                message: data.expirationMessage || 'This shared file QR code has reached its expiration date.',
                dateFormatted: new Date(data.expirationDate).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }),
              });
              setLoading(false);
            }
            return;
          }
        }

        if (mounted) {
          setFile(data);
          setLoading(false);
        }
      } catch (e) {
        if (e instanceof FileLockedError && mounted) setLocked({ id: e.fileId, title: e.title });
        if (mounted) setLoading(false);
      }
    };

    resolveDynamicOrFile();

    return () => {
      mounted = false;
    };
  }, [fileId]);

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
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const isImage = file?.type.startsWith('image/');
  const isVideo = file?.type.startsWith('video/') || file?.name.endsWith('.mp4');
  const isAudio = file?.type.startsWith('audio/') || file?.name.endsWith('.mp3');
  const isPdf = file?.type === 'application/pdf' || file?.name.endsWith('.pdf');

  if (expiredInfo) {
    return (
      <ExpiredNoticeView
        message={expiredInfo.message}
        expiredDateFormatted={expiredInfo.dateFormatted}
        onGoToStudio={onGoToStudio}
        onCreateNew={onCreateNewQR}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between transition-colors">
      {/* Top Navbar */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <QrCode className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              Make<span className="text-indigo-600 dark:text-indigo-400">QR</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCreateNewQR}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Create QR Code</span>
            </button>
            <button
              type="button"
              onClick={onGoToStudio}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Create a QR
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {redirectingUrl ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-lg border border-slate-200 dark:border-slate-800 max-w-md mx-auto w-full">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent mb-4" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Redirecting...</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 break-all">
              Forwarding you to <span className="font-semibold text-indigo-600 dark:text-indigo-400">{redirectingUrl}</span>
            </p>
            <a
              href={redirectingUrl}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Click to open destination</span>
            </a>
          </div>
        ) : loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-lg border border-slate-200 dark:border-slate-800 max-w-lg mx-auto w-full">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent mb-4" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Retrieving file from cloud storage...</p>
            <p className="text-xs text-slate-400 mt-1">Just a moment</p>
          </div>
        ) : locked ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-lg border border-slate-200 dark:border-slate-800 max-w-md mx-auto w-full">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mx-auto mb-4 dark:bg-indigo-950/60 dark:text-indigo-400">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Password required</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 break-words">
              “{locked.title}” is protected. Enter the password to open it.
            </p>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
              placeholder="Password"
              autoFocus
              className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            {pwError && <p className="mt-2 text-xs font-semibold text-rose-600">Wrong password. Please try again.</p>}
            <button
              type="button"
              onClick={handleUnlock}
              disabled={!pw || unlocking}
              className="mt-4 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {unlocking ? 'Checking…' : 'Unlock'}
            </button>
          </div>
        ) : !file ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-lg border border-slate-200 dark:border-slate-800 max-w-md mx-auto w-full">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mx-auto mb-4 dark:bg-amber-950/60 dark:text-amber-400">
              <FileText className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">File Not Found</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              The requested file could not be found or has expired.
            </p>
            <button
              type="button"
              onClick={onCreateNewQR}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors"
            >
              <span>Create a New QR Code</span>
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Header / Title Bar */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0">
                  {isImage ? <ImageIcon className="h-6 w-6" /> :
                   isVideo ? <Video className="h-6 w-6" /> :
                   isAudio ? <Music className="h-6 w-6" /> :
                   <FileText className="h-6 w-6" />}
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                    {file.title || file.name}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {file.name} • {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
                </button>

                {canDownload && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{downloaded ? 'Downloaded!' : 'Download'}</span>
                </button>
                )}
              </div>
            </div>

            {/* Media Body */}
            <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-center min-h-[360px]">
              {isImage ? (
                <div className="max-w-2xl max-h-[550px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
                  <img
                    src={file.dataUrl}
                    alt={file.name}
                    className="max-h-[520px] w-full object-contain rounded-xl"
                  />
                </div>
              ) : isVideo ? (
                <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-md bg-black border border-slate-800">
                  <video
                    ref={videoRef}
                    src={file.dataUrl}
                    controls
                    controlsList={canDownload ? undefined : 'nodownload'}
                    preload="metadata"
                    playsInline
                    className="w-full max-h-[480px] object-contain"
                  />
                </div>
              ) : isAudio ? (
                <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                  <Music className="h-16 w-16 text-indigo-500 mx-auto mb-4 animate-bounce" />
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-4">{file.name}</h3>
                  <audio
                    src={file.dataUrl}
                    controls
                    className="w-full"
                  />
                </div>
              ) : isPdf ? (
                <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col">
                  <iframe
                    src={`${file.dataUrl}#toolbar=1`}
                    title={file.name}
                    className="w-full flex-1 border-0"
                  />
                </div>
              ) : (
                <div className="p-8 text-center max-w-sm">
                  <FileText className="h-16 w-16 text-indigo-400 mx-auto mb-3" />
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{canDownload ? 'Ready for download' : 'View-only file'}</p>
                  {canDownload && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download File</span>
                  </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer with Security Badge & Create QR prompt */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Verified media file served via MakeQR Cloud Storage.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCreateNewQR}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Create your own QR code →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        MakeQR • Fast, Beautiful, and Production-Ready QR Code Generation
      </footer>
    </div>
  );
};
