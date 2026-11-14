import type React from 'react';
import {
  MessageCircle, Instagram, Youtube, ClipboardList, Star, Music,
  Linkedin, Facebook, Send, Wallet, CalendarCheck,
} from 'lucide-react';
import type { QuickLinkKind } from '../utils/quicklinks';

export interface QuickLinkUi {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  description: string;
}

export const QUICKLINK_UI: Record<QuickLinkKind, QuickLinkUi> = {
  whatsapp: { icon: MessageCircle, iconBg: 'bg-emerald-50 dark:bg-emerald-950/50', iconColor: 'text-emerald-600 dark:text-emerald-400', description: 'Open a direct WhatsApp chat with your number and a ready-made first message.' },
  instagram: { icon: Instagram, iconBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/50', iconColor: 'text-fuchsia-600 dark:text-fuchsia-400', description: 'Send people straight to your Instagram profile, reel or post.' },
  youtube: { icon: Youtube, iconBg: 'bg-red-50 dark:bg-red-950/50', iconColor: 'text-red-600 dark:text-red-400', description: 'Link to a YouTube video, playlist or channel.' },
  gform: { icon: ClipboardList, iconBg: 'bg-violet-50 dark:bg-violet-950/50', iconColor: 'text-violet-600 dark:text-violet-400', description: 'Collect feedback, RSVPs or attendance with a Google Form.' },
  review: { icon: Star, iconBg: 'bg-amber-50 dark:bg-amber-950/50', iconColor: 'text-amber-600 dark:text-amber-400', description: 'Make it one scan for happy customers to leave a Google review.' },
  spotify: { icon: Music, iconBg: 'bg-green-50 dark:bg-green-950/50', iconColor: 'text-green-600 dark:text-green-400', description: 'Link to a Spotify song, album, playlist, artist or podcast.' },
  linkedin: { icon: Linkedin, iconBg: 'bg-sky-50 dark:bg-sky-950/50', iconColor: 'text-sky-700 dark:text-sky-400', description: 'Share your LinkedIn profile at events and on business cards.' },
  facebook: { icon: Facebook, iconBg: 'bg-blue-50 dark:bg-blue-950/50', iconColor: 'text-blue-600 dark:text-blue-400', description: 'Grow your Facebook page with a scan-to-follow code.' },
  telegram: { icon: Send, iconBg: 'bg-cyan-50 dark:bg-cyan-950/50', iconColor: 'text-cyan-600 dark:text-cyan-400', description: 'Open a Telegram profile, channel or group invite.' },
  payment: { icon: Wallet, iconBg: 'bg-teal-50 dark:bg-teal-950/50', iconColor: 'text-teal-600 dark:text-teal-400', description: 'Get paid in seconds with a UPI or PayPal payment code.' },
  booking: { icon: CalendarCheck, iconBg: 'bg-orange-50 dark:bg-orange-950/50', iconColor: 'text-orange-600 dark:text-orange-400', description: 'Link to your booking page or appointment scheduler.' },
};
