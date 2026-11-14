export type QuickLinkKind =
  | 'whatsapp' | 'instagram' | 'youtube' | 'gform' | 'review' | 'spotify'
  | 'linkedin' | 'facebook' | 'telegram' | 'payment' | 'booking';

export interface QuickLinkData {
  kind: QuickLinkKind;
  /** Main field: phone, username, link, UPI id, place id ... depending on kind. */
  value: string;
  /** WhatsApp starter message, or payee name for payments. */
  message: string;
  /** Optional payment amount. */
  amount: string;
}

export interface QuickLinkDef {
  kind: QuickLinkKind;
  title: string;
  short: string;
  fieldLabel: string;
  placeholder: string;
  help: string;
  inputMode?: 'text' | 'tel' | 'url';
  messageLabel?: string;
  messagePlaceholder?: string;
  amountLabel?: string;
  frameTitle: string;
  example: string;
}

export const QUICKLINK_DEFS: Record<QuickLinkKind, QuickLinkDef> = {
  whatsapp: {
    kind: 'whatsapp', title: 'WhatsApp Message', short: 'WhatsApp',
    fieldLabel: 'WhatsApp number (with country code)', placeholder: '+91 98765 43210', inputMode: 'tel',
    help: 'Scanners open a chat with this number. Include the country code, e.g. +91 for India.',
    messageLabel: 'Starter message (optional)', messagePlaceholder: 'Hi! I scanned your QR code and would like to know more.',
    frameTitle: 'CHAT ON WHATSAPP', example: 'https://wa.me/919876543210',
  },
  instagram: {
    kind: 'instagram', title: 'Instagram Profile', short: 'Instagram',
    fieldLabel: 'Instagram username or profile link', placeholder: '@yourname', 
    help: 'Type your username, or paste a profile, reel or post link.',
    frameTitle: 'FOLLOW ON INSTAGRAM', example: 'https://instagram.com/instagram',
  },
  youtube: {
    kind: 'youtube', title: 'YouTube Video', short: 'YouTube',
    fieldLabel: 'YouTube video, channel or @handle', placeholder: 'https://youtube.com/watch?v=... or @yourchannel', inputMode: 'url',
    help: 'Paste a video, playlist or channel link, or type a channel @handle.',
    frameTitle: 'WATCH ON YOUTUBE', example: 'https://youtube.com/@youtube',
  },
  gform: {
    kind: 'gform', title: 'Google Form / Survey', short: 'Google Form',
    fieldLabel: 'Google Form link', placeholder: 'https://forms.gle/...', inputMode: 'url',
    help: 'In Google Forms click Send, then the link tab, and copy the link here.',
    frameTitle: 'FILL THE FORM', example: 'https://forms.gle/example',
  },
  review: {
    kind: 'review', title: 'Google Review', short: 'Review',
    fieldLabel: 'Google Place ID or review link', placeholder: 'ChIJ... or https://g.page/r/.../review',
    help: 'Paste your review link, or your Place ID (starts with ChIJ). Find it with Google’s Place ID Finder.',
    frameTitle: 'REVIEW US ON GOOGLE', example: 'https://search.google.com/local/writereview?placeid=ChIJexample',
  },
  spotify: {
    kind: 'spotify', title: 'Spotify / Music', short: 'Spotify',
    fieldLabel: 'Spotify share link', placeholder: 'https://open.spotify.com/track/...', inputMode: 'url',
    help: 'In Spotify tap Share, then Copy link. Works for songs, albums, playlists, artists and podcasts.',
    frameTitle: 'LISTEN ON SPOTIFY', example: 'https://open.spotify.com',
  },
  linkedin: {
    kind: 'linkedin', title: 'LinkedIn Profile', short: 'LinkedIn',
    fieldLabel: 'LinkedIn username or profile link', placeholder: 'your-name or https://linkedin.com/in/your-name',
    help: 'Use the end of your profile link, or paste the full link. Company pages: paste the full link.',
    frameTitle: 'CONNECT ON LINKEDIN', example: 'https://linkedin.com/in/example',
  },
  facebook: {
    kind: 'facebook', title: 'Facebook Page', short: 'Facebook',
    fieldLabel: 'Facebook page name or link', placeholder: 'yourpage or https://facebook.com/yourpage',
    help: 'Type the page username, or paste the full page or profile link.',
    frameTitle: 'LIKE US ON FACEBOOK', example: 'https://facebook.com/facebook',
  },
  telegram: {
    kind: 'telegram', title: 'Telegram Chat', short: 'Telegram',
    fieldLabel: 'Telegram username or invite link', placeholder: '@yourname or https://t.me/+invite',
    help: 'Type a username for a profile or channel, or paste a group invite link.',
    frameTitle: 'CHAT ON TELEGRAM', example: 'https://t.me/telegram',
  },
  payment: {
    kind: 'payment', title: 'Payment (UPI / PayPal)', short: 'Payment',
    fieldLabel: 'UPI ID or payment link', placeholder: 'yourname@upi or https://paypal.me/yourname',
    help: 'A UPI ID opens any UPI app with the payment ready. A PayPal.me or other link opens that page.',
    messageLabel: 'Payee name / note (optional)', messagePlaceholder: 'Your shop or name',
    amountLabel: 'Amount (optional)',
    frameTitle: 'SCAN & PAY', example: 'upi://pay?pa=yourname@upi',
  },
  booking: {
    kind: 'booking', title: 'Booking & Appointments', short: 'Booking',
    fieldLabel: 'Booking page link', placeholder: 'https://calendly.com/yourname', inputMode: 'url',
    help: 'Paste the link to your booking page: Calendly, Google Calendar appointments, Cal.com and similar.',
    frameTitle: 'BOOK AN APPOINTMENT', example: 'https://calendly.com',
  },
};

export const QUICKLINK_ORDER: QuickLinkKind[] = [
  'whatsapp', 'instagram', 'youtube', 'gform', 'review', 'spotify',
  'linkedin', 'facebook', 'telegram', 'payment', 'booking',
];

export const DEFAULT_QUICKLINK: QuickLinkData = { kind: 'whatsapp', value: '', message: '', amount: '' };

const toUrl = (v: string) => (/^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v.replace(/^\/+/, '')}`);
const isLink = (v: string) => /^(https?:\/\/|www\.)/i.test(v) || /\.[a-z]{2,}\//i.test(v);
const handle = (v: string) => v.trim().replace(/^@/, '').replace(/\s+/g, '');

/** True when the user has typed something usable for the chosen service. */
export function quickLinkHasValue(q: QuickLinkData): boolean {
  return q.value.trim().length > 0;
}

/** Build the final link / payload encoded in the QR code. */
export function buildQuickLink(q: QuickLinkData): string {
  const def = QUICKLINK_DEFS[q.kind];
  const v = (q.value || '').trim();
  if (!v) return def.example;

  switch (q.kind) {
    case 'whatsapp': {
      const digits = v.replace(/[^\d]/g, '').replace(/^00/, '');
      const text = q.message.trim();
      return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
    }
    case 'instagram':
      return isLink(v) ? toUrl(v) : `https://instagram.com/${handle(v)}`;
    case 'youtube':
      if (isLink(v)) return toUrl(v);
      if (v.startsWith('@')) return `https://youtube.com/${handle(v).replace(/^/, '@')}`;
      if (/^[\w-]{11}$/.test(v)) return `https://youtu.be/${v}`;
      return `https://youtube.com/@${handle(v)}`;
    case 'gform':
    case 'booking':
      return toUrl(v);
    case 'review':
      if (/^ChIJ[\w-]+$/.test(v)) return `https://search.google.com/local/writereview?placeid=${v}`;
      return toUrl(v);
    case 'spotify': {
      const m = v.match(/^spotify:(track|album|playlist|artist|show|episode):([A-Za-z0-9]+)$/);
      if (m) return `https://open.spotify.com/${m[1]}/${m[2]}`;
      return toUrl(v);
    }
    case 'linkedin':
      return isLink(v) ? toUrl(v) : `https://linkedin.com/in/${handle(v)}`;
    case 'facebook':
      return isLink(v) ? toUrl(v) : `https://facebook.com/${handle(v)}`;
    case 'telegram':
      return isLink(v) ? toUrl(v) : `https://t.me/${handle(v)}`;
    case 'payment': {
      if (/^upi:\/\//i.test(v)) return v;
      if (isLink(v)) {
        const url = toUrl(v);
        if (/paypal\.me\//i.test(url) && q.amount.trim()) return `${url.replace(/\/+$/, '')}/${q.amount.trim()}`;
        return url;
      }
      const params = [`pa=${encodeURIComponent(v).replace(/%40/g, '@')}`];
      if (q.message.trim()) params.push(`pn=${encodeURIComponent(q.message.trim())}`);
      if (q.amount.trim()) params.push(`am=${encodeURIComponent(q.amount.trim())}`, 'cu=INR');
      return `upi://pay?${params.join('&')}`;
    }
  }
}
