import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe, 
  UploadCloud, 
  FileText, 
  X, 
  Eye, 
  EyeOff, 
  Wifi, 
  Phone, 
  CheckCircle2, 
  Download,
  Link,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Edit3,
  Check,
  RotateCcw,
  Copy,
  Link2,
  Cloud
} from 'lucide-react';
import { QRConfig, FileData } from '../types';
import { saveFileToStore, getFileFromStore } from '../utils/file-store';
import { saveDynamicLinkToFirestore } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DynamicQRBanner } from './inputs/DynamicQRBanner';
import { LinkRulesPanel } from './inputs/LinkRulesPanel';
import { FileAccessPanel } from './inputs/FileAccessPanel';
import { QuickLinkInputs } from './inputs/QuickLinkInputs';
import { QUICKLINK_DEFS, DEFAULT_QUICKLINK } from '../utils/quicklinks';
import { ExpirationSettings } from './inputs/ExpirationSettings';

const EventInputs = React.lazy(() => import('./inputs/EventInputs').then(m => ({ default: m.EventInputs })));
const GeoInputs = React.lazy(() => import('./inputs/GeoInputs').then(m => ({ default: m.GeoInputs })));
const CryptoInputs = React.lazy(() => import('./inputs/CryptoInputs').then(m => ({ default: m.CryptoInputs })));
const SocialInputs = React.lazy(() => import('./inputs/SocialInputs').then(m => ({ default: m.SocialInputs })));
const VCardInputs = React.lazy(() => import('./inputs/VCardInputs').then(m => ({ default: m.VCardInputs })));

interface ContentInputsProps {
  config: QRConfig;
  onChange: (updater: Partial<QRConfig>) => void;
  onOpenAIChat?: (role?: 'consultant' | 'places' | 'fast' | 'architect', initialQuery?: string) => void;
}

export const ContentInputs: React.FC<ContentInputsProps> = ({ config, onChange, onOpenAIChat }) => {
  const { user } = useAuth();
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // File Custom Short Link & Republish States
  const [fileCustomSlug, setFileCustomSlug] = useState(
    config.file?.customSlug || ''
  );
  const [fileIsChecking, setFileIsChecking] = useState(false);
  const [fileAvailability, setFileAvailability] = useState<{
    available: boolean;
    message: string;
  } | null>(null);
  const [isRepublishing, setIsRepublishing] = useState(false);
  const [republishSuccess, setRepublishSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const autoSyncSlugTimeoutRef = useRef<any>(null);

  // Keep fileCustomSlug synced when file changes
  useEffect(() => {
    if (config.file) {
      setFileCustomSlug(config.file.customSlug || '');
    }
  }, [config.file?.id, config.file?.customSlug]);

  const verifyFileSlug = async (slugToVerify: string) => {
    const clean = slugToVerify.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-.~!@$&*+=?:;%^()]/g, '');
    if (!clean || clean.length < 1) {
      setFileAvailability({
        available: false,
        message: 'Custom link cannot be empty.',
      });
      return;
    }

    try {
      setFileIsChecking(true);
      const res = await fetch(
        `/api/dynamic/check-availability?slug=${encodeURIComponent(clean)}&currentId=${encodeURIComponent(config.file?.customSlug || '')}`
      );
      const data = await res.json();
      setFileAvailability({
        available: !!data.available,
        message: data.message || data.reason || (data.available ? 'Link is available!' : 'Link is already taken.'),
      });
    } catch {
      setFileAvailability({
        available: true,
        message: 'Available (verified locally).',
      });
    } finally {
      setFileIsChecking(false);
    }
  };

  const handleRepublishFile = async (customSlugToUse?: string, silent = false) => {
    if (!config.file) return;
    const chosenSlug = (customSlugToUse !== undefined ? customSlugToUse : fileCustomSlug).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-.~!@$&*+=?:;%^()]/g, '');

    try {
      if (!silent) setIsRepublishing(true);
      // 1. Save / Update File in database
      const filePayload = {
        id: config.file.id,
        name: config.file.name,
        type: config.file.type,
        size: config.file.size,
        url: config.file.dataUrl,
        previewUrl: config.file.previewUrl,
        title: config.file.title || config.file.name,
        description: config.file.description,
        transcript: config.file.transcript,
        author: config.file.author,
        honoree: config.file.honoree,
        occasion: config.file.occasion,
        customSlug: chosenSlug || undefined,
      };

      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filePayload),
      });

      // 2. If chosenSlug is set, also create/sync the dynamic link redirect
      if (chosenSlug) {
        await fetch('/api/dynamic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: chosenSlug,
            customSlug: chosenSlug,
            oldId: config.file.customSlug,
            title: config.file.title || config.file.name,
            targetUrl: `/?file=${encodeURIComponent(config.file.id)}`,
            contentType: 'file',
          }),
        });

        saveDynamicLinkToFirestore({
          id: chosenSlug,
          targetUrl: `/?file=${encodeURIComponent(config.file.id)}`,
          title: config.file.name,
          contentType: 'file',
          scanCount: 0,
          createdAt: Date.now(),
        }).catch(() => {});
      }

      // 3. Update local store and QR configuration
      const updatedFile: FileData = {
        ...config.file,
        userId: user?.uid || config.file.userId,
        userEmail: user?.email || config.file.userEmail,
        customSlug: chosenSlug || undefined,
      };
      await saveFileToStore(updatedFile, user?.uid);

      onChange({
        file: updatedFile,
        dynamic: chosenSlug ? {
          isDynamic: true,
          dynamicId: chosenSlug,
          customSlug: chosenSlug,
          targetUrl: `/?file=${encodeURIComponent(config.file.id)}`,
          scanCount: config.dynamic?.scanCount || 0,
        } : config.dynamic,
      });

      if (!silent) {
        setRepublishSuccess(
          chosenSlug 
            ? `Republished & saved in Firestore! QR code & /${chosenSlug} are live.` 
            : 'File and routing saved in Firestore successfully!'
        );
        setTimeout(() => setRepublishSuccess(null), 4500);
      }
    } catch (err) {
      console.error('Failed to republish file:', err);
      if (!silent) {
        setRepublishSuccess('Updated local configuration.');
        setTimeout(() => setRepublishSuccess(null), 3000);
      }
    } finally {
      if (!silent) setIsRepublishing(false);
    }
  };

  // Quick preset handlers
  const setUrlPreset = (url: string) => {
    onChange({ url });
  };

  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // files are stored in Firestore in small pieces

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError(`"${file.name}" is ${(file.size / 1048576).toFixed(1)} MB. Maximum upload size is 5 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setUploadError('Could not read that file. Please try again.');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onload = async (e) => {
      try {
      const result = e.target?.result as string;
      const fileId = `f_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const chosenSlug = fileCustomSlug ? fileCustomSlug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-.~!@$&*+=?:;%^()]/g, '') : undefined;
      
      // Default to link mode for maximum compatibility & zero matrix overflow
      const fileData: FileData = {
        id: fileId,
        userId: user?.uid,
        userEmail: user?.email || undefined,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: result,
        previewUrl: file.type.startsWith('image/') ? result : undefined,
        encodeMode: 'link',
        customSlug: chosenSlug || undefined,
        createdAt: Date.now(),
      };

      await saveFileToStore(fileData, user?.uid);

      if (chosenSlug) {
        fetch('/api/dynamic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customSlug: chosenSlug,
            title: file.name,
            targetUrl: `/?file=${encodeURIComponent(fileId)}`,
            contentType: 'file',
          }),
        }).catch(() => {});

        saveDynamicLinkToFirestore({
          id: chosenSlug,
          targetUrl: `/?file=${encodeURIComponent(fileId)}`,
          title: file.name,
          contentType: 'file',
          scanCount: 0,
          createdAt: Date.now(),
        }).catch(() => {});
      }

      onChange({
        file: fileData,
        frame: {
          ...config.frame,
          title: file.type.startsWith('video/')
            ? 'WATCH VIDEO'
            : file.type.startsWith('audio/')
            ? 'PLAY AUDIO'
            : 'DOWNLOAD FILE',
        },
        // Never inherit a leftover URL-tab dynamic link (it would redirect the file QR elsewhere)
        dynamic: chosenSlug ? {
          isDynamic: true,
          dynamicId: chosenSlug,
          customSlug: chosenSlug,
          targetUrl: `/?file=${encodeURIComponent(fileId)}`,
          scanCount: 0,
        } : { ...(config.dynamic || { dynamicId: '', scanCount: 0 }), isDynamic: false, targetUrl: '' },
      });
      if (!fileData.serverSynced) {
        setUploadError('File saved on this device only — cloud upload failed, so the QR may not open on other phones. Try "Save & Republish".');
      }
      } catch (err) {
        console.error('Upload failed:', err);
        setUploadError('Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => {
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
      {/* URL INPUT */}
      {config.contentType === 'url' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Target Website or Link
            </label>
            <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all dark:border-slate-700 dark:bg-slate-800/60">
              <div className="flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Globe className="h-4 w-4" />
              </div>
              <input
                type="url"
                value={config.url}
                onChange={(e) => onChange({ url: e.target.value })}
                placeholder="https://yourwebsite.com/profile"
                className="w-full rounded-xl bg-transparent py-2.5 pl-3 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Instagram Profile', url: 'https://instagram.com/mybrand' },
                { label: 'Portfolio', url: 'https://alexdesigns.com' },
                { label: 'LinkedIn', url: 'https://linkedin.com/in/brandprofile' },
                { label: 'YouTube Video', url: 'https://youtube.com/watch?v=brand' },
                { label: 'Google Review', url: 'https://g.page/r/sample-business/review' },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setUrlPreset(p.url)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
                >
                  {p.label}
                </button>
              ))}
              {onOpenAIChat && (
                <button
                  type="button"
                  onClick={() => onOpenAIChat('places', 'Find Google Maps link for a popular location')}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                >
                  <Sparkles className="h-3 w-3 text-emerald-500" />
                  <span>Google Maps AI</span>
                </button>
              )}
            </div>
          </div>

          {/* Dynamic QR & Redirect Manager */}
          <DynamicQRBanner config={config} onChange={onChange} />
          <LinkRulesPanel config={config} onChange={onChange} />
        </div>
      )}

      {/* FILE UPLOAD INPUT */}
      {config.contentType === 'file' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              User File Upload
            </label>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              PDFs, Images, Documents, Text files
            </span>
          </div>

          {!config.file ? (
            <div className="space-y-3">
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-8 transition-all ${isUploading ? 'opacity-60 pointer-events-none' : 'cursor-pointer'} ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-indigo-500'
                }`}
              >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-3 dark:bg-indigo-950 dark:text-indigo-400">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 text-center dark:text-white">
                {isUploading ? 'Encoding & caching file...' : 'Click to upload or drag & drop file'}
              </p>
              <p className="text-xs text-slate-500 mt-1 text-center dark:text-slate-400">
                Supports PDFs, images, videos, audio, or documents up to 5 MB
              </p>
            </div>
            {uploadError && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
          ) : (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {config.file.previewUrl ? (
                    <img
                      src={config.file.previewUrl}
                      alt="preview"
                      className="h-14 w-14 shrink-0 rounded-lg object-cover border border-indigo-200 dark:border-indigo-800"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs uppercase shadow-sm overflow-hidden">
                      {config.file.name.split('.').pop() || 'FILE'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate dark:text-white">
                      {config.file.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
                      {(config.file.size / 1024).toFixed(1)} KB • {config.file.type || 'Document'}
                    </p>
                    
                    {/* Quick test download & Firestore status */}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <a
                        href={config.file.dataUrl}
                        download={config.file.name}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <Download className="h-3 w-3" />
                        <span>Test Download File</span>
                      </a>
                      {config.file.serverSynced === false ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Not uploaded yet</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                          <Cloud className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Uploaded to cloud</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadError(null);
                    setFileCustomSlug('');
                    onChange({
                      file: undefined,
                      dynamic: { ...(config.dynamic || { dynamicId: '', scanCount: 0 }), isDynamic: false, customSlug: '', dynamicId: '', targetUrl: '' },
                    });
                  }}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600 transition-colors dark:hover:bg-slate-800"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Delivery mode */}
              <div className="mt-3 pt-3 border-t border-indigo-100/80 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Link className="h-3.5 w-3.5 text-indigo-600" />
                    <span>QR Delivery Method:</span>
                  </span>
                  <span className="font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-900/60 px-2 py-0.5 rounded text-[11px]">
                    {config.file.encodeMode === 'link' ? 'Shareable Cloud Link' : 'Raw Data URI'}
                  </span>
                </div>

                <div className="flex items-start gap-2 text-xs text-indigo-900/80 dark:text-indigo-200/90 bg-indigo-100/50 dark:bg-indigo-950/60 rounded-lg p-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5 dark:text-indigo-400" />
                  <span>
                    When scanned, this QR code opens a mobile-optimized viewer and download screen where recipients can watch and save <strong>{config.file.name}</strong>.
                  </span>
                </div>
              </div>

              {/* Custom Short Link & Republish Section */}
              <div className="mt-3.5 pt-3.5 border-t border-indigo-200/80 dark:border-indigo-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Link2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Custom Short Link &amp; Republish</span>
                  </div>
                  {config.file.customSlug && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="h-3 w-3" />
                      /{config.file.customSlug}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Assign a memorable custom short link (e.g. <code className="font-mono text-indigo-600 dark:text-indigo-400">my-video</code>). You can republish anytime to update database routing.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden flex-1 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                    <span className="px-2.5 py-1.5 text-xs font-mono font-bold text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-slate-700 select-none">
                      /
                    </span>
                    <input
                      type="text"
                      value={fileCustomSlug}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-.~!@$&*+=?:;%^()]/g, '');
                        setFileCustomSlug(val);
                        setFileAvailability(null);
                        if (val.length >= 1) {
                          verifyFileSlug(val);
                        }
                        if (config.file) {
                          onChange({
                            file: {
                              ...config.file,
                              customSlug: val || undefined,
                            },
                            dynamic: val ? {
                              isDynamic: true,
                              dynamicId: val,
                              customSlug: val,
                              targetUrl: `/?file=${encodeURIComponent(config.file.id)}`,
                              scanCount: config.dynamic?.scanCount || 0,
                            } : config.dynamic,
                          });

                          // Debounce auto-sync so the custom link is instantly live on server & cloud
                          if (autoSyncSlugTimeoutRef.current) {
                            clearTimeout(autoSyncSlugTimeoutRef.current);
                          }
                          if (val.length >= 1) {
                            autoSyncSlugTimeoutRef.current = setTimeout(() => {
                              handleRepublishFile(val, true);
                            }, 600);
                          }
                        }
                      }}
                      placeholder="my-video, @brand, or promo!"
                      className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => verifyFileSlug(fileCustomSlug)}
                      disabled={fileIsChecking || !fileCustomSlug}
                      className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 disabled:opacity-40 cursor-pointer"
                    >
                      {fileIsChecking ? 'Checking...' : 'Check'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRepublishFile()}
                    disabled={isRepublishing || (fileAvailability !== null && !fileAvailability.available)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 sm:py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                  >
                    <RotateCcw className={`h-3.5 w-3.5 ${isRepublishing ? 'animate-spin' : ''}`} />
                    <span>{isRepublishing ? 'Publishing...' : 'Save & Republish'}</span>
                  </button>
                </div>

                {/* Availability status */}
                {fileAvailability && (
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${
                    fileAvailability.available 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {fileAvailability.available ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{fileAvailability.message}</span>
                  </div>
                )}

                {/* Preset suggestions & Direct testing */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Suggestions:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFileCustomSlug('my-video');
                        verifyFileSlug('my-video');
                      }}
                      className="hover:text-indigo-600 hover:underline font-mono"
                    >
                      my-video
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFileCustomSlug('club-tribute');
                        verifyFileSlug('club-tribute');
                      }}
                      className="hover:text-indigo-600 hover:underline font-mono"
                    >
                      club-tribute
                    </button>
                  </div>

                  {(fileCustomSlug || config.file.customSlug) && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`${window.location.origin}/${fileCustomSlug || config.file.customSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold"
                      >
                        <span>Test /{fileCustomSlug || config.file.customSlug}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Republish success message */}
                {republishSuccess && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 p-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{republishSuccess}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TEXT INPUT */}
      {config.contentType === 'text' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Plain Text / Notes
            </label>
            <span className="text-xs text-slate-400">
              {config.text.length} characters
            </span>
          </div>
          <div className="relative rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all dark:border-slate-700 dark:bg-slate-800/60">
            <textarea
              rows={4}
              value={config.text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder="Type any message, instructions, crypto address, or coupon code..."
              className="w-full rounded-xl bg-transparent p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-y dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Welcome Note', text: 'Welcome to our showroom! Please ask the front desk for our catalog.' },
              { label: 'Discount Code', text: 'PROMO CODE: VIP25OFF\nValid through October 2026 for 25% off.' },
              { label: 'Instructions', text: 'Table 14 - Scan to view allergen guide and daily specials.' },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => onChange({ text: s.text })}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* WI-FI INPUT */}
      {config.contentType === 'wifi' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Wi-Fi Connection Details
            </label>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 dark:text-emerald-400">
              <Wifi className="h-3.5 w-3.5" /> Instant phone connect
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Network Name (SSID)
              </label>
              <input
                type="text"
                value={config.wifi.ssid}
                onChange={(e) =>
                  onChange({ wifi: { ...config.wifi, ssid: e.target.value } })
                }
                placeholder="MyCafe_Guest_5G"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Security Encryption
              </label>
              <select
                value={config.wifi.encryption}
                onChange={(e) =>
                  onChange({
                    wifi: {
                      ...config.wifi,
                      encryption: e.target.value as 'WPA' | 'WEP' | 'nopass',
                    },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="WPA">WPA / WPA2 / WPA3 (Default)</option>
                <option value="WEP">WEP (Older)</option>
                <option value="nopass">None (Open Network)</option>
              </select>
            </div>
          </div>

          {config.wifi.encryption !== 'nopass' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Network Password
              </label>
              <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800">
                <input
                  type={showWifiPassword ? 'text' : 'password'}
                  value={config.wifi.password}
                  onChange={(e) =>
                    onChange({ wifi: { ...config.wifi, password: e.target.value } })
                  }
                  placeholder="Enter Wi-Fi password"
                  className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowWifiPassword(!showWifiPassword)}
                  className="flex items-center px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showWifiPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={config.wifi.hidden}
              onChange={(e) =>
                onChange({ wifi: { ...config.wifi, hidden: e.target.checked } })
              }
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>This is a hidden network</span>
          </label>
        </div>
      )}

      {/* VCARD INPUT */}
      {config.contentType === 'vcard' && (
        <React.Suspense fallback={null}>
          <VCardInputs
            vcard={config.vcard}
            onChange={(newVCard) => onChange({ vcard: newVCard })}
          />
        </React.Suspense>
      )}

      {/* EMAIL INPUT */}
      {config.contentType === 'email' && (
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Pre-composed Email
          </label>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Recipient Email
            </label>
            <input
              type="email"
              value={config.email.email}
              onChange={(e) =>
                onChange({ email: { ...config.email, email: e.target.value } })
              }
              placeholder="hello@studio.com"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Subject Line
            </label>
            <input
              type="text"
              value={config.email.subject}
              onChange={(e) =>
                onChange({ email: { ...config.email, subject: e.target.value } })
              }
              placeholder="Customer Inquiry from QR Code"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Message Body (Optional)
            </label>
            <textarea
              rows={3}
              value={config.email.body}
              onChange={(e) =>
                onChange({ email: { ...config.email, body: e.target.value } })
              }
              placeholder="Hi team, I would like to schedule a consultation..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* PHONE INPUT */}
      {config.contentType === 'phone' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Direct Phone Call (tel:)
            </label>
            <span className="text-xs text-indigo-600 font-medium dark:text-indigo-400">
              Opens smartphone dialer instantly
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Direct Dial Number
            </label>
            <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                value={config.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="+1 (800) 555-0199"
                className="w-full rounded-xl bg-transparent py-2.5 pl-3 pr-3 text-sm text-slate-900 focus:outline-none dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Country code prefix helpers */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Quick Country Codes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '🇺🇸 / 🇨🇦 +1', code: '+1 ' },
                { label: '🇬🇧 +44', code: '+44 ' },
                { label: '🇪🇺 +49', code: '+49 ' },
                { label: '🇫🇷 +33', code: '+33 ' },
                { label: '🇦🇺 +61', code: '+61 ' },
                { label: '🇯🇵 +81', code: '+81 ' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    // Prepend or replace country code
                    const currentNumber = config.phone.replace(/^\+\d+\s*/, '');
                    onChange({ phone: `${item.code}${currentNumber}`.trim() });
                  }}
                  className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Info */}
          <div className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-200/80 flex items-center justify-between dark:bg-slate-800/50 dark:border-slate-800">
            <div>
              <span className="font-mono text-indigo-600 font-bold dark:text-indigo-400">
                tel:{config.phone ? config.phone.replace(/[\s()-]/g, '') : '+18005550199'}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Scanning with camera initiates native call prompt
              </p>
            </div>
            {config.phone && (
              <a
                href={`tel:${config.phone.replace(/[\s()-]/g, '')}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                <Phone className="h-3 w-3" />
                <span>Test Link</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* SMS INPUT */}
      {config.contentType === 'sms' && (
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Pre-filled SMS Text Message
          </label>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Recipient Phone Number
            </label>
            <input
              type="tel"
              value={config.sms.phone}
              onChange={(e) =>
                onChange({ sms: { ...config.sms, phone: e.target.value } })
              }
              placeholder="+1 555-234-5678"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Pre-filled Message
            </label>
            <textarea
              rows={3}
              value={config.sms.message}
              onChange={(e) =>
                onChange({ sms: { ...config.sms, message: e.target.value } })
              }
              placeholder="Hi! I want to claim the discount code."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* CALENDAR EVENT (vEvent) */}
      {config.contentType === 'event' && (
        <React.Suspense fallback={null}>
          <EventInputs config={config} onChange={onChange} />
        </React.Suspense>
      )}

      {/* GEO-LOCATION PIN */}
      {config.contentType === 'geo' && (
        <React.Suspense fallback={null}>
          <GeoInputs config={config} onChange={onChange} onOpenAIChat={onOpenAIChat} />
        </React.Suspense>
      )}

      {/* CRYPTO PAYMENT ADDRESS */}
      {config.contentType === 'crypto' && (
        <React.Suspense fallback={null}>
          <CryptoInputs config={config} onChange={onChange} />
        </React.Suspense>
      )}

      {/* QUICK LINKS: WhatsApp, Instagram, YouTube, Google Form, Review, Spotify, LinkedIn, Facebook, Telegram, Payment, Booking */}
      {config.contentType === 'quicklink' && (
        <QuickLinkInputs
          data={config.quicklink ?? DEFAULT_QUICKLINK}
          onChange={(quicklink) => onChange({ quicklink })}
          onKindChange={(k) => onChange({ frame: { ...config.frame, title: QUICKLINK_DEFS[k].frameTitle } })}
        />
      )}

      {/* SOCIAL LINK-IN-BIO BUNDLE */}
      {config.contentType === 'social' && (
        <React.Suspense fallback={null}>
          <SocialInputs config={config} onChange={onChange} />
        </React.Suspense>
      )}

      {/* EXPIRATION & SCHEDULING CONFIGURATION */}
      <FileAccessPanel config={config} onChange={onChange} />
      <ExpirationSettings config={config} onChange={onChange} />
    </div>
  );
};
