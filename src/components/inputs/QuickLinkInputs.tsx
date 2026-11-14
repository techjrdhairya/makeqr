import React from 'react';
import { Link2, Info } from 'lucide-react';
import type { QuickLinkData, QuickLinkKind } from '../../utils/quicklinks';
import { QUICKLINK_DEFS, QUICKLINK_ORDER, buildQuickLink, quickLinkHasValue } from '../../utils/quicklinks';
import { QUICKLINK_UI } from '../quicklink-ui';

interface Props {
  data: QuickLinkData;
  onChange: (next: QuickLinkData) => void;
  /** Called when the person switches service, so the frame title can follow. */
  onKindChange?: (kind: QuickLinkKind) => void;
}

const field =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const label = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400';

export const QuickLinkInputs: React.FC<Props> = ({ data, onChange, onKindChange }) => {
  const def = QUICKLINK_DEFS[data.kind];
  const ui = QUICKLINK_UI[data.kind];
  const Icon = ui.icon;
  const result = buildQuickLink(data);
  const filled = quickLinkHasValue(data);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ui.iconBg} ${ui.iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{def.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{ui.description}</p>
        </div>
      </div>

      <div>
        <label htmlFor="ql-value" className={label}>{def.fieldLabel}</label>
        <input
          id="ql-value"
          type="text"
          inputMode={def.inputMode}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={data.value}
          onChange={(e) => onChange({ ...data, value: e.target.value })}
          placeholder={def.placeholder}
          className={field}
        />
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {def.help}
        </p>
      </div>

      {def.messageLabel && (
        <div>
          <label htmlFor="ql-message" className={label}>{def.messageLabel}</label>
          {data.kind === 'whatsapp' ? (
            <textarea
              id="ql-message"
              rows={3}
              value={data.message}
              onChange={(e) => onChange({ ...data, message: e.target.value })}
              placeholder={def.messagePlaceholder}
              className={field}
            />
          ) : (
            <input
              id="ql-message"
              type="text"
              value={data.message}
              onChange={(e) => onChange({ ...data, message: e.target.value })}
              placeholder={def.messagePlaceholder}
              className={field}
            />
          )}
        </div>
      )}

      {def.amountLabel && (
        <div>
          <label htmlFor="ql-amount" className={label}>{def.amountLabel}</label>
          <input
            id="ql-amount"
            type="text"
            inputMode="decimal"
            value={data.amount}
            onChange={(e) => onChange({ ...data, amount: e.target.value.replace(/[^\d.]/g, '') })}
            placeholder="250"
            className={field}
          />
        </div>
      )}

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Link2 className="h-3.5 w-3.5" /> {filled ? 'Scanners will open' : 'Example (type above to replace)'}
        </p>
        <p className="break-all font-mono text-xs text-slate-700 dark:text-slate-300">{result}</p>
      </div>

      <div>
        <span className={label}>Not the right service? Switch</span>
        <div className="flex flex-wrap gap-1.5">
          {QUICKLINK_ORDER.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                onChange({ ...data, kind: k, value: '', message: '', amount: '' });
                onKindChange?.(k);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                data.kind === k
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {QUICKLINK_DEFS[k].short}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
