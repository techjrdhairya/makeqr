import React, { useState } from 'react';
import type { QuickLinkKind } from '../utils/quicklinks';
import type { PageKind } from '../utils/pages';
import { 
  Globe, 
  FileText, 
  Image as ImageIcon, 
  AlignLeft, 
  MessageSquare, 
  Instagram, 
  Contact2, 
  Wifi, 
  Music, 
  Smartphone, 
  MapPin, 
  Mail, 
  Send, 
  Calendar, 
  Coins, 
  Share2, 
  Search,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  UserRound,
  UtensilsCrossed,
  Images
} from 'lucide-react';
import { ContentType } from '../types';

interface ChooseTypePageProps {
  onSelectType: (type: ContentType, quickKind?: QuickLinkKind, pageKind?: PageKind) => void;
  onBackToHome?: () => void;
  onGoToMyCodes?: () => void;
}

interface TypeItem {
  id: ContentType;
  quickKind?: QuickLinkKind;
  pageKind?: PageKind;
  title: string;
  category: 'links' | 'media' | 'social' | 'utilities';
  description: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

const QR_TYPES: TypeItem[] = [
  {
    id: 'page',
    pageKind: 'card',
    title: 'Business Card Page',
    category: 'links',
    description: 'A mobile page with call, WhatsApp, email and Save contact. Edit it any time without reprinting.',
    badge: 'Editable page',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
    icon: UserRound,
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'page',
    pageKind: 'menu',
    title: 'Restaurant Menu',
    category: 'links',
    description: 'Sections, prices and tags on a clean mobile menu. Change a price later and the QR stays the same.',
    badge: 'Editable page',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300',
    icon: UtensilsCrossed,
    iconBg: 'bg-orange-50 dark:bg-orange-950/50',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'page',
    pageKind: 'gallery',
    title: 'Photo Gallery',
    category: 'links',
    description: 'Share up to 12 photos with captions on one page. Add or swap photos after printing.',
    badge: 'Editable page',
    badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-950/70 dark:text-pink-300',
    icon: Images,
    iconBg: 'bg-pink-50 dark:bg-pink-950/50',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    id: 'url',
    title: 'URL / Website Link',
    category: 'links',
    description: 'Paste website, video link, portfolio, menu or article to redirect visitors immediately.',
    badge: 'Most Popular',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
    icon: Globe,
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'file',
    title: 'PDF & Documents',
    category: 'media',
    description: 'Upload PDF files, digital restaurant menus, user manuals, brochures, or catalogs.',
    badge: 'Dynamic Cloud',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    icon: FileText,
    iconBg: 'bg-rose-50 dark:bg-rose-950/50',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'file',
    title: 'Images & Photos',
    category: 'media',
    description: 'Upload high-res photos, product shots, event galleries, or posters with custom short links.',
    badge: 'Dynamic Cloud',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    icon: ImageIcon,
    iconBg: 'bg-amber-50 dark:bg-amber-950/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'vcard',
    title: 'vCard / Business Card',
    category: 'social',
    description: 'Share your full digital business card: name, phone, email, company, address & website.',
    badge: 'Professional',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300',
    icon: Contact2,
    iconBg: 'bg-purple-50 dark:bg-purple-950/50',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'wifi',
    title: 'Wi-Fi Network',
    category: 'utilities',
    description: 'Allow guests and customers to join your Wi-Fi instantly without typing long passwords.',
    badge: 'Instant Connect',
    badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300',
    icon: Wifi,
    iconBg: 'bg-sky-50 dark:bg-sky-950/50',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    id: 'text',
    title: 'Plain Text & Note',
    category: 'utilities',
    description: 'Display encoded plaintext notes, announcements, coupons, codes, or instructions.',
    icon: AlignLeft,
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-700 dark:text-slate-300',
  },
  {
    id: 'social',
    title: 'Social Bio / Multi-Link',
    category: 'social',
    description: 'Linktree-style landing page gathering Instagram, YouTube, TikTok, X, and LinkedIn.',
    badge: 'Top Choice',
    badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-950/70 dark:text-pink-300',
    icon: Share2,
    iconBg: 'bg-pink-50 dark:bg-pink-950/50',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    id: 'quicklink',
    quickKind: 'whatsapp',
    title: 'WhatsApp Message',
    category: 'social',
    description: 'Open a direct WhatsApp chat with pre-filled phone number and starter message.',
    icon: MessageSquare,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'quicklink',
    quickKind: 'instagram',
    title: 'Instagram Profile',
    category: 'social',
    description: 'Direct followers to your personal profile, business page, or latest reel.',
    icon: Instagram,
    iconBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/50',
    iconColor: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
  {
    id: 'file',
    title: 'Audio / MP3 Track',
    category: 'media',
    description: 'Upload or link podcast episodes, tracks, audio guides, or songs with instant playback.',
    badge: 'Media Stream',
    badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300',
    icon: Music,
    iconBg: 'bg-violet-50 dark:bg-violet-950/50',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    id: 'url',
    title: 'App Store / Play Market',
    category: 'links',
    description: 'Intelligent single QR redirecting iOS users to App Store and Android users to Play Store.',
    icon: Smartphone,
    iconBg: 'bg-cyan-50 dark:bg-cyan-950/50',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'geo',
    title: 'Location & Google Maps',
    category: 'utilities',
    description: 'Direct clients to physical store location, event venue, or GPS coordinates.',
    icon: MapPin,
    iconBg: 'bg-red-50 dark:bg-red-950/50',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'email',
    title: 'E-mail Draft',
    category: 'utilities',
    description: 'Pre-populate recipient email address, subject line, and body message template.',
    icon: Mail,
    iconBg: 'bg-blue-50 dark:bg-blue-950/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'phone',
    title: 'Phone Call & SMS',
    category: 'utilities',
    description: 'Dial a customer support phone number or send pre-written SMS upon scanning.',
    icon: Send,
    iconBg: 'bg-teal-50 dark:bg-teal-950/50',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  {
    id: 'event',
    title: 'Calendar Event',
    category: 'utilities',
    description: 'Add webinar, conference, party, or wedding event directly to Google / Apple Calendar.',
    icon: Calendar,
    iconBg: 'bg-orange-50 dark:bg-orange-950/50',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'crypto',
    title: 'Cryptocurrency Wallet',
    category: 'utilities',
    description: 'Receive Bitcoin, Ethereum, Solana, or USDT payments directly to your wallet address.',
    icon: Coins,
    iconBg: 'bg-yellow-50 dark:bg-yellow-950/50',
    iconColor: 'text-yellow-600 dark:text-yellow-500',
  },
  {
    id: 'quicklink',
    quickKind: 'youtube',
    title: 'YouTube Video',
    category: 'social',
    description: 'Send scanners straight to a video, channel or playlist.',
    icon: Globe,
    iconBg: 'bg-red-50 dark:bg-red-950/50',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'quicklink',
    quickKind: 'gform',
    title: 'Google Form / Survey',
    category: 'links',
    description: 'Collect feedback, RSVPs or attendance with a form link.',
    icon: FileText,
    iconBg: 'bg-violet-50 dark:bg-violet-950/50',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    id: 'quicklink',
    quickKind: 'review',
    title: 'Google Review',
    category: 'links',
    description: 'Make it one scan for happy customers to leave a review.',
    icon: Sparkles,
    iconBg: 'bg-amber-50 dark:bg-amber-950/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'quicklink',
    quickKind: 'spotify',
    title: 'Spotify / Music',
    category: 'media',
    description: 'Link to a song, album, playlist or podcast.',
    icon: Music,
    iconBg: 'bg-green-50 dark:bg-green-950/50',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'quicklink',
    quickKind: 'linkedin',
    title: 'LinkedIn Profile',
    category: 'social',
    description: 'Share your professional profile at events and on cards.',
    icon: Share2,
    iconBg: 'bg-sky-50 dark:bg-sky-950/50',
    iconColor: 'text-sky-700 dark:text-sky-400',
  },
  {
    id: 'quicklink',
    quickKind: 'facebook',
    title: 'Facebook Page',
    category: 'social',
    description: 'Grow your page with a scan-to-follow code.',
    icon: Share2,
    iconBg: 'bg-blue-50 dark:bg-blue-950/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'quicklink',
    quickKind: 'telegram',
    title: 'Telegram Chat',
    category: 'social',
    description: 'Open a Telegram profile, channel or group invite.',
    icon: Send,
    iconBg: 'bg-cyan-50 dark:bg-cyan-950/50',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'quicklink',
    quickKind: 'payment',
    title: 'Payment Link (UPI / PayPal)',
    category: 'utilities',
    description: 'Link to a payment page so customers can pay in seconds.',
    icon: Coins,
    iconBg: 'bg-teal-50 dark:bg-teal-950/50',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  {
    id: 'quicklink',
    quickKind: 'booking',
    title: 'Booking & Appointments',
    category: 'utilities',
    description: 'Link to your booking page or calendar scheduler.',
    icon: Calendar,
    iconBg: 'bg-orange-50 dark:bg-orange-950/50',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
];

export const ChooseTypePage: React.FC<ChooseTypePageProps> = ({
  onSelectType,
  onBackToHome,
  onGoToMyCodes,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'links' | 'media' | 'social' | 'utilities'>('all');

  const filteredTypes = QR_TYPES.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Step 1: Select QR Code Type</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Choose QR Code Type
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Select the content format for your QR code. You can upload media files, create custom short links, or share instant actions.
          </p>

          {/* Search Bar matching video 00:08 */}
          <div className="mt-6 max-w-xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search types (e.g. PDF, image, wifi, whatsapp, contact, crypto)..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {[
              { id: 'all', label: 'All Types' },
              { id: 'links', label: 'Links & Apps' },
              { id: 'media', label: 'Files & Media' },
              { id: 'social', label: 'Social & Bio' },
              { id: 'utilities', label: 'Utilities & Info' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of QR Types */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredTypes.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={`${item.id}-${item.quickKind ?? item.pageKind ?? ''}-${index}`}
                type="button"
                onClick={() => onSelectType(item.id, item.quickKind, item.pageKind)}
                className="group text-left p-5 rounded-2xl bg-white border border-slate-200/90 dark:bg-slate-900 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3.5">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor} group-hover:scale-105 transition-transform shadow-xs`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Create QR</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {filteredTypes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400 text-sm">No QR types matched your search "{searchQuery}".</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-3 px-4 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 text-xs font-bold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Bottom Quick Navigation */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ← Back to Home
              </button>
            )}
          </div>

          {onGoToMyCodes && (
            <button
              type="button"
              onClick={onGoToMyCodes}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
            >
              <Clock className="h-4 w-4" />
              <span>View Saved QR Codes</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
