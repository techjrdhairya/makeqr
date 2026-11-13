import React, { useMemo } from 'react';
import { Download, Users, Repeat } from 'lucide-react';
import { QRAnalyticsData } from '../types';

interface Props {
  analytics: QRAnalyticsData;
  qrName: string;
}

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** Scans per day (last 14 days), scans by hour of day, unique vs repeat visitors, CSV export. */
export const AnalyticsCharts: React.FC<Props> = ({ analytics, qrName }) => {
  const days = useMemo(() => {
    const out: { key: string; label: string; n: number }[] = [];
    const tz = 330 * 60_000; // buckets are computed on the server in IST by default
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() + tz - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      out.push({ key, label: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`, n: analytics.byDay?.[key] || 0 });
    }
    return out;
  }, [analytics.byDay]);

  const hours = analytics.byHour && analytics.byHour.length === 24 ? analytics.byHour : new Array(24).fill(0);
  const maxDay = Math.max(1, ...days.map((d) => d.n));
  const maxHour = Math.max(1, ...hours);
  const unique = analytics.uniqueVisitors || 0;
  const repeat = Math.max(0, (analytics.scanCount || 0) - unique);

  const exportCsv = () => {
    const rows: string[] = [];
    rows.push(['Time', 'City', 'Country', 'Device', 'Browser', 'Referrer'].map(csvCell).join(','));
    for (const s of analytics.recentScans || []) {
      rows.push([new Date(s.timestamp).toISOString(), s.city, s.country, s.device, s.browser, s.referrer].map(csvCell).join(','));
    }
    rows.push('');
    rows.push(['Day', 'Scans'].map(csvCell).join(','));
    for (const [d, n] of Object.entries(analytics.byDay || {}).sort()) rows.push([d, n].map(csvCell).join(','));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(qrName || 'qr').replace(/[^a-z0-9_-]+/gi, '_')}-scans.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500"><Users className="h-3.5 w-3.5" /> Unique visitors</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{unique}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500"><Repeat className="h-3.5 w-3.5" /> Repeat scans</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{repeat}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="mb-3 text-xs font-bold text-slate-700 dark:text-slate-200">Scans per day (last 14 days)</p>
        <div className="flex h-28 items-end gap-1">
          {days.map((d) => (
            <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end" title={`${d.label}: ${d.n} scans`}>
              <div className="w-full rounded-t bg-indigo-500" style={{ height: `${(d.n / maxDay) * 100}%`, minHeight: d.n ? 3 : 0 }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1">
          {days.map((d, i) => (
            <span key={d.key} className="flex-1 text-center text-[9px] text-slate-400">{i % 2 === 0 ? d.label : ''}</span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="mb-3 text-xs font-bold text-slate-700 dark:text-slate-200">Busiest hours (24h clock)</p>
        <div className="flex h-20 items-end gap-0.5">
          {hours.map((n, h) => (
            <div key={h} className="flex h-full flex-1 flex-col justify-end" title={`${h}:00 — ${n} scans`}>
              <div className="w-full rounded-t bg-emerald-500" style={{ height: `${(n / maxHour) * 100}%`, minHeight: n ? 3 : 0 }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-slate-400"><span>0</span><span>6</span><span>12</span><span>18</span><span>23</span></div>
      </div>

      <button
        type="button" onClick={exportCsv}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Download className="h-3.5 w-3.5" /> Export CSV
      </button>
    </div>
  );
};
