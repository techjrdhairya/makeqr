import { QRConfig } from '../types';
import { createPage } from './pages';

export interface BuiltinLogo {
  id: string;
  name: string;
  category: 'social' | 'general' | 'brand';
  svgDataUri: string;
}

// Function to convert simple SVG strings to Data URIs safely
function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const BUILTIN_LOGOS: BuiltinLogo[] = [
  {
    id: 'makeqr',
    name: 'MakeQR ("make" inside QR)',
    category: 'brand',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <rect x="2" y="2" width="116" height="116" rx="26" fill="#4f46e5" />
        <rect x="14" y="14" width="28" height="28" rx="7" fill="none" stroke="#ffffff" stroke-width="4" />
        <rect x="21" y="21" width="14" height="14" rx="3.5" fill="#ffffff" />
        <rect x="78" y="14" width="28" height="28" rx="7" fill="none" stroke="#ffffff" stroke-width="4" />
        <rect x="85" y="21" width="14" height="14" rx="3.5" fill="#ffffff" />
        <rect x="14" y="78" width="28" height="28" rx="7" fill="none" stroke="#ffffff" stroke-width="4" />
        <rect x="21" y="85" width="14" height="14" rx="3.5" fill="#ffffff" />
        <rect x="49" y="17" width="6" height="6" rx="1.5" fill="#ffffff" />
        <rect x="58" y="17" width="6" height="6" rx="1.5" fill="#c7d2fe" />
        <rect x="67" y="17" width="6" height="6" rx="1.5" fill="#ffffff" />
        <rect x="17" y="49" width="6" height="6" rx="1.5" fill="#ffffff" />
        <rect x="17" y="58" width="6" height="6" rx="1.5" fill="#c7d2fe" />
        <rect x="17" y="67" width="6" height="6" rx="1.5" fill="#ffffff" />
        <rect x="78" y="78" width="10" height="10" rx="2.5" fill="#ffffff" />
        <rect x="94" y="78" width="10" height="10" rx="2.5" fill="#c7d2fe" />
        <rect x="78" y="94" width="10" height="10" rx="2.5" fill="#c7d2fe" />
        <rect x="94" y="94" width="10" height="10" rx="2.5" fill="#ffffff" />
        <rect x="22" y="45" width="76" height="30" rx="9" fill="#ffffff" stroke="#e0e7ff" stroke-width="1.5" />
        <text x="60" y="67" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="21" letter-spacing="-0.5px" fill="#4338ca">make</text>
      </svg>`
    ),
  },
  {
    id: 'globe',
    name: 'Website / Link',
    category: 'general',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
    ),
  },
  {
    id: 'wifi',
    name: 'Wi-Fi',
    category: 'general',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><circle cx="12" cy="20" r="1" fill="#059669"/></svg>`
    ),
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#e1306c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`
    ),
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'social',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc2626"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#ffffff"/></svg>`
    ),
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'social',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0077b5"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64c-.88 0-1.6.72-1.6 1.6s.72 1.6 1.6 1.6 1.6-.72 1.6-1.6-.72-1.6-1.6-1.6z" fill="#ffffff"/></svg>`
    ),
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    category: 'social',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0f172a"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
    ),
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'social',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0f172a"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>`
    ),
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'social',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.8 14.16c-.24.68-1.39 1.3-1.92 1.36-.51.06-1.17.09-3.77-.96-3.32-1.35-5.46-4.73-5.63-4.95-.16-.22-1.35-1.8-1.35-3.43 0-1.63.85-2.43 1.15-2.76.3-.33.65-.41.87-.41.22 0 .43 0 .62.01.2.01.47-.08.73.55.27.65.92 2.25 1 2.41.08.16.13.35.03.57-.11.22-.16.35-.32.54-.16.19-.34.42-.49.57-.16.16-.33.33-.14.66.19.33.84 1.38 1.8 2.24 1.24 1.1 2.29 1.45 2.62 1.61.33.16.52.14.71-.08.19-.22.82-.95 1.04-1.28.22-.33.43-.27.73-.16.3.11 1.91.9 2.24 1.06.33.16.54.24.62.38.09.13.09.79-.15 1.47z"/></svg>`
    ),
  },
  {
    id: 'user',
    name: 'Contact Card',
    category: 'general',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    ),
  },
  {
    id: 'mail',
    name: 'Email',
    category: 'general',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`
    ),
  },
  {
    id: 'phone',
    name: 'Phone Call',
    category: 'general',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`
    ),
  },
  {
    id: 'shopping',
    name: 'Store / Cart',
    category: 'general',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`
    ),
  },
  {
    id: 'coffee',
    name: 'Coffee / Menu',
    category: 'general',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`
    ),
  },
  {
    id: 'star',
    name: 'Star / Review',
    category: 'general',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
    ),
  },
  {
    id: 'calendar',
    name: 'Calendar Event',
    category: 'general',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`
    ),
  },
  {
    id: 'bitcoin',
    name: 'Crypto / BTC',
    category: 'brand',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b"><circle cx="12" cy="12" r="10"/><path d="M14.5 9a1.5 1.5 0 0 0-1.5-1.5H10v3h3a1.5 1.5 0 0 0 1.5-1.5zm.5 5a1.5 1.5 0 0 0-1.5-1.5H10v3h3.5a1.5 1.5 0 0 0 1.5-1.5z" fill="#ffffff"/><path d="M10 6v2M14 6v2M10 16v2M14 16v2" stroke="#ffffff" stroke-width="1.5"/></svg>`
    ),
  },
  {
    id: 'map-pin',
    name: 'Map Location',
    category: 'general',
    svgDataUri: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
    ),
  },
];

export interface ColorPreset {
  name: string;
  fgType: 'none' | 'linear' | 'radial';
  fgColor1: string;
  fgColor2: string;
  bgColor: string;
  eyeOuter?: string;
  eyeInner?: string;
  badgeColor?: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    name: 'Classic Noir',
    fgType: 'none',
    fgColor1: '#0f172a',
    fgColor2: '#0f172a',
    bgColor: '#ffffff',
    eyeOuter: '#0f172a',
    eyeInner: '#0f172a',
    badgeColor: '#0f172a',
  },
  {
    name: 'Indigo Pulse',
    fgType: 'linear',
    fgColor1: '#4338ca',
    fgColor2: '#6366f1',
    bgColor: '#ffffff',
    eyeOuter: '#3730a3',
    eyeInner: '#4f46e5',
    badgeColor: '#4f46e5',
  },
  {
    name: 'Sunset Coral',
    fgType: 'linear',
    fgColor1: '#e11d48',
    fgColor2: '#f97316',
    bgColor: '#ffffff',
    eyeOuter: '#be123c',
    eyeInner: '#ea580c',
    badgeColor: '#e11d48',
  },
  {
    name: 'Emerald Forest',
    fgType: 'linear',
    fgColor1: '#065f46',
    fgColor2: '#10b981',
    bgColor: '#ffffff',
    eyeOuter: '#064e3b',
    eyeInner: '#059669',
    badgeColor: '#059669',
  },
  {
    name: 'Electric Cyan',
    fgType: 'linear',
    fgColor1: '#0284c7',
    fgColor2: '#06b6d4',
    bgColor: '#ffffff',
    eyeOuter: '#0369a1',
    eyeInner: '#0891b2',
    badgeColor: '#0284c7',
  },
  {
    name: 'Royal Violet',
    fgType: 'linear',
    fgColor1: '#581c87',
    fgColor2: '#9333ea',
    bgColor: '#ffffff',
    eyeOuter: '#3b0764',
    eyeInner: '#7e22ce',
    badgeColor: '#7e22ce',
  },
  {
    name: 'Warm Mocha',
    fgType: 'linear',
    fgColor1: '#451a03',
    fgColor2: '#b45309',
    bgColor: '#ffffff',
    eyeOuter: '#78350f',
    eyeInner: '#92400e',
    badgeColor: '#92400e',
  },
  {
    name: 'Midnight Dark',
    fgType: 'linear',
    fgColor1: '#60a5fa',
    fgColor2: '#a855f7',
    bgColor: '#0f172a',
    eyeOuter: '#38bdf8',
    eyeInner: '#c084fc',
    badgeColor: '#1e293b',
  },
];

export const DEFAULT_CONFIG: QRConfig = {
  contentType: 'url',
  quicklink: { kind: 'whatsapp', value: '', message: '', amount: '' },
  page: createPage('card'),
  url: 'https://github.com',
  text: 'Hello from MakeQR! Scan and customize with your own branding.',
  file: undefined,
  wifi: {
    ssid: 'Guest_WiFi',
    password: 'ConnectNow2026',
    encryption: 'WPA',
    hidden: false,
  },
  vcard: {
    firstName: 'Alex',
    lastName: 'Morgan',
    phone: '+1 (555) 349-2810',
    email: 'alex.morgan@company.com',
    company: 'Creative Studios',
    title: 'Brand Director',
    website: 'https://creativestudios.example.com',
    address: '742 Evergreen Terrace, Suite 400',
    notes: 'Book a call or visit portfolio',
  },
  email: {
    email: 'contact@brand.com',
    subject: 'Inquiry from QR Scan',
    body: 'Hi, I saw your QR code and would like to learn more about your services.',
  },
  phone: '+15551234567',
  sms: {
    phone: '+15551234567',
    message: 'Hello! I scanned your QR code and would like more details.',
  },
  event: {
    title: 'Product Launch & Showcase',
    location: 'Design Center, Main Hall 4B',
    description: 'Join us for live demonstrations, keynote presentations, and networking.',
    startDate: '2026-09-15T18:00',
    endDate: '2026-09-15T21:00',
    allDay: false,
  },
  geo: {
    latitude: 37.7749,
    longitude: -122.4194,
    query: 'San Francisco Design District',
    provider: 'google',
  },
  crypto: {
    currency: 'BTC',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    amount: '0.005',
    memo: 'Design services invoice #1042',
  },
  social: {
    displayName: 'Studio Nova',
    bio: 'Digital design studio crafting branded vector experiences and interfaces.',
    avatarUrl: '',
    theme: 'gradient',
    links: [
      { id: '1', platform: 'website', label: 'Official Website', url: 'https://example.com' },
      { id: '2', platform: 'instagram', label: 'Instagram Portfolio', url: 'https://instagram.com' },
      { id: '3', platform: 'x', label: 'X (Twitter)', url: 'https://x.com' },
      { id: '4', platform: 'github', label: 'Open Source Repos', url: 'https://github.com' },
    ],
  },
  dynamic: {
    isDynamic: false,
    dynamicId: '',
    targetUrl: '',
    scanCount: 0,
  },
  colors: {
    foregroundType: 'linear',
    fgColor1: '#1e1b4b',
    fgColor2: '#4338ca',
    gradientAngle: 45,
    bgColor: '#ffffff',
    isTransparentBg: false,
    customEyeColors: true,
    eyeOuterColor: '#312e81',
    eyeInnerColor: '#4f46e5',
  },
  shapes: {
    dotType: 'rounded',
    cornerSquareType: 'extra-rounded',
    cornerDotType: 'dot',
  },
  logo: {
    sourceType: 'none',
    builtinId: 'globe',
    uploadedUrl: '',
    size: 0.22,
    margin: 4,
    bgShape: 'circle',
    bgColor: '#ffffff',
    hideBackgroundDots: true,
  },
  frame: {
    style: 'bottom-banner',
    title: 'SCAN ME',
    subtitle: 'Point your phone camera here',
    frameColor: '#1e1b4b',
    textColor: '#ffffff',
    badgeColor: '#4338ca',
  },
  errorCorrectionLevel: 'Q',
  expirationDate: null,
  expirationMessage: '',
};
