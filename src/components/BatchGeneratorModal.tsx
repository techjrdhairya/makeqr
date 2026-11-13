import React, { useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { X, Layers, FileSpreadsheet, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { QRConfig } from '../types';
import { buildQRCodeStylingOptions, compositeFramedQR } from '../utils/qr-generator';

interface BatchGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: QRConfig;
}

export const BatchGeneratorModal: React.FC<BatchGeneratorModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const [csvText, setCsvText] = useState(
    'Table 01,https://example.com/menu/table-1\nTable 02,https://example.com/menu/table-2\nTable 03,https://example.com/menu/table-3\nTable 04,https://example.com/menu/table-4'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleGenerateBatch = async () => {
    setError(null);
    const lines = csvText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setError('Please provide at least one CSV row.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setTotalCount(lines.length);

    try {
      const jszipModule = await import('jszip');
      const JSZipConstructor = (jszipModule.default || jszipModule) as unknown as typeof import('jszip');
      const zip = new JSZipConstructor();
      const folder = zip.folder('makeqr_batch');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(',');
        const label = parts[0]?.trim() || `QR_${i + 1}`;
        const target = parts[1]?.trim() || parts[0]?.trim();

        // Create individual config
        const itemConfig: QRConfig = {
          ...config,
          contentType: 'url',
          url: target,
          frame: {
            ...config.frame,
            title: label,
          },
        };

        const qr = new QRCodeStyling(buildQRCodeStylingOptions(itemConfig, 1024));
        const blob = await qr.getRawData('png');
        if (blob) {
          const img = new Image();
          const url = URL.createObjectURL(blob as Blob);
          await new Promise<void>((resolve) => {
            img.onload = async () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                const framed = await compositeFramedQR(canvas, itemConfig, 1024);
                const dataUrl = framed.toDataURL('image/png');
                const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
                const cleanFileName = `${label.replace(/[^a-z0-9_-]/gi, '_')}.png`;
                folder?.file(cleanFileName, base64Data, { base64: true });
              }
              URL.revokeObjectURL(url);
              resolve();
            };
            img.src = url;
          });
        }

        setProgress(i + 1);
      }

      // Generate zip
      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `makeqr-batch-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      onClose();
    } catch (err: any) {
      console.error('Batch generation failed:', err);
      setError('An error occurred during batch generation. Please check data format.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Batch QR Generator (CSV to ZIP)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate dozens of styled QR codes with custom titles in one click
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

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              CSV Data (Format: <code className="text-indigo-600">Label, Target URL</code>)
            </label>
            <label className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Import .csv file</span>
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            rows={6}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            disabled={isProcessing}
            placeholder="Table 1,https://myrestaurant.com/t1&#10;Table 2,https://myrestaurant.com/t2"
            className="w-full font-mono text-xs rounded-xl border border-slate-200 p-3 text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />

          <p className="text-[11px] text-slate-400">
            Each row will inherit your current custom colors, shapes, frames, and logos.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
                <span>Generating high-resolution codes...</span>
                <span>
                  {progress} / {totalCount}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-200"
                  style={{ width: `${(progress / Math.max(1, totalCount)) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerateBatch}
              disabled={isProcessing}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Export ZIP Archive</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
