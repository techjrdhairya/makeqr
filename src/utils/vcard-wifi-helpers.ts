import { buildQuickLink, type QuickLinkData } from './quicklinks';
import {
  ContentType,
  WifiData,
  VCardData,
  EmailData,
  SmsData,
  FileData,
  EventData,
  GeoData,
  CryptoData,
  SocialData,
  DynamicQRInfo,
} from '../types';
import { getFileViewerUrl } from './file-store';

/**
 * Generates standards-compliant string payloads for various QR formats
 */

export function generateWifiString(wifi: WifiData): string {
  const escapedSsid = escapeWifiString(wifi.ssid);
  const escapedPass = escapeWifiString(wifi.password);
  const enc = wifi.encryption === 'nopass' ? 'nopass' : wifi.encryption;
  const hidden = wifi.hidden ? 'true' : 'false';
  return `WIFI:T:${enc};S:${escapedSsid};P:${escapedPass};H:${hidden};;`;
}

function escapeWifiString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/:/g, '\\:')
    .replace(/"/g, '\\"');
}

export function generateVCardString(vcard: VCardData): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${vcard.lastName || ''};${vcard.firstName || ''};;${vcard.prefix || ''};`,
    `FN:${[vcard.prefix, vcard.firstName, vcard.lastName].filter(Boolean).join(' ')}`,
  ];

  const org = [vcard.company, vcard.department].filter(Boolean).join(';');
  if (org) lines.push(`ORG:${org}`);
  if (vcard.title) lines.push(`TITLE:${vcard.title}`);

  if (vcard.phone) {
    lines.push(`TEL;TYPE=CELL,VOICE:${vcard.phone.trim()}`);
  }
  if (vcard.workPhone) {
    lines.push(`TEL;TYPE=WORK,VOICE:${vcard.workPhone.trim()}`);
  }
  if (vcard.email) {
    lines.push(`EMAIL;TYPE=INTERNET,HOME:${vcard.email.trim()}`);
  }
  if (vcard.workEmail) {
    lines.push(`EMAIL;TYPE=INTERNET,WORK:${vcard.workEmail.trim()}`);
  }
  if (vcard.website) {
    const web = vcard.website.startsWith('http') ? vcard.website : `https://${vcard.website}`;
    lines.push(`URL:${web}`);
  }

  // Address
  if (vcard.street || vcard.city || vcard.state || vcard.zip || vcard.country) {
    lines.push(
      `ADR;TYPE=WORK:;;${vcard.street || ''};${vcard.city || ''};${vcard.state || ''};${vcard.zip || ''};${vcard.country || ''}`
    );
  } else if (vcard.address) {
    lines.push(`ADR;TYPE=WORK:;;${vcard.address.replace(/\n/g, ', ')};;;;`);
  }

  if (vcard.socialLinkedIn) {
    const li = vcard.socialLinkedIn.startsWith('http')
      ? vcard.socialLinkedIn
      : `https://linkedin.com/in/${vcard.socialLinkedIn.replace(/^@/, '')}`;
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${li}`);
  }
  if (vcard.socialTwitter) {
    const tw = vcard.socialTwitter.startsWith('http')
      ? vcard.socialTwitter
      : `https://x.com/${vcard.socialTwitter.replace(/^@/, '')}`;
    lines.push(`X-SOCIALPROFILE;TYPE=twitter:${tw}`);
  }

  if (vcard.notes) {
    lines.push(`NOTE:${vcard.notes.replace(/\n/g, '\\n')}`);
  }

  lines.push('END:VCARD');
  return lines.join('\n');
}

/**
 * Parses raw .vcf text to extract VCardData fields
 */
export function parseVCardString(vcf: string): Partial<VCardData> {
  const result: Partial<VCardData> = {};
  const lines = vcf.split(/\r\n|\r|\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^FN:/i.test(trimmed)) {
      const fn = trimmed.substring(3).trim();
      const parts = fn.split(' ');
      if (parts.length === 1) {
        result.firstName = parts[0];
      } else if (parts.length > 1) {
        result.firstName = parts.slice(0, -1).join(' ');
        result.lastName = parts[parts.length - 1];
      }
    } else if (/^N:/i.test(trimmed)) {
      const parts = trimmed.substring(2).split(';');
      if (parts[0] && !result.lastName) result.lastName = parts[0];
      if (parts[1] && !result.firstName) result.firstName = parts[1];
      if (parts[3] && !result.prefix) result.prefix = parts[3];
    } else if (/^ORG:/i.test(trimmed)) {
      const orgParts = trimmed.substring(4).split(';');
      result.company = orgParts[0] || '';
      if (orgParts[1]) result.department = orgParts[1];
    } else if (/^TITLE:/i.test(trimmed)) {
      result.title = trimmed.substring(6).trim();
    } else if (/^TEL.*CELL/i.test(trimmed) || (!result.phone && /^TEL/i.test(trimmed))) {
      const val = trimmed.split(':')[1]?.trim();
      if (val) result.phone = val;
    } else if (/^TEL.*WORK/i.test(trimmed)) {
      const val = trimmed.split(':')[1]?.trim();
      if (val) result.workPhone = val;
    } else if (/^EMAIL.*WORK/i.test(trimmed)) {
      const val = trimmed.split(':')[1]?.trim();
      if (val) result.workEmail = val;
    } else if (/^EMAIL/i.test(trimmed)) {
      const val = trimmed.split(':')[1]?.trim();
      if (val) result.email = val;
    } else if (/^URL/i.test(trimmed)) {
      const val = trimmed.split(':').slice(1).join(':').trim();
      if (val) result.website = val;
    } else if (/^ADR/i.test(trimmed)) {
      const val = trimmed.split(':')[1] || '';
      const adrParts = val.split(';');
      if (adrParts[2]) result.street = adrParts[2];
      if (adrParts[3]) result.city = adrParts[3];
      if (adrParts[4]) result.state = adrParts[4];
      if (adrParts[5]) result.zip = adrParts[5];
      if (adrParts[6]) result.country = adrParts[6];
      result.address = adrParts.filter(Boolean).join(', ');
    } else if (/^NOTE:/i.test(trimmed)) {
      result.notes = trimmed.substring(5).replace(/\\n/g, '\n').trim();
    }
  }

  return result;
}

export function generateEmailString(email: EmailData): string {
  const params: string[] = [];
  if (email.subject) params.push(`subject=${encodeURIComponent(email.subject)}`);
  if (email.body) params.push(`body=${encodeURIComponent(email.body)}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return `mailto:${email.email}${query}`;
}

export function generateSmsString(sms: SmsData): string {
  const msg = sms.message ? `?body=${encodeURIComponent(sms.message)}` : '';
  return `sms:${sms.phone}${msg}`;
}

export function generatePhoneString(phone: string): string {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');
  const cleanPhone = hasPlus ? `+${digitsOnly}` : digitsOnly;
  return `tel:${cleanPhone || '+15551234567'}`;
}

/**
 * Format datetime to standard iCalendar string: YYYYMMDDTHHMMSS
 */
function formatICalDate(dateStr: string, allDay: boolean): string {
  if (!dateStr) return '';
  const clean = dateStr.replace(/[-:]/g, '');
  if (allDay) {
    return clean.split('T')[0];
  }
  // Ensure seconds are included if not present
  if (clean.length === 13) {
    return `${clean}00`;
  }
  return clean.length >= 15 ? clean.substring(0, 15) : clean;
}

export function generateEventString(event: EventData): string {
  const dtStart = formatICalDate(event.startDate, event.allDay);
  const dtEnd = formatICalDate(event.endDate, event.allDay);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MakeQR//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${event.title.replace(/\n/g, ' ')}`,
  ];

  if (dtStart) {
    lines.push(event.allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`);
  }
  if (dtEnd) {
    lines.push(event.allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${event.location.replace(/\n/g, ' ')}`);
  }
  if (event.description) {
    lines.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\n');
}

export function generateGeoString(geo: GeoData): string {
  if (geo.provider === 'google') {
    const q = geo.query ? encodeURIComponent(geo.query) : `${geo.latitude},${geo.longitude}`;
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }
  if (geo.provider === 'apple') {
    const q = geo.query ? `&q=${encodeURIComponent(geo.query)}` : '';
    return `https://maps.apple.com/?ll=${geo.latitude},${geo.longitude}${q}`;
  }
  // Native geo: URI scheme
  const qParam = geo.query ? `?q=${encodeURIComponent(geo.query)}` : '';
  return `geo:${geo.latitude},${geo.longitude}${qParam}`;
}

export function generateCryptoString(crypto: CryptoData): string {
  const addr = crypto.address.trim();
  switch (crypto.currency) {
    case 'BTC': {
      const params: string[] = [];
      if (crypto.amount) params.push(`amount=${crypto.amount}`);
      if (crypto.memo) params.push(`message=${encodeURIComponent(crypto.memo)}`);
      const q = params.length ? `?${params.join('&')}` : '';
      return `bitcoin:${addr}${q}`;
    }
    case 'ETH': {
      const params: string[] = [];
      if (crypto.amount) params.push(`value=${crypto.amount}`);
      const q = params.length ? `?${params.join('&')}` : '';
      return `ethereum:${addr}${q}`;
    }
    case 'SOL': {
      const params: string[] = [];
      if (crypto.amount) params.push(`amount=${crypto.amount}`);
      if (crypto.memo) params.push(`memo=${encodeURIComponent(crypto.memo)}`);
      const q = params.length ? `?${params.join('&')}` : '';
      return `solana:${addr}${q}`;
    }
    case 'USDT': {
      return `ethereum:${addr}?token=USDT${crypto.amount ? `&value=${crypto.amount}` : ''}`;
    }
    default:
      return addr;
  }
}

export function generateSocialString(social: SocialData): string {
  // Compress social bundle data into URL query for portable landing view
  try {
    const payload = {
      n: social.displayName,
      b: social.bio,
      t: social.theme,
      l: social.links.map((link) => ({ p: link.platform, l: link.label, u: link.url })),
    };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    return `${window.location.origin}/?bio=${b64}`;
  } catch {
    return window.location.origin;
  }
}

export function generatePayloadString(
  type: ContentType,
  values: {
    url: string;
    text: string;
    file?: FileData;
    wifi: WifiData;
    vcard: VCardData;
    email: EmailData;
    phone: string;
    sms: SmsData;
    event?: EventData;
    geo?: GeoData;
    crypto?: CryptoData;
    social?: SocialData;
    quicklink?: QuickLinkData;
    dynamic?: DynamicQRInfo;
    expirationDate?: string | null;
    expirationMessage?: string;
  }
): string {
  // If an expiration date is configured and has already passed, route to expired screen
  if (values.expirationDate) {
    const expTime = new Date(values.expirationDate).getTime();
    if (!isNaN(expTime) && Date.now() > expTime) {
      const msgParam = values.expirationMessage ? `&msg=${encodeURIComponent(values.expirationMessage)}` : '';
      return `${window.location.origin}/expired?date=${encodeURIComponent(values.expirationDate)}${msgParam}`;
    }
  }

  // File QRs resolve through the file's own id / custom slug (handled below).
  // A leftover generic dynamic link (e.g. from the URL tab, pointing at github.com)
  // must never override them.
  // Check if Dynamic QR is enabled
  if (type !== 'file' && values.dynamic?.isDynamic) {
    const slug = values.dynamic.customSlug || values.dynamic.dynamicId;
    if (slug) {
      return `${window.location.origin}/${slug}`;
    }
  }

  switch (type) {
    case 'url': {
      const u = values.url.trim();
      if (!u) return 'https://example.com';
      if (!/^https?:\/\//i.test(u)) {
        return `https://${u}`;
      }
      return u;
    }
    case 'text':
      return values.text.trim() || 'Hello, World!';
    case 'file':
      if (values.file) {
        if (values.file.customSlug) {
          return `${window.location.origin}/${values.file.customSlug}`;
        }
        if (values.file.encodeMode === 'direct' && values.file.dataUrl.length <= 1800) {
          return values.file.dataUrl;
        }
        return getFileViewerUrl(values.file.id);
      }
      return window.location.origin;
    case 'wifi':
      return generateWifiString(values.wifi);
    case 'vcard':
      return generateVCardString(values.vcard);
    case 'email':
      return generateEmailString(values.email);
    case 'phone':
      return generatePhoneString(values.phone || '+1234567890');
    case 'sms':
      return generateSmsString(values.sms);
    case 'event':
      return values.event ? generateEventString(values.event) : 'BEGIN:VCALENDAR...';
    case 'geo':
      return values.geo ? generateGeoString(values.geo) : 'https://maps.google.com';
    case 'crypto':
      return values.crypto ? generateCryptoString(values.crypto) : 'bitcoin:';
    case 'social':
      return values.social ? generateSocialString(values.social) : window.location.origin;
    case 'quicklink':
      return values.quicklink ? buildQuickLink(values.quicklink) : window.location.origin;
    default:
      return 'https://example.com';
  }
}
