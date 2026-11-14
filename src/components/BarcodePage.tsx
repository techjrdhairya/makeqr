import React, { useEffect, useMemo, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { Barcode, Download, Copy, Check, AlertCircle, RotateCcw, ImageDown, FileCode2 } from 'lucide-react';

interface FormatDef {
  id: string;
  label: string;
  hint: string;
  sample: string;
  group: 'Universal' | 'Retail' | 'Logistics' | 'Other';
}

const FORMATS: FormatDef[] = [
  { id: 'CODE128', label: 'Code 128', hint: 'Any text or numbers. Best all-rounder.', sample: 'MAKEQR-12345', group: 'Universal' },
  { id: 'CODE39', label: 'Code 39', hint: 'Capital letters, digits and - . $ / + % space.', sample: 'MAKEQR 123', group: 'Universal' },
  { id: 'EAN13', label: 'EAN-13', hint: '12 or 13 digits. Used on retail products worldwide.', sample: '5901234123457', group: 'Retail' },
  { id: 'EAN8', label: 'EAN-8', hint: '7 or 8 digits. For small packages.', sample: '96385074', group: 'Retail' },
  { id: 'UPC', label: 'UPC-A', hint: '11 or 12 digits. Used on products in the US & Canada.', sample: '123456789012', group: 'Retail' },
  { id: 'ITF14', label: 'ITF-14', hint: '13 or 14 digits. Cartons and shipping cases.', sample: '12345678901231', group: 'Logistics' },
  { id: 'ITF', label: 'Interleaved 2 of 5', hint: 'An even number of digits.', sample: '123456', group: 'Logistics' },
  { id: 'codabar', label: 'Codabar', hint: 'Digits and - $ : / . + (libraries, blood banks).', sample: 'A123456B', group: 'Other' },
  { id: 'MSI', label: 'MSI', hint: 'Digits only. Warehouse shelf labels.', sample: '123456', group: 'Other' },
  { id: 'pharmacode', label: 'Pharmacode', hint: 'A number from 3 to 131070.', sample: '1234', group: 'Other' },
];

const GROUPS: FormatDef['group'][] = ['Universal', 'Retail', 'Logistics', 'Other'];

export const BarcodePage: React.FC<{ onGoToStudio?: () => void }> = ({ onGoToStudio }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [format, setFormat] = useState('CODE128');
  const [value, setValue] = useState('MAKEQR-12345');
  const [barWidth, setBarWidth] = useState(2);
  const [height, setHeight] = useState(100);
  const [margin, setMargin] = useState(16);
  const [showText, setShowText] = useState(true);
  const [fg, setFg] = useState('#0f172a');
  const [bg, setBg] = useState('#ffffff');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const current = useMemo(() => FORMATS.find((f) => f.id === format)!, [format]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      JsBarcode(svg, value, {
        format,
        width: barWidth,
        height,
        margin,
        displayValue: showText,
        lineColor: fg,
        background: bg,
        fontSize: 16,
        font: 'monospace',
        valid: (ok: boolean) => {
          setError(ok ? null : `This value isn't valid for ${current.label}. ${current.hint}`);
        },
      });
    } catch {
      setError(`This value isn't valid for ${current.label}. ${current.hint}`);
    }
  }, [format, value, barWidth, height, margin, showText, fg, bg, current]);

  const changeFormat = (id: string) => {
    setFormat(id);
    const f = FORMATS.find((x) => x.id === id)!;
    setValue(f.sample);
  };

  const reset = () => {
    setBarWidth(2);
    setHeight(100);
    setMargin(16);
    setShowText(true);
    setFg('#0f172a');
    setBg('#ffffff');
    setValue(current.sample);
  };

  const serialize = () => {
    const svg = svgRef.current!;
    return new XMLSerializer().serializeToString(svg);
  };

  const download = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcode-${format.toLowerCase()}.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadSvg = () => {
    if (error) return;
    download(new Blob([serialize()], { type: 'image/svg+xml' }), 'svg');
  };

  const toPngBlob = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      const svg = svgRef.current!;
      const w = svg.width.baseVal.value;
      const h = svg.height.baseVal.value;
      const scale = 3;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => resolve(b), 'image/png');
      };
      img.onerror = () => resolve(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialize());
    });

  const downloadPng = async () => {
    if (error) return;
    const blob = await toPngBlob();
    if (blob) download(blob, 'png');
  };

  const copyPng = async () => {
    if (error) return;
    try {
      const blob = await toPngBlob();
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard image copy not supported */
    }
  };

  const input =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
  const label = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400';

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 pb-28 lg:pb-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
            <Barcode className="h-3.5 w-3.5" /> Free · Runs in your browser
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">Barcode Generator</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            Make print-ready barcodes for products, shelves and shipping. Nothing is uploaded.
          </p>
        </div>
        {onGoToStudio && (
          <button
            type="button"
            onClick={onGoToStudio}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            Need a QR code instead?
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Controls */}
        <section className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div>
            <span className={label}>1 · Barcode type</span>
            <div className="space-y-3">
              {GROUPS.map((g) => (
                <div key={g}>
                  <p className="mb-1.5 text-[11px] font-semibold text-slate-400">{g}</p>
                  <div className="flex flex-wrap gap-2">
                    {FORMATS.filter((f) => f.group === g).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => changeFormat(f.id)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                          format === f.id
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="bc-value" className={label}>2 · Barcode value</label>
            <input id="bc-value" value={value} onChange={(e) => setValue(e.target.value)} className={`${input} font-mono`} spellCheck={false} />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{current.hint}</p>
            {error && (
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div>
            <span className={label}>3 · Appearance</span>
            <div className="grid gap-4 sm:grid-cols-2">
              <Slider id="bc-width" text="Bar width" value={barWidth} min={1} max={5} step={0.5} unit="px" onChange={setBarWidth} />
              <Slider id="bc-height" text="Height" value={height} min={40} max={240} step={5} unit="px" onChange={setHeight} />
              <Slider id="bc-margin" text="Quiet zone" value={margin} min={0} max={50} step={2} unit="px" onChange={setMargin} />
              <label className="flex items-center gap-2 self-end text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
                Show number under bars
              </label>
              <ColorField text="Bar colour" value={fg} onChange={setFg} />
              <ColorField text="Background" value={bg} onChange={setBg} />
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Tip: keep strong contrast (dark bars on a light background) so scanners read it first time.
            </p>
          </div>
        </section>

        {/* Preview */}
        <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex min-h-[200px] items-center justify-center overflow-auto rounded-xl border border-dashed border-slate-200 p-3 dark:border-slate-700" style={{ background: bg }}>
              <svg ref={svgRef} className="max-w-full" aria-label={`${current.label} barcode preview`} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={downloadPng}
                disabled={!!error}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <ImageDown className="h-4 w-4" /> PNG
              </button>
              <button
                type="button"
                onClick={downloadSvg}
                disabled={!!error}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <FileCode2 className="h-4 w-4" /> SVG
              </button>
              <button
                type="button"
                onClick={copyPng}
                disabled={!!error}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy image'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Download className="h-3 w-3" /> PNG exports at 3× for sharp printing. SVG scales to any size.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
};

const Slider: React.FC<{
  id: string;
  text: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (n: number) => void;
}> = ({ id, text, value, min, max, step, unit, onChange }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
      <label htmlFor={id}>{text}</label>
      <span className="font-mono text-slate-400">{value}{unit}</span>
    </div>
    <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-indigo-600" />
  </div>
);

const ColorField: React.FC<{ text: string; value: string; onChange: (v: string) => void }> = ({ text, value, onChange }) => (
  <label className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
    {text}
    <span className="flex items-center gap-2">
      <span className="font-mono text-slate-400">{value}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5 dark:border-slate-700" />
    </span>
  </label>
);
