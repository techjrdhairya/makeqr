import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { 
  X, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Camera, 
  CameraOff, 
  RefreshCw,
  Sparkles,
  Zap,
  Wifi,
  User,
  ArrowRight
} from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDecodedToEditor?: (text: string) => void;
}

function playBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch {
    // ignore audio block
  }
}

/**
 * Multi-pass QR code scanner for images.
 * Tries scaled down, original, contrast-enhanced, and center-cropped attempts.
 */
function scanImageDataRobust(
  sourceCanvas: HTMLCanvasElement, 
  ctx: CanvasRenderingContext2D, 
  image: HTMLImageElement
): string | null {
  const attempts: { width: number; height: number; crop?: boolean; threshold?: boolean }[] = [
    // 1. Normalized 800px scale (ideal for jsQR speed & accuracy)
    { width: 800, height: 800 },
    // 2. Original size if under 1600px, otherwise 1200px
    { width: Math.min(1200, image.width), height: Math.min(1200, image.height) },
    // 3. 600px scale
    { width: 600, height: 600 },
    // 4. Center 75% crop (extracts QR from framed banners/Polaroids/table tents)
    { width: 800, height: 800, crop: true },
    // 5. High contrast threshold
    { width: 800, height: 800, threshold: true },
  ];

  for (const att of attempts) {
    sourceCanvas.width = att.width;
    sourceCanvas.height = att.height;
    ctx.clearRect(0, 0, att.width, att.height);

    if (att.crop) {
      const sx = image.width * 0.12;
      const sy = image.height * 0.12;
      const sw = image.width * 0.76;
      const sh = image.height * 0.76;
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, att.width, att.height);
    } else {
      ctx.drawImage(image, 0, 0, att.width, att.height);
    }

    const imgData = ctx.getImageData(0, 0, att.width, att.height);

    if (att.threshold) {
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
        const v = avg > 128 ? 255 : 0;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    try {
      const code = jsQR(imgData.data, imgData.width, imgData.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (code && code.data && code.data.trim().length > 0) {
        return code.data;
      }
    } catch {
      // continue to next pass
    }
  }

  return null;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onLoadDecodedToEditor,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [decodedData, setDecodedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start live webcam / camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported by your browser.');
        setActiveTab('upload');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera permission or access failed', err);
      setError('Camera access was blocked or is unavailable. You can upload an image or scan the studio code instead.');
      setActiveTab('upload');
    }
  }, [cameraFacing, stopCamera]);

  // Live video frame scanning loop
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera' || !cameraActive) {
      return;
    }

    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

    let isScanningFrame = false;

    const scanFrame = () => {
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && offscreenCtx) {
        if (!isScanningFrame) {
          isScanningFrame = true;
          // Scale down frame to 640x480 for fast 30fps detection
          const targetW = 640;
          const targetH = Math.round((video.videoHeight / video.videoWidth) * targetW) || 480;
          offscreenCanvas.width = targetW;
          offscreenCanvas.height = targetH;
          offscreenCtx.drawImage(video, 0, 0, targetW, targetH);

          const imgData = offscreenCtx.getImageData(0, 0, targetW, targetH);
          try {
            const code = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'attemptBoth',
            });
            if (code && code.data && code.data.trim()) {
              playBeep();
              setDecodedData(code.data);
              stopCamera();
              return;
            }
          } catch {
            // ignore
          } finally {
            isScanningFrame = false;
          }
        }
      }
      scanLoopRef.current = requestAnimationFrame(scanFrame);
    };

    scanLoopRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
      }
    };
  }, [isOpen, activeTab, cameraActive, stopCamera]);

  // Manage camera on modal open/close or tab switch
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  if (!isOpen) return null;

  // Process uploaded image
  const handleImageFile = (file: File) => {
    setError(null);
    setDecodedData(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewImage(dataUrl);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setError('Failed to create canvas context.');
          setIsProcessing(false);
          return;
        }

        try {
          const result = scanImageDataRobust(canvas, ctx, image);
          if (result) {
            playBeep();
            setDecodedData(result);
          } else {
            setError('No QR code detected in this image. Make sure the code is in focus, well-lit, and with clear contrast.');
          }
        } catch {
          setError('Error analyzing image. Please try another file.');
        } finally {
          setIsProcessing(false);
        }
      };
      image.onerror = () => {
        setError('Failed to load image file.');
        setIsProcessing(false);
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Instant 1-click test of whatever is currently on the studio canvas!
  const scanCurrentStudioCanvas = () => {
    setError(null);
    setDecodedData(null);
    setIsProcessing(true);

    try {
      const studioCanvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!studioCanvas) {
        setError('No QR code is currently rendered in the studio.');
        setIsProcessing(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setError('Could not access canvas context.');
          setIsProcessing(false);
          return;
        }
        const result = scanImageDataRobust(canvas, ctx, img);
        if (result) {
          playBeep();
          setDecodedData(result);
          setPreviewImage(studioCanvas.toDataURL('image/png'));
        } else {
          setError('Could not decode current canvas. Try increasing contrast or reducing logo size.');
        }
        setIsProcessing(false);
      };
      img.src = studioCanvas.toDataURL('image/png');
    } catch {
      setError('Unable to read canvas data.');
      setIsProcessing(false);
    }
  };

  const copyDecoded = async () => {
    if (!decodedData) return;
    await navigator.clipboard.writeText(decodedData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUrl = decodedData && /^https?:\/\//i.test(decodedData.trim());
  const isWifi = decodedData && decodedData.startsWith('WIFI:');
  const isVcard = decodedData && decodedData.includes('BEGIN:VCARD');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Scan & Verify QR Code
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live camera scanner & multi-pass file diagnostics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Controls: Camera vs Image File vs Studio Quick Test */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-4 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'camera'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Live Camera</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Quick Test Bar */}
        <div className="mb-4 flex items-center justify-between rounded-xl bg-indigo-50/60 p-2.5 border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/50">
          <div className="flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-200">
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Test the current code in your studio:</span>
          </div>
          <button
            type="button"
            onClick={scanCurrentStudioCanvas}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shrink-0 shadow-xs"
          >
            <Zap className="h-3 w-3" />
            <span>Scan Studio QR</span>
          </button>
        </div>

        {/* Live Camera View */}
        {activeTab === 'camera' && !decodedData && (
          <div className="relative overflow-hidden rounded-2xl bg-black aspect-4/3 flex items-center justify-center border border-slate-800">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              muted
              playsInline
            />

            {/* Viewfinder Target Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative h-48 w-48 rounded-2xl border-2 border-indigo-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                {/* Corner Markers */}
                <span className="absolute -top-1 -left-1 h-5 w-5 border-t-3 border-l-3 border-indigo-500 rounded-tl" />
                <span className="absolute -top-1 -right-1 h-5 w-5 border-t-3 border-r-3 border-indigo-500 rounded-tr" />
                <span className="absolute -bottom-1 -left-1 h-5 w-5 border-b-3 border-l-3 border-indigo-500 rounded-bl" />
                <span className="absolute -bottom-1 -right-1 h-5 w-5 border-b-3 border-r-3 border-indigo-500 rounded-br" />

                {/* Animated Scan Line */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_8px_#6366f1] animate-bounce" />
              </div>
            </div>

            {/* Camera Floating Controls */}
            <div className="absolute bottom-3 inset-x-3 flex justify-between items-center z-10">
              <button
                type="button"
                onClick={() => {
                  setCameraFacing((f) => (f === 'environment' ? 'user' : 'environment'));
                }}
                className="flex items-center gap-1.5 rounded-xl bg-black/60 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Flip Camera</span>
              </button>

              <span className="text-[11px] font-medium text-white/90 bg-black/50 px-2 py-1 rounded-lg backdrop-blur-xs">
                Align QR within frame
              </span>
            </div>
          </div>
        )}

        {/* Upload Image View */}
        {activeTab === 'upload' && !decodedData && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-6 sm:p-8 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-center dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-indigo-500"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageFile(e.target.files[0]);
                }
              }}
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100/60 text-indigo-600 mb-2.5 dark:bg-indigo-950 dark:text-indigo-400">
              <Upload className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-white">
              {isProcessing ? 'Analyzing multi-pass image...' : 'Upload QR Code Image'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports screenshots, photos, high-res posters, and framed codes
            </span>
          </div>
        )}

        {/* Scanned Decoded Result Card */}
        {decodedData && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3 dark:border-emerald-900/60 dark:bg-emerald-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  Decoded Successfully
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDecodedData(null);
                  setPreviewImage(null);
                  setError(null);
                  if (activeTab === 'camera') startCamera();
                }}
                className="text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                Scan Another
              </button>
            </div>

            {/* Type badge */}
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 shadow-xs dark:bg-slate-800 dark:text-slate-200">
                {isUrl ? 'Website Link' : isWifi ? 'Wi-Fi Credentials' : isVcard ? 'Contact Card' : 'Plain Text'}
              </span>
            </div>

            <div className="rounded-lg bg-white p-3 border border-emerald-100 text-xs font-mono text-slate-800 break-all max-h-36 overflow-y-auto dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
              {decodedData}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={copyDecoded}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              {isUrl && (
                <a
                  href={decodedData}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Link</span>
                </a>
              )}

              {onLoadDecodedToEditor && (
                <button
                  type="button"
                  onClick={() => {
                    onLoadDecodedToEditor(decodedData);
                    stopCamera();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors ml-auto"
                >
                  <span>Load in Editor</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
