import React from 'react';
import { Coins, Copy, Check, ShieldCheck } from 'lucide-react';
import { QRConfig, CryptoData } from '../../types';

interface CryptoInputsProps {
  config: QRConfig;
  onChange: (updater: Partial<QRConfig>) => void;
}

export const CryptoInputs: React.FC<CryptoInputsProps> = ({ config, onChange }) => {
  const crypto: CryptoData = config.crypto || {
    currency: 'BTC',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    amount: '0.005',
    memo: 'Design Invoice #1042',
  };

  const updateCrypto = (partial: Partial<CryptoData>) => {
    onChange({ crypto: { ...crypto, ...partial } });
  };

  const currencies: { id: CryptoData['currency']; name: string; symbol: string }[] = [
    { id: 'BTC', name: 'Bitcoin', symbol: '₿' },
    { id: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
    { id: 'SOL', name: 'Solana', symbol: '◎' },
    { id: 'USDT', name: 'Tether USDT', symbol: '$' },
  ];

  const presets = {
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ETH: '0x71C8A62E8E4Ec764C0a0a5E3A56D08034a7C6b04',
    SOL: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Crypto Payment Address
        </label>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          BIP-21 URI Scheme (Auto-fills Wallets)
        </span>
      </div>

      {/* Currency Selector */}
      <div className="grid grid-cols-4 gap-2">
        {currencies.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() =>
              updateCrypto({
                currency: c.id,
                address: presets[c.id] || crypto.address,
              })
            }
            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all ${
              crypto.currency === c.id
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold dark:border-indigo-500 dark:bg-indigo-950/70 dark:text-indigo-300'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <span className="text-base">{c.symbol}</span>
            <span className="mt-0.5">{c.name}</span>
          </button>
        ))}
      </div>

      {/* Wallet Address */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {crypto.currency} Wallet Address *
        </label>
        <input
          type="text"
          value={crypto.address}
          onChange={(e) => updateCrypto({ address: e.target.value.trim() })}
          placeholder={`Enter ${crypto.currency} address`}
          className="w-full font-mono text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      {/* Amount and Memo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Amount (Optional)
          </label>
          <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800">
            <input
              type="text"
              value={crypto.amount}
              onChange={(e) => updateCrypto({ amount: e.target.value })}
              placeholder="0.05"
              className="w-full rounded-xl bg-transparent py-2 pl-3 pr-10 text-xs text-slate-900 focus:outline-none dark:text-white font-mono"
            />
            <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
              {crypto.currency}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Memo / Reference
          </label>
          <input
            type="text"
            value={crypto.memo}
            onChange={(e) => updateCrypto({ memo: e.target.value })}
            placeholder="e.g. Invoice #1042, Tip"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 p-3 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
        <span>
          Scanning with Coinbase, MetaMask, Phantom, or Trust Wallet auto-populates the recipient address and amount safely.
        </span>
      </div>
    </div>
  );
};
