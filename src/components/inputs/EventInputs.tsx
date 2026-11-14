import React from 'react';
import { Calendar, Clock, MapPin, AlignLeft, Sparkles } from 'lucide-react';
import { QRConfig, EventData } from '../../types';

interface EventInputsProps {
  config: QRConfig;
  onChange: (updater: Partial<QRConfig>) => void;
}

export const EventInputs: React.FC<EventInputsProps> = ({ config, onChange }) => {
  const event: EventData = config.event || {
    title: 'Product Showcase & Networking',
    location: 'Design Center, Hall 4',
    description: 'Join us for presentations, keynotes, and refreshments.',
    startDate: '2026-09-15T18:00',
    endDate: '2026-09-15T21:00',
    allDay: false,
  };

  const updateEvent = (partial: Partial<EventData>) => {
    onChange({ event: { ...event, ...partial } });
  };

  const presets = [
    {
      title: 'Grand Opening & Reception',
      location: '100 Market St, San Francisco',
      start: '2026-10-01T17:00',
      end: '2026-10-01T21:00',
      desc: 'Celebrate our new flagship launch with drinks and preview showcase.',
    },
    {
      title: 'VIP Dinner & Tasting Menu',
      location: 'The Chef’s Table, Suite 3',
      start: '2026-09-20T19:30',
      end: '2026-09-20T22:30',
      desc: 'Exclusive 7-course seasonal tasting with wine pairings.',
    },
    {
      title: 'Design Masterclass & Workshop',
      location: 'Auditorium B & Online Livestream',
      start: '2026-09-25T10:00',
      end: '2026-09-25T13:00',
      desc: 'Hands-on vector design and visual typography masterclass.',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Calendar Event (vEvent)
        </label>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Native 1-tap &quot;Add to Calendar&quot;
        </span>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-500" />
          Presets:
        </span>
        {presets.map((p) => (
          <button
            key={p.title}
            type="button"
            onClick={() =>
              updateEvent({
                title: p.title,
                location: p.location,
                startDate: p.start,
                endDate: p.end,
                description: p.desc,
              })
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
          >
            {p.title.split('&')[0]}
          </button>
        ))}
      </div>

      {/* Event Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Event Title *
        </label>
        <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Calendar className="h-4 w-4 text-indigo-500" />
          </div>
          <input
            type="text"
            value={event.title}
            onChange={(e) => updateEvent({ title: e.target.value })}
            placeholder="e.g. Wedding Reception, Design Keynote"
            className="w-full rounded-xl bg-transparent py-2.5 pl-3 pr-3 text-sm text-slate-900 focus:outline-none dark:text-white font-medium"
          />
        </div>
      </div>

      {/* Start and End Times */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Starts
          </label>
          <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center pl-3 pointer-events-none text-slate-400">
              <Clock className="h-4 w-4" />
            </div>
            <input
              type={event.allDay ? 'date' : 'datetime-local'}
              value={event.startDate}
              onChange={(e) => updateEvent({ startDate: e.target.value })}
              className="w-full rounded-xl bg-transparent py-2 pl-2.5 pr-2.5 text-xs text-slate-900 focus:outline-none dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Ends
          </label>
          <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center pl-3 pointer-events-none text-slate-400">
              <Clock className="h-4 w-4" />
            </div>
            <input
              type={event.allDay ? 'date' : 'datetime-local'}
              value={event.endDate}
              onChange={(e) => updateEvent({ endDate: e.target.value })}
              className="w-full rounded-xl bg-transparent py-2 pl-2.5 pr-2.5 text-xs text-slate-900 focus:outline-none dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* All Day Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="event-all-day"
          checked={event.allDay}
          onChange={(e) => updateEvent({ allDay: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="event-all-day" className="text-xs font-medium text-slate-700 dark:text-slate-300">
          All-day event
        </label>
      </div>

      {/* Location */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Location / Venue
        </label>
        <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center pl-3.5 pointer-events-none text-slate-400">
            <MapPin className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={event.location}
            onChange={(e) => updateEvent({ location: e.target.value })}
            placeholder="Room 302, 500 Howard St, San Francisco"
            className="w-full rounded-xl bg-transparent py-2 pl-3 pr-3 text-xs text-slate-900 focus:outline-none dark:text-white"
          />
        </div>
      </div>

      {/* Description / Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Description / Agenda
        </label>
        <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start pl-3.5 pt-2.5 pointer-events-none text-slate-400">
            <AlignLeft className="h-4 w-4" />
          </div>
          <textarea
            rows={2}
            value={event.description}
            onChange={(e) => updateEvent({ description: e.target.value })}
            placeholder="Keynote by founder, product demos, cocktail reception..."
            className="w-full rounded-xl bg-transparent py-2 pl-3 pr-3 text-xs text-slate-900 focus:outline-none dark:text-white resize-none"
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          When scanned with iOS or Android, prompts immediately to save event into Apple Calendar, Google Calendar, or Outlook.
        </p>
      </div>
    </div>
  );
};
