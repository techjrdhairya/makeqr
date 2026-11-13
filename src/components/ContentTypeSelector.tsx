import React, { useState } from 'react';
import { 
  Link, 
  Upload, 
  AlignLeft, 
  Wifi, 
  UserCheck, 
  Mail, 
  PhoneCall, 
  MessageSquare,
  Calendar,
  MapPin,
  Coins,
  Share2,
  Sparkles,
  Layers
} from 'lucide-react';
import { ContentType } from '../types';

interface ContentTypeSelectorProps {
  activeType: ContentType;
  onChange: (type: ContentType) => void;
}

interface TabItem {
  type: ContentType;
  label: string;
  category: 'web' | 'contact' | 'access';
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  color: {
    bg: string;
    text: string;
    darkBg: string;
    darkText: string;
  };
}

const TABS: TabItem[] = [
  { 
    type: 'url', 
    label: 'Link / URL', 
    category: 'web',
    icon: Link,
    badge: 'Popular',
    color: { bg: 'bg-indigo-50', text: 'text-indigo-600', darkBg: 'dark:bg-indigo-950/70', darkText: 'dark:text-indigo-400' }
  },
  { 
    type: 'file', 
    label: 'File Upload', 
    category: 'web',
    icon: Upload,
    badge: 'Cloud Host',
    color: { bg: 'bg-violet-50', text: 'text-violet-600', darkBg: 'dark:bg-violet-950/70', darkText: 'dark:text-violet-400' }
  },
  { 
    type: 'social', 
    label: 'Link-in-Bio', 
    category: 'web',
    icon: Share2,
    badge: 'Profiles',
    color: { bg: 'bg-pink-50', text: 'text-pink-600', darkBg: 'dark:bg-pink-950/70', darkText: 'dark:text-pink-400' }
  },
  { 
    type: 'vcard', 
    label: 'Contact Card', 
    category: 'contact',
    icon: UserCheck,
    badge: 'vCard',
    color: { bg: 'bg-blue-50', text: 'text-blue-600', darkBg: 'dark:bg-blue-950/70', darkText: 'dark:text-blue-400' }
  },
  { 
    type: 'wifi', 
    label: 'Wi-Fi Network', 
    category: 'access',
    icon: Wifi,
    badge: 'Instant Connect',
    color: { bg: 'bg-emerald-50', text: 'text-emerald-600', darkBg: 'dark:bg-emerald-950/70', darkText: 'dark:text-emerald-400' }
  },
  { 
    type: 'event', 
    label: 'Calendar Event', 
    category: 'access',
    icon: Calendar,
    color: { bg: 'bg-amber-50', text: 'text-amber-600', darkBg: 'dark:bg-amber-950/70', darkText: 'dark:text-amber-400' }
  },
  { 
    type: 'geo', 
    label: 'Location Pin', 
    category: 'access',
    icon: MapPin,
    color: { bg: 'bg-rose-50', text: 'text-rose-600', darkBg: 'dark:bg-rose-950/70', darkText: 'dark:text-rose-400' }
  },
  { 
    type: 'crypto', 
    label: 'Crypto Pay', 
    category: 'access',
    icon: Coins,
    color: { bg: 'bg-yellow-50', text: 'text-yellow-600', darkBg: 'dark:bg-yellow-950/70', darkText: 'dark:text-yellow-400' }
  },
  { 
    type: 'email', 
    label: 'Email Address', 
    category: 'contact',
    icon: Mail,
    color: { bg: 'bg-orange-50', text: 'text-orange-600', darkBg: 'dark:bg-orange-950/70', darkText: 'dark:text-orange-400' }
  },
  { 
    type: 'phone', 
    label: 'Phone Call', 
    category: 'contact',
    icon: PhoneCall,
    color: { bg: 'bg-teal-50', text: 'text-teal-600', darkBg: 'dark:bg-teal-950/70', darkText: 'dark:text-teal-400' }
  },
  { 
    type: 'sms', 
    label: 'SMS Message', 
    category: 'contact',
    icon: MessageSquare,
    color: { bg: 'bg-cyan-50', text: 'text-cyan-600', darkBg: 'dark:bg-cyan-950/70', darkText: 'dark:text-cyan-400' }
  },
  { 
    type: 'text', 
    label: 'Plain Text', 
    category: 'access',
    icon: AlignLeft,
    color: { bg: 'bg-slate-100', text: 'text-slate-600', darkBg: 'dark:bg-slate-800', darkText: 'dark:text-slate-300' }
  },
];

type CategoryFilter = 'all' | 'web' | 'contact' | 'access';

export const ContentTypeSelector: React.FC<ContentTypeSelectorProps> = ({
  activeType,
  onChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const filteredTabs = selectedCategory === 'all' 
    ? TABS 
    : TABS.filter(t => t.category === selectedCategory);

  return (
    <div className="w-full space-y-1.5 sm:space-y-2.5">
      {/* Category Pills Strip - desktop and tablet */}
      <div className="hidden sm:flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-white text-indigo-700 shadow-2xs dark:bg-slate-900 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            All (12)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('web')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              selectedCategory === 'web'
                ? 'bg-white text-indigo-700 shadow-2xs dark:bg-slate-900 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Web &amp; Media
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('contact')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              selectedCategory === 'contact'
                ? 'bg-white text-indigo-700 shadow-2xs dark:bg-slate-900 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Contacts &amp; People
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('access')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              selectedCategory === 'access'
                ? 'bg-white text-indigo-700 shadow-2xs dark:bg-slate-900 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Wi-Fi &amp; Utilities
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          <Layers className="h-3 w-3" />
          <span>Vector QR Standard</span>
        </div>
      </div>

      {/* Content Type Cards List */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none pt-0.5">
        {filteredTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeType === tab.type;
          return (
            <button
              key={tab.type}
              type="button"
              onClick={() => onChange(tab.type)}
              className={`group relative flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 whitespace-nowrap border cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 ring-2 ring-indigo-600/30'
                  : 'bg-white text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              {/* Icon with custom pastel tint when inactive */}
              <div
                className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : `${tab.color.bg} ${tab.color.text} ${tab.color.darkBg} ${tab.color.darkText}`
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>

              <div className="text-left">
                <span className="block leading-tight font-bold">{tab.label}</span>
              </div>

              {tab.badge && !isActive && (
                <span className="hidden xl:inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
