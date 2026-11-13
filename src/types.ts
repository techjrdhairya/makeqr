export type ContentType = 
  | 'url' 
  | 'file' 
  | 'text' 
  | 'wifi' 
  | 'vcard' 
  | 'email' 
  | 'phone' 
  | 'sms'
  | 'event'
  | 'geo'
  | 'crypto'
  | 'social'
  | 'quicklink';

import type { QuickLinkData } from './utils/quicklinks';
export type { QuickLinkData };

export interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  userId?: string;
  userEmail?: string;
  previewUrl?: string;
  encodeMode: 'link' | 'direct';
  customSlug?: string;
  title?: string;
  description?: string;
  transcript?: string;
  author?: string;
  honoree?: string;
  occasion?: string;
  isPublic?: boolean;
  expirationDate?: string | null;
  expirationMessage?: string;
  createdAt?: number;
  updatedAt?: number;
  serverSynced?: boolean;
  allowDownload?: boolean;
  hasPassword?: boolean;
}

export interface WifiData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface VCardData {
  prefix?: string;
  firstName: string;
  lastName: string;
  phone: string;
  workPhone?: string;
  email: string;
  workEmail?: string;
  company: string;
  department?: string;
  title: string;
  website: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  address: string;
  notes: string;
  socialLinkedIn?: string;
  socialTwitter?: string;
}

export interface EmailData {
  email: string;
  subject: string;
  body: string;
}

export interface SmsData {
  phone: string;
  message: string;
}

export interface EventData {
  title: string;
  location: string;
  description: string;
  startDate: string; // ISO or YYYY-MM-DDTHH:mm
  endDate: string;
  allDay: boolean;
}

export interface GeoData {
  latitude: number;
  longitude: number;
  query: string;
  provider: 'google' | 'apple' | 'geo';
}

export interface CryptoData {
  currency: 'BTC' | 'ETH' | 'SOL' | 'USDT';
  address: string;
  amount: string;
  memo: string;
}

export interface SocialLinkItem {
  id: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'x' | 'github' | 'website' | 'other';
  label: string;
  url: string;
}

export interface SocialData {
  displayName: string;
  bio: string;
  avatarUrl?: string;
  theme: 'dark' | 'glass' | 'minimal' | 'gradient';
  links: SocialLinkItem[];
}

export type DotType = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded';
export type CornerSquareType = 'square' | 'dot' | 'extra-rounded';
export type CornerDotType = 'square' | 'dot';

export type GradientType = 'none' | 'linear' | 'radial';

export interface ColorSettings {
  foregroundType: GradientType;
  fgColor1: string;
  fgColor2: string;
  gradientAngle: number;
  bgColor: string;
  isTransparentBg: boolean;
  customEyeColors: boolean;
  eyeOuterColor: string;
  eyeInnerColor: string;
}

export interface ShapeSettings {
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
}

export interface LogoSettings {
  sourceType: 'none' | 'builtin' | 'upload';
  builtinId: string;
  uploadedUrl: string;
  size: number; // 0.1 to 0.4
  margin: number; // 0 to 15
  bgShape: 'none' | 'circle' | 'square' | 'rounded';
  bgColor: string;
  hideBackgroundDots: boolean;
}

export type FrameStyle = 
  | 'none'
  | 'bottom-banner'
  | 'top-pill'
  | 'polaroid'
  | 'badge-tag'
  | 'minimal-border'
  | 'phone-frame'
  | 'stamp';

export interface FrameSettings {
  style: FrameStyle;
  title: string;
  subtitle: string;
  frameColor: string;
  textColor: string;
  badgeColor: string;
}

export interface DynamicQRInfo {
  isDynamic: boolean;
  dynamicId: string;
  customSlug?: string;
  targetUrl: string;
  scanCount?: number;
  lastScannedAt?: number;
  expirationDate?: string | null;
  expirationMessage?: string;
  /** Advanced link rules (enforced by the server) */
  rules?: LinkRules;
}

export interface LinkRules {
  iosUrl?: string;
  androidUrl?: string;
  maxScans?: number;
  activeFrom?: string;
  activeUntil?: string;
  hasPassword?: boolean;
}

export interface QRConfig {
  name?: string;
  contentType: ContentType;
  url: string;
  text: string;
  file?: FileData;
  wifi: WifiData;
  vcard: VCardData;
  email: EmailData;
  phone: string;
  sms: SmsData;
  event: EventData;
  geo: GeoData;
  crypto: CryptoData;
  social: SocialData;
  quicklink: QuickLinkData;
  dynamic: DynamicQRInfo;
  colors: ColorSettings;
  shapes: ShapeSettings;
  logo: LogoSettings;
  frame: FrameSettings;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  expirationDate?: string | null;
  expirationMessage?: string;
}

export interface SavedQR {
  id: string;
  name: string;
  createdAt: number;
  previewThumbnail: string;
  contentType: ContentType;
  summaryText: string;
  config: QRConfig;
  scanCount?: number;
  lastScannedAt?: number;
}

export interface QRScanLocation {
  city: string;
  country: string;
  countryCode: string;
  region?: string;
  count: number;
  latitude?: number;
  longitude?: number;
  lastScannedAt?: number;
}

export interface QRScanEvent {
  timestamp: number;
  city: string;
  country: string;
  countryCode?: string;
  device?: string;
  browser?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  referrer?: string;
}

export interface QRAnalyticsData {
  qrId: string;
  qrName: string;
  scanCount: number;
  uniqueVisitors?: number;
  byDay?: Record<string, number>;
  byHour?: number[];
  lastScannedAt: number | null;
  locations: QRScanLocation[];
  recentScans: QRScanEvent[];
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  createdAt?: number;
  updatedAt?: number;
}

export interface ScanVerificationResult {
  verified: boolean;
  decodedData?: string;
  latencyMs?: number;
  errorReason?: string;
}
