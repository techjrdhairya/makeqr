import React from 'react';
import { MapPin, Navigation, Compass, Globe, Sparkles } from 'lucide-react';
import { QRConfig, GeoData } from '../../types';

interface GeoInputsProps {
  config: QRConfig;
  onChange: (updater: Partial<QRConfig>) => void;
  onOpenAIChat?: (role?: 'consultant' | 'places' | 'fast' | 'architect', initialQuery?: string) => void;
}

export const GeoInputs: React.FC<GeoInputsProps> = ({ config, onChange, onOpenAIChat }) => {
  const geo: GeoData = config.geo || {
    latitude: 37.7749,
    longitude: -122.4194,
    query: 'San Francisco Ferry Building',
    provider: 'google',
  };

  const updateGeo = (partial: Partial<GeoData>) => {
    onChange({ geo: { ...geo, ...partial } });
  };

  const cityPresets = [
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194, q: 'San Francisco, CA' },
    { name: 'New York (Times Sq)', lat: 40.758, lng: -73.9855, q: 'Times Square, NYC' },
    { name: 'London (Piccadilly)', lat: 51.51, lng: -0.134, q: 'Piccadilly Circus, London' },
    { name: 'Tokyo (Shibuya)', lat: 35.6595, lng: 139.7005, q: 'Shibuya Crossing, Tokyo' },
    { name: 'Paris (Eiffel)', lat: 48.8584, lng: 2.2945, q: 'Eiffel Tower, Paris' },
  ];

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateGeo({
            latitude: Number(pos.coords.latitude.toFixed(5)),
            longitude: Number(pos.coords.longitude.toFixed(5)),
            query: 'My Current Location',
          });
        },
        (err) => {
          console.warn('Geolocation error:', err);
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Geographic Pin & Directions
        </label>
        <div className="flex items-center gap-2">
          {onOpenAIChat && (
            <button
              type="button"
              onClick={() => onOpenAIChat('places', geo.query ? `Find places matching "${geo.query}"` : 'Find popular venues or cafes')}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              <span>Google Maps AI</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
          >
            <Navigation className="h-3 w-3" />
            <span>Use My GPS</span>
          </button>
        </div>
      </div>

      {/* Preset Cities */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Globe className="h-3 w-3 text-indigo-500" />
          Presets:
        </span>
        {cityPresets.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() =>
              updateGeo({
                latitude: c.lat,
                longitude: c.lng,
                query: c.q,
              })
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Latitude & Longitude Coordinates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Latitude (°N)
          </label>
          <input
            type="number"
            step="0.0001"
            value={geo.latitude}
            onChange={(e) => updateGeo({ latitude: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Longitude (°W/E)
          </label>
          <input
            type="number"
            step="0.0001"
            value={geo.longitude}
            onChange={(e) => updateGeo({ longitude: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Place / Venue Name Query */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Place / Business Name (Search Query)
        </label>
        <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center pl-3.5 pointer-events-none text-slate-400">
            <MapPin className="h-4 w-4 text-rose-500" />
          </div>
          <input
            type="text"
            value={geo.query}
            onChange={(e) => updateGeo({ query: e.target.value })}
            placeholder="e.g. Acme Coffee Roasters, Downtown"
            className="w-full rounded-xl bg-transparent py-2 pl-3 pr-3 text-xs text-slate-900 focus:outline-none dark:text-white"
          />
        </div>
      </div>

      {/* Destination App Choice */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Preferred Map App Format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'google', label: 'Google Maps' },
            { id: 'apple', label: 'Apple Maps' },
            { id: 'geo', label: 'Native Geo URI' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateGeo({ provider: item.id as any })}
              className={`rounded-xl border py-2 px-2 text-xs font-medium text-center transition-all ${
                geo.provider === item.id
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/70 dark:text-indigo-300 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
