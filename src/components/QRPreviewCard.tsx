import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import confetti from 'canvas-confetti';
import { 
  Download, 
  Copy, 
  Printer, 
  BookmarkPlus, 
  Check, 
  AlertTriangle, 
  Maximize2, 
  Smartphone, 
  CreditCard, 
  Coffee, 
  Sparkles,
  ChevronDown,
  CheckCircle2,
  FileText,
  Layers,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { QRConfig, ScanVerificationResult } from '../types';
import { 
  buildQRCodeStylingOptions, 
  compositeFramedQR, 
  calculateScanHealth,
  verifyQRCodeScannability 
} from '../utils/qr-generator';
import { 
  exportSingleQRPDF, 
  exportMultiStickerSheetPDF,
  exportFoldableTableTentPDF 
} from '../utils/pdf-export';
import { useCoins } from '../context/CoinsContext';

const BatchGeneratorModal = React.lazy(() => import('./BatchGeneratorModal').then(m => ({ default: m.BatchGeneratorModal })));

interface QRPreviewCardProps {
  config: QRConfig;
  onSaveToHistory: (previewThumbnail: string) => void;
  onDownloadSuccess?: () => void;
  onStartNew?: () => void;
  isCloudUser?: boolean;
  onRequireSignIn?: () => void;
}

type PreviewMockup = 'studio' | 'tabletent' | 'phone' | 'businesscard';

export const QRPreviewCard: React.FC<QRPreviewCardProps> = ({ 
  config, 
  onSaveToHistory, 
  onDownloadSuccess,
  onStartNew,
  isCloudUser,
  onRequireSignIn
}) => {
  const qrStagingRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const qrCodeInstanceRef = useRef<QRCodeStyling | null>(null);

  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [mockupMode, setMockupMode] = useState<PreviewMockup>('studio');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportRes, setExportRes] = useState<number>(2048);
  const [showResMenu, setShowResMenu] = useState(false);
  const [showPdfMenu, setShowPdfMenu] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [scanVerification, setScanVerification] = useState<ScanVerificationResult | null>(null);

  const { isFeatureUnlocked, openCoinsModal, earnCoins, guestTrialAvailable } = useCoins();
  const isSvgUnlocked = isFeatureUnlocked('svg-4k-export');
  const isBatchUnlocked = isFeatureUnlocked('batch-generator');

  const health = calculateScanHealth(config);

  // Initialize or update QRCodeStyling safely
  useEffect(() => {
    setRenderError(null);
    try {
      const options = buildQRCodeStylingOptions(config, 360);
      if (!qrCodeInstanceRef.current) {
        qrCodeInstanceRef.current = new QRCodeStyling(options);
      } else {
        qrCodeInstanceRef.current.update(options);
      }
    } catch (err) {
      console.error('Failed to initialize/update QRCodeStyling:', err);
      setRenderError('Error calculating QR matrix. Check data length or shapes.');
      return;
    }

    const renderFramed = async () => {
      try {
        const rawBlob = await qrCodeInstanceRef.current?.getRawData('png');
        if (!rawBlob) return;

        const img = new Image();
        const url = URL.createObjectURL(rawBlob as Blob);
        img.onload = async () => {
          try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const ctx = tempCanvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);

              // Auto-scan self-verification loop with jsQR
              const verification = verifyQRCodeScannability(tempCanvas);
              setScanVerification(verification);

              const framed = await compositeFramedQR(tempCanvas, config, 360);

              // Copy to display canvas (persistent reference for exports)
              const displayCanvas = displayCanvasRef.current;
              if (displayCanvas) {
                displayCanvas.width = framed.width;
                displayCanvas.height = framed.height;
                const displayCtx = displayCanvas.getContext('2d');
                displayCtx?.drawImage(framed, 0, 0);
              }

              // Update preview data URL for instant reactive display across all mockups
              const dataUrl = framed.toDataURL('image/png');
              setPreviewDataUrl(dataUrl);
            }
          } catch (frameErr) {
            console.error('Error drawing frame:', frameErr);
          } finally {
            URL.revokeObjectURL(url);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } catch (err) {
        console.error('Error rendering framed QR:', err);
      }
    };

    renderFramed();
  }, [config]);

  // Export High-Res PNG
  const downloadPNG = async (targetSize: number = 2048) => {
    if (targetSize === 4096 && !isSvgUnlocked) {
      openCoinsModal({
        id: 'svg-4k-export',
        name: 'Ultra-HD 4K & Vector SVG Export',
        cost: 10,
        description: 'Download infinitely scalable vector SVG and ultra-sharp 4096px print-ready files.',
      });
      return;
    }

    setIsExporting(true);
    try {
      const qrExporter = new QRCodeStyling(buildQRCodeStylingOptions(config, targetSize));
      const rawBlob = await qrExporter.getRawData('png');
      if (!rawBlob) return;

      const img = new Image();
      const url = URL.createObjectURL(rawBlob as Blob);
      img.onload = async () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const framed = await compositeFramedQR(tempCanvas, config, targetSize);
          
          const downloadUrl = framed.toDataURL('image/png');
          const a = document.createElement('a');
          a.download = `qr-code-${config.contentType}-${Date.now()}.png`;
          a.href = downloadUrl;
          a.click();

          // Auto-save to History & Cloud (handles deduplicated coin rewards)
          try {
            const thumb = displayCanvasRef.current ? displayCanvasRef.current.toDataURL('image/png', 0.85) : downloadUrl;
            onSaveToHistory(thumb);
          } catch (saveErr) {
            console.warn('Auto-save on PNG download note:', saveErr);
          }

          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#6366f1', '#a855f7', '#10b981', '#f59e0b'],
          });
          onDownloadSuccess?.();
        }
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };
      img.src = url;
    } catch (err) {
      console.error('PNG export failed', err);
      setIsExporting(false);
    }
  };

  // Export Vector SVG
  const downloadSVG = async () => {
    if (!isSvgUnlocked) {
      openCoinsModal({
        id: 'svg-4k-export',
        name: 'Ultra-HD 4K & Vector SVG Export',
        cost: 10,
        description: 'Download infinitely scalable vector SVG and ultra-sharp 4096px print-ready files.',
      });
      return;
    }

    try {
      const qrExporter = new QRCodeStyling({
        ...buildQRCodeStylingOptions(config, 600),
        type: 'svg',
      });
      await qrExporter.download({
        name: `qr-code-${config.contentType}-${Date.now()}`,
        extension: 'svg',
      });

      // Auto-save to History & Cloud (handles deduplicated coin rewards)
      try {
        const thumb = displayCanvasRef.current ? displayCanvasRef.current.toDataURL('image/png', 0.85) : '';
        onSaveToHistory(thumb);
      } catch (saveErr) {
        console.warn('Auto-save on SVG download note:', saveErr);
      }

      onDownloadSuccess?.();
    } catch (err) {
      console.error('SVG export failed', err);
    }
  };

  // Copy to Clipboard
  const copyToClipboard = async () => {
    if (!displayCanvasRef.current) return;
    try {
      displayCanvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Save to Library / History
  const handleSave = () => {
    if (!isCloudUser) {
      onRequireSignIn?.();
      return;
    }
    if (!displayCanvasRef.current) return;
    const thumbnail = displayCanvasRef.current.toDataURL('image/png', 0.85);
    onSaveToHistory(thumbnail);
    setSaved(true);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#a855f7', '#10b981', '#f59e0b'],
    });

    onDownloadSuccess?.();
    setTimeout(() => setSaved(false), 2500);
  };

  // Print direct
  const handlePrint = () => {
    if (!displayCanvasRef.current) return;
    const dataUrl = displayCanvasRef.current.toDataURL('image/png');
    try {
      onSaveToHistory(dataUrl);
    } catch {}
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print QR Code</title>
            <style>
              body {
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: system-ui, sans-serif;
                background: #ffffff;
              }
              img {
                max-width: 480px;
                height: auto;
              }
              @media print {
                body { padding: 2cm; }
                img { max-width: 100%; }
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleExportSinglePDF = () => {
    if (!displayCanvasRef.current) return;
    exportSingleQRPDF(
      displayCanvasRef.current,
      config.frame.title || 'Scan to Connect',
      config.frame.subtitle || 'Point smartphone camera at the QR code'
    );
    setShowPdfMenu(false);
  };

  const handleExportStickersPDF = (grid: '2x3' | '3x4') => {
    if (!displayCanvasRef.current) return;
    exportMultiStickerSheetPDF(
      displayCanvasRef.current,
      config.frame.title || 'Scan Me',
      grid
    );
    setShowPdfMenu(false);
  };

  const handleExportFoldableTableTent = () => {
    if (!displayCanvasRef.current) return;
    exportFoldableTableTentPDF(
      displayCanvasRef.current,
      config.frame.title || 'Scan for Menu & Pay',
      'Table 04'
    );
    setShowPdfMenu(false);
  };

  return (
    <div className="sticky top-20 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-6 dark:border-slate-800 dark:bg-slate-900 transition-colors">
      {/* Hidden Staging Div for qr-code-styling and master persistent display canvas */}
      <div ref={qrStagingRef} className="hidden" />
      <canvas ref={displayCanvasRef} className="hidden" />

      {/* Card Header & Mockup Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center lg:flex-col lg:items-start 2xl:flex-row 2xl:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Live Preview & Branding
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time high-resolution render
          </p>
        </div>

        {/* Mockup View Selector */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80 self-start sm:self-auto lg:self-start 2xl:self-auto dark:border-slate-700 dark:bg-slate-800">
          {[
            { id: 'studio', label: 'Studio', icon: Maximize2 },
            { id: 'tabletent', label: 'Table Tent', icon: Coffee },
            { id: 'phone', label: 'Phone', icon: Smartphone },
            { id: 'businesscard', label: 'Card', icon: CreditCard },
          ].map((m) => {
            const Icon = m.icon;
            const isSelected = mockupMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMockupMode(m.id as PreviewMockup)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200 dark:bg-slate-700 dark:text-indigo-300 dark:ring-slate-600'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title={`Preview in ${m.label} perspective`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline whitespace-nowrap">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Error Alert if any */}
      {renderError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <span>{renderError}</span>
        </div>
      )}

      {/* Main Canvas Display with Mockup Perspectives */}
      <div className="relative flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200/70 bg-radial from-slate-50 to-slate-100/90 p-6 overflow-hidden dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
        {/* Decorative Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* 1. STUDIO VIEW */}
        {mockupMode === 'studio' && (
          <div className="relative z-10 flex flex-col items-center">
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Framed QR Code"
                className="max-h-[340px] max-w-full rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/60 object-contain transition-transform hover:scale-[1.02]"
              />
            ) : (
              <div className="h-64 w-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>
        )}

        {/* 2. TABLE TENT / RESTAURANT STAND VIEW */}
        {mockupMode === 'tabletent' && (
          <div className="relative z-10 flex flex-col items-center py-2 w-full max-w-[340px]">
            {/* 3D-styled foldable table tent standing card */}
            <div className="relative rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100/90 p-5 pb-7 shadow-2xl shadow-amber-950/15 border border-amber-200/90 backdrop-blur-xs w-full text-center dark:from-slate-900 dark:to-slate-800/90 dark:border-slate-700">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/80 text-amber-950 text-[10px] font-extrabold uppercase tracking-wider mb-3 dark:bg-amber-950/80 dark:text-amber-300">
                <Coffee className="h-3 w-3" />
                <span>Table 04 • Standing Card</span>
              </div>
              
              <div className="rounded-xl bg-white p-3 shadow-md border border-slate-200/80 mx-auto dark:bg-slate-950 dark:border-slate-800 max-w-[240px]">
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Table Tent QR Code"
                    className="max-h-[220px] max-w-full mx-auto rounded-lg object-contain"
                  />
                ) : (
                  <div className="h-48 w-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg mx-auto" />
                )}
              </div>

              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {config.frame.title || 'Scan to Order & Pay'}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Point smartphone camera at the code
                </p>
              </div>

              {/* Realistic tent base shadow */}
              <div className="absolute -bottom-2.5 left-8 right-8 h-3 rounded-full bg-amber-950/25 blur-[5px] dark:bg-black/60 pointer-events-none" />
            </div>
          </div>
        )}

        {/* 3. PHONE VIEW */}
        {mockupMode === 'phone' && (
          <div className="relative z-10 flex flex-col items-center py-2">
            <div className="w-[280px] rounded-[38px] bg-slate-900 p-3.5 shadow-2xl ring-1 ring-slate-800 relative">
              {/* Speaker pill & Dynamic Island */}
              <div className="mx-auto h-4 w-24 rounded-full bg-slate-950 mb-3 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-700 mr-2" />
                <div className="h-2 w-2 rounded-full bg-indigo-950" />
              </div>

              <div className="rounded-[28px] bg-white p-4 text-center dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {config.contentType === 'phone' ? 'Direct Dial' : 'Wallet Pass'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">MakeQR</span>
                </div>

                <div className="rounded-2xl bg-slate-50 p-2.5 border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                  {previewDataUrl ? (
                    <img
                      src={previewDataUrl}
                      alt="Phone Screen QR Code"
                      className="mx-auto max-h-[195px] max-w-full rounded-lg object-contain"
                    />
                  ) : (
                    <div className="h-44 w-44 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg mx-auto" />
                  )}
                </div>

                <div className="mt-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-white block truncate">
                    {config.contentType === 'phone'
                      ? `Call: ${config.phone || 'Ready to Dial'}`
                      : config.contentType === 'wifi'
                      ? 'Wi-Fi Access Key'
                      : config.contentType === 'vcard'
                      ? `${config.vcard.firstName} ${config.vcard.lastName}`
                      : 'Ready to Scan'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Hold near camera or scanner
                  </span>
                </div>
              </div>
              <div className="mx-auto mt-2.5 h-1 w-24 rounded-full bg-slate-700" />
            </div>
          </div>
        )}

        {/* 4. BUSINESS CARD VIEW */}
        {mockupMode === 'businesscard' && (
          <div className="relative z-10 flex flex-col items-center py-4">
            <div className="w-full max-w-[340px] rounded-2xl bg-white p-5 shadow-xl border border-slate-200 flex items-center justify-between gap-4 dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">
                  {config.vcard.firstName?.[0] || 'Q'}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {config.vcard.firstName} {config.vcard.lastName}
                </h4>
                <p className="text-xs text-indigo-600 font-semibold dark:text-indigo-400 truncate">
                  {config.vcard.title || 'Brand Director'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {config.vcard.company || 'Studio Studio'}
                </p>
                <p className="text-[10px] text-slate-400 pt-1 font-mono truncate">
                  {config.vcard.phone || '+1 (555) 019-2831'}
                </p>
              </div>
              <div className="shrink-0">
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Business Card QR"
                    className="h-28 w-28 rounded-lg object-contain border border-slate-100 shadow-xs dark:border-slate-800"
                  />
                ) : (
                  <div className="h-28 w-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expiration Status Warning / Notice */}
      {config.expirationDate && (() => {
        const expTime = new Date(config.expirationDate).getTime();
        if (isNaN(expTime)) return null;
        const isExpired = Date.now() > expTime;
        const formatted = new Date(config.expirationDate).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        return (
          <div
            className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold border transition-all ${
              isExpired
                ? 'bg-rose-50/90 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300'
                : 'bg-amber-50/90 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isExpired ? (
                <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              ) : (
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <div>
                <span className="font-bold">
                  {isExpired ? 'Code Expired' : 'Expiration Scheduled'}
                </span>
                <span className="font-normal ml-1.5 opacity-90">
                  {isExpired
                    ? `(Expired on ${formatted})`
                    : `(Active until ${formatted})`}
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/60 dark:bg-slate-900/60 shrink-0">
              {isExpired ? 'Expired' : 'Expires Soon'}
            </span>
          </div>
        );
      })()}

      {/* Self-Verification Loop Result */}
      {scanVerification && (
        <div
          className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold border transition-all ${
            scanVerification.verified
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300'
              : 'bg-rose-50/80 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {scanVerification.verified ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {scanVerification.verified ? '✓ Scans cleanly' : '⚠️ Scanability Risk'}
              </span>
              <span className="font-normal ml-1.5 opacity-80 hidden sm:inline">
                {scanVerification.verified
                  ? `(Verified by camera decoder in ${scanVerification.latencyMs}ms)`
                  : scanVerification.errorReason}
              </span>
            </div>
          </div>
          {scanVerification.verified && scanVerification.decodedData && (
            <span className="text-[10px] font-mono opacity-70 truncate max-w-[130px] hidden md:inline">
              Decodes: {scanVerification.decodedData}
            </span>
          )}
        </div>
      )}

      {/* Scanability Health Gauge */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold ${
                health.grade === 'Excellent'
                  ? 'bg-emerald-500'
                  : health.grade === 'Good'
                  ? 'bg-indigo-500'
                  : health.grade === 'Fair'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            >
              ✓
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Scanability Score: {health.score}%
              </span>
              <span className="ml-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                ({health.grade} • Contrast {health.contrastRatio}:1)
              </span>
            </div>
          </div>

          <div className="h-2 w-20 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                health.score >= 85
                  ? 'bg-emerald-500'
                  : health.score >= 70
                  ? 'bg-indigo-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${health.score}%` }}
            />
          </div>
        </div>

        {health.warnings.length > 0 && (
          <div className="space-y-1 pt-1">
            {health.warnings.map((w, idx) => (
              <div
                key={idx}
                className="flex items-start gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50/80 rounded-lg p-1.5 border border-amber-200/50 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primary Action & Download Buttons */}
      <div className="space-y-2.5">
        {/* Download PNG (High Res) Button with Resolution Dropdown */}
        <div className="relative flex rounded-xl shadow-sm">
          <button
            type="button"
            id="qr-btn-download-png"
            disabled={isExporting}
            onClick={() => downloadPNG(exportRes)}
            className="flex-1 flex items-center justify-center gap-2 rounded-l-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>
              {isExporting ? 'Generating High-Res...' : `Download PNG (${exportRes}px)`}
            </span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowResMenu(!showResMenu)}
            className="flex items-center justify-center rounded-r-xl border-l border-indigo-500 bg-indigo-600 px-2.5 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
            title="Choose export resolution"
          >
            <ChevronDown className="h-4 w-4" />
          </button>

          {showResMenu && (
            <div className="absolute top-full right-0 mt-1 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              <span className="block px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Resolution Quality
              </span>
              {[
                { res: 1024, label: 'Standard (1024px)' },
                { res: 2048, label: 'High-Res HD (2048px)' },
                { res: 4096, label: 'Ultra Print (4096px)' },
              ].map((item) => (
                <button
                  key={item.res}
                  type="button"
                  onClick={() => {
                    setExportRes(item.res);
                    setShowResMenu(false);
                    downloadPNG(item.res);
                  }}
                  className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-left transition-colors ${
                    exportRes === item.res
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-slate-700 dark:text-indigo-300'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.res === 4096 && !isSvgUnlocked && (
                      <span className="text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1 py-0.5 rounded">
                        PRO 10🪙
                      </span>
                    )}
                  </div>
                  {exportRes === item.res && <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Secondary Buttons Row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Vector SVG */}
          <button
            type="button"
            id="qr-btn-download-svg"
            onClick={downloadSVG}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-indigo-300 cursor-pointer"
            title="Download vector SVG for print, Figma & Illustrator"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Vector SVG</span>
            {!isSvgUnlocked && (
              <span className="text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1 rounded">
                10🪙
              </span>
            )}
          </button>

          {/* Copy to Clipboard */}
          <button
            type="button"
            id="qr-btn-copy-image"
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-indigo-300 cursor-pointer"
            title="Copy image directly to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span>Copy Image</span>
              </>
            )}
          </button>

          {/* Print Direct */}
          <button
            type="button"
            id="qr-btn-print"
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-indigo-300 cursor-pointer"
            title="Open print formatted dialog"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>Print</span>
          </button>
        </div>

        {/* PDF & Batch Row */}
        <div className="grid grid-cols-2 gap-2">
          {/* PDF Print Sheet Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPdfMenu(!showPdfMenu)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <FileText className="h-3.5 w-3.5 text-rose-500" />
              <span>PDF Print Sheet</span>
              <ChevronDown className="h-3 w-3 ml-auto text-slate-400" />
            </button>

            {showPdfMenu && (
              <div className="absolute top-full left-0 mt-1 z-30 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <span className="block px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Print Formats
                </span>
                <button
                  type="button"
                  onClick={handleExportSinglePDF}
                  className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60"
                >
                  Single Poster / Frame (A4)
                </button>
                <button
                  type="button"
                  onClick={handleExportFoldableTableTent}
                  className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <span>Foldable Table Tent (A4 Card)</span>
                  <span className="text-[9px] font-bold uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">Dual</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportStickersPDF('2x3')}
                  className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60"
                >
                  Multi-Sticker Sheet (2x3 Grid)
                </button>
                <button
                  type="button"
                  onClick={() => handleExportStickersPDF('3x4')}
                  className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60"
                >
                  Sticker Mini Sheet (3x4 Grid)
                </button>
              </div>
            )}
          </div>

          {/* Batch CSV Generator */}
          <button
            type="button"
            onClick={() => {
              if (!isBatchUnlocked) {
                openCoinsModal({
                  id: 'batch-generator',
                  name: 'Bulk Batch QR Generator',
                  cost: 25,
                  description: 'Generate, customize, and bulk-download up to 50 QR codes simultaneously from text or CSV.',
                });
                return;
              }
              setIsBatchOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-500" />
            <span>Batch (CSV)</span>
            {!isBatchUnlocked && (
              <span className="text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1 rounded">
                25🪙
              </span>
            )}
          </button>
        </div>

        {/* Save to History / Library */}
        <button
          type="button"
          id="qr-btn-save-library"
          onClick={handleSave}
          className={`w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition-all cursor-pointer ${
            saved
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-indigo-300'
          }`}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isCloudUser ? 'Saved & Synced to Cloud!' : 'Saved to Your Library!'}</span>
            </>
          ) : (
            <>
              <BookmarkPlus className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span>{isCloudUser ? 'Save to my account' : 'Sign in to save'}</span>
            </>
          )}
        </button>
      </div>

      {/* Batch CSV Modal */}
      {isBatchOpen && (
        <React.Suspense fallback={null}>
          <BatchGeneratorModal
            isOpen={isBatchOpen}
            onClose={() => setIsBatchOpen(false)}
            config={config}
          />
        </React.Suspense>
      )}
    </div>
  );
};
