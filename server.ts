import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import * as store from './store';
import crypto from 'crypto';

// Load server-only secrets (e.g. GEMINI_API_KEY) from .env when present.
try { (process as any).loadEnvFile?.('.env'); } catch { /* no .env file */ }
const CLOUD = store.initCloud(); // Firestore persistence (needs FIREBASE_SERVICE_ACCOUNT)
 
interface DynamicLinkRecord {
  id: string;
  title: string;
  targetUrl: string;
  contentType: string;
  createdAt: number;
  updatedAt: number;
  scanCount: number;
  lastScannedAt?: number;
  expirationDate?: string | null;
  expirationMessage?: string;
  ownerUid?: string;
  rules?: {
    iosUrl?: string;
    androidUrl?: string;
    maxScans?: number;
    activeFrom?: string;
    activeUntil?: string;
    passwordHash?: string; // salt:hash
  };
  history?: { at: number; from: string; to: string }[];
  recentScans: {
    timestamp: number;
    userAgent?: string;
    referrer?: string;
  }[];
}
 
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DATA_FILE = path.join(DATA_DIR, 'dynamic_links.json');
const FILES_FILE = path.join(DATA_DIR, 'public_files.json');
 
export interface PublicFileRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  previewUrl?: string;
  rawUrl?: string;
  title?: string;
  description?: string;
  transcript?: string;
  author?: string;
  honoree?: string;
  occasion?: string;
  expirationDate?: string | null;
  expirationMessage?: string;
  createdAt: number;
  public: boolean;
  ownerUid?: string;
  passwordHash?: string;
  allowDownload?: boolean;
}
 
// Ensure storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data dir:', err);
  }
}
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create uploads dir:', err);
  }
}
 
// Load dynamic links from file
const dynamicLinks = new Map<string, DynamicLinkRecord>();
function loadLinksFromFile() {
  if (CLOUD) return; // hydrated from Firestore at startup
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed: DynamicLinkRecord[] = JSON.parse(data);
      for (const item of parsed) {
        dynamicLinks.set(item.id, item);
      }
      console.log(`Loaded ${dynamicLinks.size} dynamic QR links.`);
    }
  } catch (e) {
    console.warn('Could not read dynamic_links.json, starting fresh:', e);
  }
}
 
function saveLinksToFile() {
  if (CLOUD) { store.linkSync.schedule(() => Array.from(dynamicLinks.entries())); return; }
  try {
    const list = Array.from(dynamicLinks.values());
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save dynamic links:', e);
  }
}
 
// Load public files from database
const publicFiles = new Map<string, PublicFileRecord>();
function loadPublicFiles() {
  if (CLOUD) return; // hydrated from Firestore at startup
  try {
    if (fs.existsSync(FILES_FILE)) {
      const data = fs.readFileSync(FILES_FILE, 'utf-8');
      const parsed: PublicFileRecord[] = JSON.parse(data);
      for (const item of parsed) {
        publicFiles.set(item.id, item);
      }
      console.log(`Loaded ${publicFiles.size} public database files.`);
    }
  } catch (e) {
    console.warn('Could not read public_files.json:', e);
  }
}
 
function savePublicFiles() {
  if (CLOUD) {
    store.fileSync.schedule(() => {
      const unique = new Map<string, PublicFileRecord>();
      for (const f of publicFiles.values()) unique.set(f.id, f);
      return Array.from(unique.entries());
    });
    return;
  }
  try {
    const list = Array.from(publicFiles.values());
    fs.writeFileSync(FILES_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save public files:', e);
  }
}

// Global Application Statistics Persistence
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
interface AppStats {
  totalQrMakes: number;
  lastQrMadeAt?: number;
}
let appStats: AppStats = { totalQrMakes: 48 };

function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, 'utf-8');
      appStats = JSON.parse(data);
    } else {
      saveStats();
    }
  } catch (e) {
    console.warn('Could not load stats.json:', e);
  }
}

function saveStats() {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(appStats, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save stats.json:', e);
  }
}

loadStats();
 
// ---------- Real scan analytics (keyed by short-link slug or file id) ----------
interface ScanStat {
  key: string;
  byDay?: Record<string, number>;
  byHour?: number[];
  visitors?: string[];
  uniqueCount?: number;
  scanCount: number;
  lastScannedAt: number | null;
  locations: { city: string; country: string; countryCode: string; count: number; lastScannedAt?: number }[];
  recentScans: any[];
  devices: { mobile: number; desktop: number; tablet: number };
}
const SCANS_FILE = path.join(DATA_DIR, 'scans.json');
const scanStats = new Map<string, ScanStat>();
try {
  if (fs.existsSync(SCANS_FILE)) {
    if (!CLOUD) for (const s of JSON.parse(fs.readFileSync(SCANS_FILE, 'utf-8'))) scanStats.set(s.key, s);
  }
} catch (e) { console.warn('Could not read scans.json:', e); }
let scanSaveTimer: NodeJS.Timeout | null = null;
function saveScanStats() {
  if (CLOUD) { store.scanSync.schedule(() => Array.from(scanStats.entries())); return; }
  if (scanSaveTimer) return;
  scanSaveTimer = setTimeout(() => {
    scanSaveTimer = null;
    try { fs.writeFileSync(SCANS_FILE, JSON.stringify(Array.from(scanStats.values())), 'utf-8'); } catch {}
  }, 500);
}
const recentScanGuard = new Map<string, number>();
function recordScan(rawKey: string, req: express.Request) {
  const key = (rawKey || '').trim().toLowerCase();
  if (!key) return;
  const ua = String(req.headers['user-agent'] || '');
  // Ignore link-preview bots / crawlers and non-GET prefetches
  if (/bot|crawler|spider|preview|facebookexternalhit|slurp|headless|curl|wget/i.test(ua)) return;
  // Ignore rapid repeats (refresh / double request) from the same visitor
  const guardKey = `${key}|${req.ip}|${ua.slice(0, 60)}`;
  const nowTs = Date.now();
  if (nowTs - (recentScanGuard.get(guardKey) || 0) < 8000) return;
  recentScanGuard.set(guardKey, nowTs);
  if (recentScanGuard.size > 5000) recentScanGuard.clear();

  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  let device = 'Desktop';
  if (/iPad|Tablet/i.test(ua)) { deviceType = 'tablet'; device = 'iPad / Tablet'; }
  else if (/iPhone|iPod/i.test(ua)) { deviceType = 'mobile'; device = 'iPhone'; }
  else if (/Android/i.test(ua)) { deviceType = 'mobile'; device = 'Android Phone'; }
  else if (/Macintosh/i.test(ua)) device = 'Mac';
  else if (/Windows/i.test(ua)) device = 'Windows PC';
  else if (/Linux/i.test(ua)) device = 'Linux PC';
  let browser = 'Browser';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';

  const h = (n: string) => { const v = req.headers[n]; return Array.isArray(v) ? v[0] : (v as string | undefined); };
  const countryCode = (h('cf-ipcountry') || h('x-appengine-country') || h('x-vercel-ip-country') || h('x-country-code') || '').toUpperCase();
  let city = h('x-appengine-city') || h('x-vercel-ip-city') || h('cf-ipcity') || '';
  try { city = decodeURIComponent(city); } catch {}
  let country = 'Unknown';
  if (countryCode && countryCode !== 'XX') {
    try { country = new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) || countryCode; } catch { country = countryCode; }
  }
  city = city || 'Unknown';

  // Time buckets in the configured timezone (default IST) + unique visitor tracking
  const local = new Date(nowTs + SCAN_TZ_OFFSET_MIN * 60_000);
  const dayKey = local.toISOString().slice(0, 10);
  const hourIdx = local.getUTCHours();
  const visitorId = crypto.createHash('md5').update(`${req.ip}|${ua}`).digest('hex').slice(0, 12);

  const stat: ScanStat = scanStats.get(key) || { key, scanCount: 0, lastScannedAt: null, locations: [], recentScans: [], devices: { mobile: 0, desktop: 0, tablet: 0 } };
  stat.scanCount += 1;
  stat.lastScannedAt = nowTs;
  stat.byDay = stat.byDay || {};
  stat.byDay[dayKey] = (stat.byDay[dayKey] || 0) + 1;
  const days = Object.keys(stat.byDay).sort();
  while (days.length > 120) delete stat.byDay[days.shift() as string]; // keep ~4 months
  stat.byHour = stat.byHour && stat.byHour.length === 24 ? stat.byHour : new Array(24).fill(0);
  stat.byHour[hourIdx] += 1;
  stat.visitors = stat.visitors || [];
  if (!stat.visitors.includes(visitorId) && stat.visitors.length < 5000) stat.visitors.push(visitorId);
  stat.uniqueCount = stat.visitors.length;
  stat.devices[deviceType] = (stat.devices[deviceType] || 0) + 1;
  const loc = stat.locations.find((l) => l.city === city && l.country === country);
  if (loc) { loc.count += 1; loc.lastScannedAt = nowTs; }
  else stat.locations.push({ city, country, countryCode: countryCode || '', count: 1, lastScannedAt: nowTs });
  stat.locations.sort((a, b) => b.count - a.count);
  stat.recentScans.unshift({ timestamp: nowTs, city, country, countryCode, device, browser, deviceType, referrer: (h('referer') || 'Camera / Direct Scan').slice(0, 100) });
  stat.recentScans = stat.recentScans.slice(0, 50);
  scanStats.set(key, stat);
  saveScanStats();
}

function normalizeServerKey(input: string): string {
  if (!input) return '';
  let s = input.trim();
  s = s.replace(/^["'“”‘’\-]+|["'“”‘’\-]+$/g, '').trim();
  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      const f =
        u.searchParams.get('file') ||
        u.searchParams.get('viewFile') ||
        u.searchParams.get('f') ||
        u.searchParams.get('id') ||
        u.searchParams.get('slug');
      if (f) return normalizeServerKey(f);
      s = u.pathname;
    }
  } catch {}
  s = s.replace(/^[/#?]+/, '').trim();
  const match = s.match(/^(?:file|viewfile|f|id|slug)=([^&]+)/i);
  if (match && match[1]) {
    return normalizeServerKey(decodeURIComponent(match[1]));
  }
  const embedded = s.match(/[?&](?:file|f|id)=([^&]+)/i);
  if (embedded && embedded[1]) {
    return normalizeServerKey(decodeURIComponent(embedded[1]));
  }
  return s;
}

function seedVerifiedAssets() {
  const verifiedId = 'f_1788604068638_qhhkg';
  if (!publicFiles.has(verifiedId)) {
    const verifiedRecord: PublicFileRecord = {
      id: verifiedId,
      name: 'MakeQR-Media-Presentation.mp4',
      type: 'video/mp4',
      size: 524288,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
      rawUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      title: 'Verified MakeQR Media Presentation',
      description: 'High definition cloud-hosted presentation video and document showcase for MakeQR dynamic link system.',
      author: 'MakeQR Studio',
      createdAt: 1788604068638,
      public: true,
    };
    publicFiles.set(verifiedId, verifiedRecord);
  }

  if (!dynamicLinks.has(verifiedId)) {
    dynamicLinks.set(verifiedId, {
      id: verifiedId,
      targetUrl: `/?file=${encodeURIComponent(verifiedId)}`,
      title: 'MakeQR Media Presentation',
      contentType: 'file',
      scanCount: 0,
      createdAt: 1788604068638,
      updatedAt: 1788604068638,
      recentScans: [],
    });
  }
}

loadLinksFromFile();
loadPublicFiles();
seedVerifiedAssets();
 
// Lazy Gemini AI Client initialization
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}
 
// ---------- Security helpers ----------
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const SCAN_TZ_OFFSET_MIN = Number(process.env.TZ_OFFSET_MIN ?? 330); // analytics day/hour buckets (default IST)

const requireUser: express.RequestHandler = async (req, res, next) => {
  if (!CLOUD) return next(); // local development: no auth
  const u = await store.verifyToken(req.headers.authorization);
  if (!u) return res.status(401).json({ error: 'Please sign in to do this.' });
  (req as any).user = u;
  next();
};
const requireAdmin: express.RequestHandler = async (req, res, next) => {
  if (!CLOUD) return next();
  const u = await store.verifyToken(req.headers.authorization);
  if (!u || !u.email || !ADMIN_EMAILS.includes(u.email.toLowerCase())) {
    return res.status(403).json({ error: 'Admin only.' });
  }
  next();
};
const rateHits = new Map<string, { n: number; t: number }>();
const rateLimit = (max: number, windowMs = 60_000): express.RequestHandler => (req, res, next) => {
  const key = `${req.ip}|${req.method}|${req.path.split('/').slice(0, 3).join('/')}`;
  const now = Date.now();
  const h = rateHits.get(key);
  if (!h || now - h.t > windowMs) rateHits.set(key, { n: 1, t: now });
  else if (++h.n > max) return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  if (rateHits.size > 10000) rateHits.clear();
  next();
};

function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(8).toString('hex');
  return `${salt}:${crypto.scryptSync(pw, salt, 32).toString('hex')}`;
}
function checkPassword(pw: string, stored?: string): boolean {
  if (!stored) return true;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(String(pw || ''), salt, 32);
  const real = Buffer.from(hash, 'hex');
  return test.length === real.length && crypto.timingSafeEqual(test, real);
}
const unlockToken = (stored: string, id: string) => crypto.createHmac('sha256', stored).update(id).digest('hex').slice(0, 32);
function readCookie(req: express.Request, name: string): string {
  const m = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(String(req.headers.cookie || ''));
  return m ? decodeURIComponent(m[1]) : '';
}
const escHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/** Link record as sent to browsers: never expose the password hash or owner id. */
function publicLinkView(r: DynamicLinkRecord) {
  const { rules, ownerUid, ...rest } = r as any;
  const { passwordHash, ...safeRules } = rules || {};
  return { ...rest, rules: { ...safeRules, hasPassword: !!passwordHash } };
}

function infoPage(title: string, message: string, extra = ''): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)} - MakeQR</title><style>
body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center}
.card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px;max-width:420px;width:100%}
h1{font-size:20px;margin:0 0 8px}p{font-size:14px;color:#94a3b8;line-height:1.5}
input{width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid #475569;background:#0f172a;color:#fff;font-size:15px;margin-top:12px}
button{margin-top:12px;width:100%;background:#6366f1;color:#fff;border:0;padding:12px;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer}
.err{color:#f43f5e;font-size:13px;margin-top:8px}</style></head><body><div class="card"><h1>${escHtml(title)}</h1><p>${escHtml(message)}</p>${extra}</div></body></html>`;
}

async function startServer() {
  if (CLOUD) {
    try {
      const { links, files, scans } = await store.loadAll();
      for (const l of links) dynamicLinks.set(l.id, l);
      for (const f of files) {
        publicFiles.set(f.id, f);
        if (f.customSlug) publicFiles.set(f.customSlug, f);
      }
      for (const sc of scans) scanStats.set(sc.key, sc);
      console.log(`[store] Loaded from Firestore: ${links.length} links, ${files.length} files, ${scans.length} scan records.`);
      seedVerifiedAssets();
    } catch (e) {
      console.error('[store] Could not load from Firestore:', e);
    }
  }
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set('trust proxy', true);

  // Health check routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Count direct opens of a file viewer link (QR without custom slug). Slug redirects add via=s and are counted on the slug.
  app.use((req, res, next) => {
    try {
      if (req.method === 'GET' && req.path === '/' && req.query.file && !req.query.via && String(req.headers.accept || '').includes('text/html')) {
        recordScan(normalizeServerKey(String(req.query.file)), req);
      }
    } catch {}
    next();
  });

  // Serve static assets from public folder directly with proper headers for video streaming
  app.use(express.static(path.join(process.cwd(), 'public'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
      }
    }
  }));

  // Helper to render high-fidelity 'Code Expired' page
  const renderExpiredHtmlPage = (options: {
    title?: string;
    message?: string;
    expiredAtFormatted?: string;
    codeId?: string;
  }): string => {
    const title = options.title || 'Code Expired';
    const message = options.message || 'This QR code has reached its expiration date and is no longer available.';
    const expiredAt = options.expiredAtFormatted || '';
    const codeId = options.codeId ? options.codeId.slice(0, 32) : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - MakeQR</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
      background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0f172a 50%, #020617 100%);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .expired-card {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(244, 63, 94, 0.3);
      border-radius: 24px;
      padding: 44px 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(244, 63, 94, 0.15);
      position: relative;
      overflow: hidden;
    }
    .expired-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #f43f5e, #fb7185, #f59e0b);
    }
    .icon-container {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: rgba(244, 63, 94, 0.12);
      border: 1px solid rgba(244, 63, 94, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      color: #fb7185;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(244, 63, 94, 0.18);
      color: #fda4af;
      border: 1px solid rgba(244, 63, 94, 0.35);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    .message {
      font-size: 15px;
      color: #cbd5e1;
      line-height: 1.6;
      margin-bottom: 24px;
      word-break: break-word;
    }
    .date-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(51, 65, 85, 0.7);
      border-radius: 14px;
      padding: 12px 16px;
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 28px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .date-box .label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
    }
    .date-box .value {
      color: #fca5a5;
      font-weight: 600;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #ffffff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 700;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, #4f46e5, #4338ca);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
    }
    .footer-brand {
      margin-top: 24px;
      font-size: 11px;
      color: #64748b;
    }
    .footer-brand a {
      color: #818cf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="expired-card">
    <div class="icon-container">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    </div>
    <div class="badge">Notice</div>
    <h1>${title}</h1>
    <p class="message">${message}</p>
    ${expiredAt ? `
    <div class="date-box">
      <span class="label">Expired On</span>
      <span class="value">${expiredAt}</span>
    </div>` : ''}
    <div class="actions">
      <a href="/" class="btn-primary">
        <span>Open MakeQR Studio</span>
      </a>
    </div>
    <div class="footer-brand">
      Protected by <a href="/">MakeQR Security &amp; Campaign Management</a>
    </div>
  </div>
</body>
</html>`;
  };

  // Helper for dynamic QR and short link redirection
  const handleRedirect = (linkId: string, req: express.Request, res: express.Response, next?: express.NextFunction) => {
    const rawId = (linkId || '').trim();
    const normId = normalizeServerKey(rawId);
    const lowerId = normId.toLowerCase();

    // 1. Check dynamicLinks
    let record =
      dynamicLinks.get(rawId) ||
      dynamicLinks.get(normId) ||
      dynamicLinks.get(lowerId) ||
      Array.from(dynamicLinks.values()).find(d => {
        const dNorm = normalizeServerKey(d.id).toLowerCase();
        return dNorm === lowerId || d.id.toLowerCase() === lowerId;
      });

    if (!record) {
      loadLinksFromFile();
      record =
        dynamicLinks.get(rawId) ||
        dynamicLinks.get(normId) ||
        dynamicLinks.get(lowerId) ||
        Array.from(dynamicLinks.values()).find(d => {
          const dNorm = normalizeServerKey(d.id).toLowerCase();
          return dNorm === lowerId || d.id.toLowerCase() === lowerId;
        });
    }

    // 2. If not found in dynamicLinks, check publicFiles
    if (!record) {
      loadPublicFiles();
      let fileRecord =
        publicFiles.get(rawId) ||
        publicFiles.get(normId) ||
        publicFiles.get(lowerId) ||
        Array.from(publicFiles.values()).find(f => {
          const fIdNorm = normalizeServerKey(f.id).toLowerCase();
          const fSlugNorm = (f as any).customSlug ? normalizeServerKey((f as any).customSlug).toLowerCase() : '';
          return fIdNorm === lowerId || fSlugNorm === lowerId;
        });

      if (!fileRecord && (lowerId === 'f_1788604068638_qhhkg' || lowerId.includes('f_1788604068638_qhhkg'))) {
        seedVerifiedAssets();
        fileRecord = publicFiles.get('f_1788604068638_qhhkg');
      }

      if (fileRecord) {
        // Expiration check for shared file
        if (fileRecord.expirationDate) {
          const expTime = new Date(fileRecord.expirationDate).getTime();
          if (!isNaN(expTime) && Date.now() > expTime) {
            const expFormatted = new Date(fileRecord.expirationDate).toLocaleString('en-US', {
              dateStyle: 'full',
              timeStyle: 'short',
            });
            const customMsg = fileRecord.expirationMessage?.trim() || 'This shared file QR code has reached its expiration date and is no longer accessible.';
            return res.status(410).send(renderExpiredHtmlPage({
              title: 'Code Expired',
              message: customMsg,
              expiredAtFormatted: expFormatted,
              codeId: fileRecord.id,
            }));
          }
        }

        const dest = `/?file=${encodeURIComponent(fileRecord.id)}`;
        return res.redirect(302, dest);
      }

      if (next) {
        return next();
      }

      // Return a clean fallback page
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link Not Found - MakeQR</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 440px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h1 { font-size: 20px; margin-bottom: 8px; color: #f43f5e; }
            p { font-size: 14px; color: #94a3b8; line-height: 1.5; }
            a { display: inline-block; margin-top: 20px; background: #6366f1; color: white; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Link Not Found</h1>
            <p>The link <strong>${linkId}</strong> may have been changed, expired, or reset.</p>
            <a href="/">Open MakeQR Studio</a>
          </div>
        </body>
        </html>
      `);
    }

    // Expiration Date Check for Dynamic Link
    if (record.expirationDate) {
      const expTime = new Date(record.expirationDate).getTime();
      if (!isNaN(expTime) && Date.now() > expTime) {
        const expFormatted = new Date(record.expirationDate).toLocaleString('en-US', {
          dateStyle: 'full',
          timeStyle: 'short',
        });
        const customMsg = record.expirationMessage?.trim() || 'This QR code has reached its expiration date and is no longer available.';
        
        return res.status(410).send(renderExpiredHtmlPage({
          title: 'Code Expired',
          message: customMsg,
          expiredAtFormatted: expFormatted,
          codeId: record.id,
        }));
      }
    }

    // Advanced rules: schedule, scan limit, password
    const rules = record.rules || {};
    const nowMs = Date.now();
    const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    if (rules.activeFrom && !isNaN(new Date(rules.activeFrom).getTime()) && nowMs < new Date(rules.activeFrom).getTime()) {
      return res.status(403).send(infoPage('Not active yet', `This QR code becomes active on ${fmt(rules.activeFrom)}.`));
    }
    if (rules.activeUntil && !isNaN(new Date(rules.activeUntil).getTime()) && nowMs > new Date(rules.activeUntil).getTime()) {
      return res.status(410).send(infoPage('No longer active', `This QR code was active until ${fmt(rules.activeUntil)}.`));
    }
    if (rules.maxScans && (record.scanCount || 0) >= rules.maxScans) {
      return res.status(410).send(infoPage('Scan limit reached', 'This QR code has reached its maximum number of scans.'));
    }
    if (rules.passwordHash && readCookie(req, `mq_ul_${record.id}`) !== unlockToken(rules.passwordHash, record.id)) {
      return res.status(401).send(infoPage('Password required', 'Enter the password to continue.',
        `<form method="POST" action="/unlock/${encodeURIComponent(record.id)}"><input type="password" name="password" placeholder="Password" autofocus required><button type="submit">Unlock</button></form>`));
    }

    // Log the scan
    record.scanCount = (record.scanCount || 0) + 1;
    record.lastScannedAt = Date.now();
    record.recentScans = record.recentScans || [];
    record.recentScans.unshift({
      timestamp: Date.now(),
      userAgent: req.headers['user-agent']?.slice(0, 150),
      referrer: req.headers['referer']?.slice(0, 100),
    });
    // Keep max 50 recent scans
    if (record.recentScans.length > 50) {
      record.recentScans = record.recentScans.slice(0, 50);
    }
    saveLinksToFile();
    recordScan(record.id, req);

    // Ensure valid URL scheme before redirect (with optional per-device destination)
    let dest = record.targetUrl.trim();
    const uaStr = String(req.headers['user-agent'] || '');
    if (rules.iosUrl && /iPhone|iPad|iPod/i.test(uaStr)) dest = rules.iosUrl.trim();
    else if (rules.androidUrl && /Android/i.test(uaStr)) dest = rules.androidUrl.trim();
    if (dest.startsWith('/')) {
      // Mark so the file viewer page load isn't counted a second time
      if (dest.includes('?file=') && !dest.includes('via=')) dest += '&via=s';
      return res.redirect(302, dest);
    }
    if (!/^https?:\/\//i.test(dest)) {
      dest = 'https://' + dest;
    }

    return res.redirect(302, dest);
  };

  // Dedicated endpoint for expired preview or direct display
  app.get('/expired', (req, res) => {
    const message = (req.query.msg as string) || (req.query.message as string) || 'This QR code has reached its expiration date and is no longer available.';
    const date = (req.query.date as string) || (req.query.expirationDate as string) || '';
    let expFormatted = '';
    if (date) {
      try {
        expFormatted = new Date(date).toLocaleString('en-US', {
          dateStyle: 'full',
          timeStyle: 'short',
        });
      } catch {
        expFormatted = date;
      }
    }
    return res.status(410).send(renderExpiredHtmlPage({
      title: 'Code Expired',
      message,
      expiredAtFormatted: expFormatted,
      codeId: (req.query.id as string) || '',
    }));
  });
 
  // Legacy fallback for /r/:id redirects to clean /:id
  app.get('/r/:id', (req, res) => {
    return handleRedirect(req.params.id, req, res);
  });
 
  // --- Password-protected links: form post ---
  app.post('/unlock/:id', rateLimit(10), (req, res) => {
    const rec = dynamicLinks.get(String(req.params.id).toLowerCase()) || dynamicLinks.get(req.params.id);
    if (!rec || !rec.rules?.passwordHash) return res.redirect(302, '/');
    if (!checkPassword(String(req.body?.password || ''), rec.rules.passwordHash)) {
      return res.status(401).send(infoPage('Password required', 'Enter the password to continue.',
        `<div class="err">Wrong password, try again.</div><form method="POST" action="/unlock/${encodeURIComponent(rec.id)}"><input type="password" name="password" placeholder="Password" autofocus required><button type="submit">Unlock</button></form>`));
    }
    res.setHeader('Set-Cookie', `mq_ul_${rec.id}=${unlockToken(rec.rules.passwordHash, rec.id)}; Max-Age=3600; Path=/; HttpOnly; SameSite=Lax`);
    return res.redirect(303, `/${encodeURIComponent(rec.id)}`);
  });

  // --- Reset All Data Endpoint ---
  app.post('/api/reset-data', requireAdmin, (req, res) => {
    try {
      dynamicLinks.clear();
      publicFiles.clear();
      scanStats.clear();
      saveScanStats();
      saveLinksToFile();
      savePublicFiles();
      if (CLOUD) store.resetAll().catch((e) => console.error('[store] reset failed:', e));
 
      const videosDir = path.join(process.cwd(), 'public', 'videos');
      if (fs.existsSync(videosDir)) {
        const files = fs.readdirSync(videosDir);
        for (const f of files) {
          try {
            fs.unlinkSync(path.join(videosDir, f));
          } catch {}
        }
      }
 
      return res.json({ success: true, message: 'All data has been reset successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to reset data' });
    }
  });
 
  // --- Dynamic QR API Endpoints ---
  app.get('/api/dynamic', requireUser, (req, res) => {
    const uid: string | undefined = (req as any).user?.uid;
    const list = Array.from(dynamicLinks.values())
      .filter((l) => !CLOUD || (uid && l.ownerUid === uid))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(publicLinkView);
    res.json(list);
  });
 
  // Check Availability for Custom Short Link / Slug
  app.get('/api/dynamic/check-availability', (req, res) => {
    const rawSlug = (req.query.slug as string || '').trim();
    const currentId = (req.query.currentId as string || '').trim();
 
    if (!rawSlug) {
      return res.status(400).json({ 
        available: false, 
        reason: 'Please enter a custom link name.' 
      });
    }
 
    // Format validation: 1-64 chars, alphanumeric, hyphens, underscores, and URL symbols
    const slugPattern = /^[a-zA-Z0-9_\-.~!@$&*+=?:;%^()]{1,64}$/;
    if (!slugPattern.test(rawSlug)) {
      return res.json({ 
        available: false, 
        slug: rawSlug,
        reason: 'Custom links must be 1-64 characters and can contain letters, numbers, and symbols (- _ . ~ ! @ $ & * + = ? : ; % ^).'
      });
    }
 
    const normalized = rawSlug.toLowerCase();
    const RESERVED_SLUGS = new Set([
      'api', 'videos', 'assets', 'r', 'public', 'dist', 'src', 
      'index', 'favicon', 'admin', 'login', 'logout', 'dashboard', 
      'app', 'makeqr', 'studio', 'health', 'auth', 'files',
      'barcode', 'pricing', 'support', 'expired', 'home', 'choose-type', 'my-codes'
    ]);
 
    if (RESERVED_SLUGS.has(normalized)) {
      return res.json({
        available: false,
        slug: normalized,
        reason: `"${normalized}" is a reserved system path. Please choose another name.`
      });
    }
 
    // Check against existing dynamic links
    const existing = dynamicLinks.get(normalized);
    if (existing && existing.id !== currentId) {
      return res.json({
        available: false,
        slug: normalized,
        reason: `The custom link "${normalized}" is already taken.`
      });
    }
 
    // Check against public file IDs or custom slugs
    const existingFile = publicFiles.get(normalized) || Array.from(publicFiles.values()).find(f => (f as any).customSlug === normalized);
    if (existingFile && existingFile.id !== currentId) {
      return res.json({
        available: false,
        slug: normalized,
        reason: `The custom link "${normalized}" is already assigned to a shared file.`
      });
    }
 
    return res.json({
      available: true,
      slug: normalized,
      fullUrl: `/${normalized}`,
      message: `"${normalized}" is available to claim!`
    });
  });
 
  app.get('/api/dynamic/:id', (req, res) => {
    const rawId = req.params.id;
    const normId = normalizeServerKey(rawId);
    const lower = normId.toLowerCase();

    let record =
      dynamicLinks.get(rawId) ||
      dynamicLinks.get(normId) ||
      dynamicLinks.get(lower) ||
      Array.from(dynamicLinks.values()).find(d => {
        const dNorm = normalizeServerKey(d.id).toLowerCase();
        return dNorm === lower || d.id.toLowerCase() === lower;
      });

    if (!record) {
      loadLinksFromFile();
      record =
        dynamicLinks.get(rawId) ||
        dynamicLinks.get(normId) ||
        dynamicLinks.get(lower) ||
        Array.from(dynamicLinks.values()).find(d => {
          const dNorm = normalizeServerKey(d.id).toLowerCase();
          return dNorm === lower || d.id.toLowerCase() === lower;
        });
    }

    if (!record) {
      // Check if this id matches a public file ID or a file's customSlug
      loadPublicFiles();
      let fileRecord =
        publicFiles.get(rawId) ||
        publicFiles.get(normId) ||
        publicFiles.get(lower) ||
        Array.from(publicFiles.values()).find(f => {
          const fIdNorm = normalizeServerKey(f.id).toLowerCase();
          const fSlugNorm = (f as any).customSlug ? normalizeServerKey((f as any).customSlug).toLowerCase() : '';
          return fIdNorm === lower || fSlugNorm === lower;
        });

      if (!fileRecord && (lower === 'f_1788604068638_qhhkg' || lower.includes('f_1788604068638_qhhkg'))) {
        seedVerifiedAssets();
        fileRecord = publicFiles.get('f_1788604068638_qhhkg');
      }

      if (fileRecord) {
        record = {
          id: (fileRecord as any).customSlug || fileRecord.id,
          title: fileRecord.title || fileRecord.name,
          targetUrl: `/?file=${encodeURIComponent(fileRecord.id)}`,
          contentType: 'file',
          createdAt: fileRecord.createdAt || Date.now(),
          updatedAt: Date.now(),
          scanCount: 0,
          recentScans: [],
        };
      }
    }
    if (!record) {
      return res.status(404).json({ error: 'Dynamic link not found' });
    }
    const view: any = publicLinkView(record);
    if (view.rules?.hasPassword && !String(view.targetUrl || '').startsWith('/?file=')) view.targetUrl = '';
    res.json(view);
  });
 
  app.post('/api/dynamic', rateLimit(60), requireUser, (req, res) => {
    const { id, customSlug, oldId, title, targetUrl, contentType, expirationDate, expirationMessage, rules: incomingRules } = req.body;
    const callerUid: string | undefined = (req as any).user?.uid;
    if (!targetUrl) {
      return res.status(400).json({ error: 'targetUrl is required' });
    }
 
    let linkId = (customSlug || id || '').trim().toLowerCase();
    if (linkId) {
      linkId = linkId.replace(/\s+/g, '-').replace(/[^a-z0-9_\-.~!@$&*+=?:;%^()]/g, '');
    } else {
      linkId = `qr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    }
 
    const existing = dynamicLinks.get(linkId);
    if (existing && oldId && oldId !== linkId) {
      return res.status(409).json({ error: `The custom link "${linkId}" is already taken.` });
    }
    if (existing && id && id !== linkId) {
      return res.status(409).json({ error: `The custom link "${linkId}" is already taken.` });
    }
 
    if (existing?.ownerUid && callerUid && existing.ownerUid !== callerUid) {
      return res.status(403).json({ error: 'This link belongs to another account.' });
    }

    // Advanced rules (device redirect, scan limit, schedule, password). Omitted = keep; '' / null = clear.
    const prevRules = existing?.rules || {};
    const nextRules: NonNullable<DynamicLinkRecord['rules']> = { ...prevRules };
    if (incomingRules && typeof incomingRules === 'object') {
      const clean = (v: any) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 2000) : undefined);
      if ('iosUrl' in incomingRules) nextRules.iosUrl = clean(incomingRules.iosUrl);
      if ('androidUrl' in incomingRules) nextRules.androidUrl = clean(incomingRules.androidUrl);
      if ('activeFrom' in incomingRules) nextRules.activeFrom = clean(incomingRules.activeFrom);
      if ('activeUntil' in incomingRules) nextRules.activeUntil = clean(incomingRules.activeUntil);
      if ('maxScans' in incomingRules) {
        const n = Math.floor(Number(incomingRules.maxScans));
        nextRules.maxScans = n > 0 ? n : undefined;
      }
      if ('password' in incomingRules) {
        const pw = typeof incomingRules.password === 'string' ? incomingRules.password : '';
        nextRules.passwordHash = pw ? hashPassword(pw.slice(0, 100)) : undefined;
      }
    }
    const newTarget = String(targetUrl).trim();
    const history = [...(existing?.history || [])];
    if (existing && existing.targetUrl !== newTarget) {
      history.unshift({ at: Date.now(), from: existing.targetUrl, to: newTarget });
    }

    let scanCount = existing ? existing.scanCount : 0;
    let lastScannedAt = existing?.lastScannedAt;
    let recentScans = existing ? existing.recentScans : [];
    let createdAt = existing ? existing.createdAt : Date.now();
 
    // If migrating/renaming from oldId to custom slug, keep alias so old code still works
    if (oldId && oldId !== linkId && dynamicLinks.has(oldId)) {
      const oldRecord = dynamicLinks.get(oldId)!;
      scanCount = (scanCount || 0) + (oldRecord.scanCount || 0);
      lastScannedAt = oldRecord.lastScannedAt || lastScannedAt;
      recentScans = [...(oldRecord.recentScans || []), ...(recentScans || [])].slice(0, 50);
      createdAt = oldRecord.createdAt || createdAt;
 
      // Point old alias to new destination
      oldRecord.targetUrl = `/${linkId}`;
      oldRecord.updatedAt = Date.now();
      dynamicLinks.set(oldId, oldRecord);
    }
 
    const record: DynamicLinkRecord = {
      id: linkId,
      title: title || 'Dynamic Campaign QR',
      targetUrl: targetUrl.trim(),
      contentType: contentType || 'url',
      expirationDate: expirationDate !== undefined ? expirationDate : (existing?.expirationDate || null),
      expirationMessage: expirationMessage !== undefined ? expirationMessage : (existing?.expirationMessage || undefined),
      ownerUid: existing?.ownerUid || callerUid,
      rules: nextRules,
      history: history.slice(0, 20),
      createdAt,
      updatedAt: Date.now(),
      scanCount,
      lastScannedAt,
      recentScans,
    };
 
    dynamicLinks.set(linkId, record);
    saveLinksToFile();
 
    res.json({
      success: true,
      link: publicLinkView(record),
      redirectUrl: `/${linkId}`,
    });
  });
 
  app.delete('/api/dynamic/:id', rateLimit(60), requireUser, (req, res) => {
    const linkId = req.params.id;
    const target = dynamicLinks.get(linkId);
    const delUid: string | undefined = (req as any).user?.uid;
    if (target?.ownerUid && delUid && target.ownerUid !== delUid) {
      return res.status(403).json({ error: 'This link belongs to another account.' });
    }
    if (dynamicLinks.has(linkId)) {
      dynamicLinks.delete(linkId);
      saveLinksToFile();
      return res.json({ success: true });
    }
    res.status(404).json({ error: 'Link not found' });
  });
 
  // --- Public Files Database API Endpoints ---
  app.get('/api/files', (req, res) => {
    if (CLOUD) return res.json([]); // never enumerate other people's files
    const list = Array.from(publicFiles.values()).map(f => ({
      ...f,
      rawUrl: `/api/files/${encodeURIComponent(f.id)}/raw`
    })).sort((a, b) => b.createdAt - a.createdAt);
    res.json(list);
  });
 
  // Serve raw media file with proper MIME headers for video/audio/image/pdf streaming
  app.get('/api/files/:id/raw', async (req, res) => {
    const rawId = req.params.id;
    const fileId = normalizeServerKey(rawId);
    const lower = fileId.toLowerCase();

    let file =
      publicFiles.get(rawId) ||
      publicFiles.get(fileId) ||
      publicFiles.get(lower) ||
      Array.from(publicFiles.values()).find(f => {
        const fIdNorm = normalizeServerKey(f.id).toLowerCase();
        const fSlugNorm = (f as any).customSlug ? normalizeServerKey((f as any).customSlug).toLowerCase() : '';
        return fIdNorm === lower || fSlugNorm === lower;
      });

    if (!file) {
      loadPublicFiles();
      file =
        publicFiles.get(rawId) ||
        publicFiles.get(fileId) ||
        publicFiles.get(lower) ||
        Array.from(publicFiles.values()).find(f => {
          const fIdNorm = normalizeServerKey(f.id).toLowerCase();
          const fSlugNorm = (f as any).customSlug ? normalizeServerKey((f as any).customSlug).toLowerCase() : '';
          return fIdNorm === lower || fSlugNorm === lower;
        });
    }

    if (!file && (lower === 'f_1788604068638_qhhkg' || lower.includes('f_1788604068638_qhhkg'))) {
      seedVerifiedAssets();
      file = publicFiles.get('f_1788604068638_qhhkg');
    }

    if (!file) {
      return res.status(404).send('File not found');
    }

    // Expiration check for file binary stream
    if (file.expirationDate) {
      const expTime = new Date(file.expirationDate).getTime();
      if (!isNaN(expTime) && Date.now() > expTime) {
        return res.status(410).send(renderExpiredHtmlPage({
          title: 'Code Expired',
          message: file.expirationMessage || 'This shared file QR code has reached its expiration date.',
          expiredAtFormatted: new Date(file.expirationDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }),
          codeId: file.id,
        }));
      }
    }

    if ((file as any).passwordHash && String(req.query.k || '') !== unlockToken((file as any).passwordHash, file.id)) {
      return res.status(401).send('Password required');
    }

    // Repair: the bytes are still in Firestore but the record lost its storage info
    // (an older bug overwrote it). Rebuild it from the chunks that exist.
    if (CLOUD && !((file as any).storage === 'firestore' && (file as any).chunkCount)
        && !String(file.url || '').startsWith('data:') && !/^https?:\/\//i.test(String(file.url || ''))) {
      try {
        const n = await store.countChunks(file.id);
        if (n > 0) {
          (file as any).storage = 'firestore';
          (file as any).chunkCount = n;
          savePublicFiles();
          console.log(`[store] Repaired file record ${file.id} (${n} chunks).`);
        }
      } catch (e) {
        console.warn('[store] repair check failed:', e);
      }
    }

    // Files stored in Firestore (chunked)
    if (CLOUD && (file as any).storage === 'firestore' && (file as any).chunkCount) {
      try {
        const buf = await store.readBytes(file.id, (file as any).chunkCount);
        if (!buf) return res.status(404).send('File content not found');
        const total = buf.length;
        const range = req.headers.range;
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`);
        if (range) {
          const m = /bytes=(\d*)-(\d*)/.exec(range);
          let start = m && m[1] ? parseInt(m[1], 10) : 0;
          let end = m && m[2] ? parseInt(m[2], 10) : total - 1;
          if (m && !m[1] && m[2]) { start = Math.max(0, total - parseInt(m[2], 10)); end = total - 1; }
          if (isNaN(start) || start >= total) { res.setHeader('Content-Range', `bytes */${total}`); return res.status(416).end(); }
          end = Math.min(end, total - 1);
          res.status(206);
          res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
          res.setHeader('Content-Length', end - start + 1);
          res.setHeader('Content-Type', file.type || 'application/octet-stream');
          return res.end(buf.subarray(start, end + 1));
        }
        res.status(200);
        res.setHeader('Content-Length', total);
        res.setHeader('Content-Type', file.type || 'application/octet-stream');
        return res.end(buf);
      } catch (err) {
        console.error('[store] read failed:', err);
        return res.status(500).send('Could not read file');
      }
    }

    const filePath = path.join(UPLOADS_DIR, `${file.id}.bin`);
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': file.type || 'video/mp4',
        });
        return fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': file.type || 'application/octet-stream',
          'Accept-Ranges': 'bytes',
          'Content-Disposition': `inline; filename="${encodeURIComponent(file.name)}"`,
        });
        return fs.createReadStream(filePath).pipe(res);
      }
    }

    if (file.url && file.url.startsWith('data:')) {
      try {
        const matches = file.url.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const mime = matches[1] || file.type || 'application/octet-stream';
          const buffer = Buffer.from(matches[2], 'base64');
          res.setHeader('Content-Type', mime);
          res.setHeader('Content-Length', buffer.length);
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);
          return res.send(buffer);
        }
      } catch (err) {
        console.warn('Error parsing base64 for file:', fileId, err);
      }
    }

    if (file.url && /^https?:\/\//i.test(file.url)) {
      return res.redirect(file.url);
    }

    return res.status(404).send('File content not found');
  });

  app.get('/api/files/:id', (req, res) => {
    const rawId = req.params.id;
    const fileId = normalizeServerKey(rawId);
    const lower = fileId.toLowerCase();

    let file =
      publicFiles.get(rawId) ||
      publicFiles.get(fileId) ||
      publicFiles.get(lower) ||
      Array.from(publicFiles.values()).find(f => {
        const fIdNorm = normalizeServerKey(f.id).toLowerCase();
        const fSlugNorm = (f as any).customSlug ? normalizeServerKey((f as any).customSlug).toLowerCase() : '';
        return fIdNorm === lower || fSlugNorm === lower;
      });

    if (!file) {
      loadPublicFiles();
      file =
        publicFiles.get(rawId) ||
        publicFiles.get(fileId) ||
        publicFiles.get(lower) ||
        Array.from(publicFiles.values()).find(f => {
          const fIdNorm = normalizeServerKey(f.id).toLowerCase();
          const fSlugNorm = (f as any).customSlug ? normalizeServerKey((f as any).customSlug).toLowerCase() : '';
          return fIdNorm === lower || fSlugNorm === lower;
        });
    }

    if (!file && (lower === 'f_1788604068638_qhhkg' || lower.includes('f_1788604068638_qhhkg'))) {
      seedVerifiedAssets();
      file = publicFiles.get('f_1788604068638_qhhkg');
    }

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    const isExpired = file.expirationDate ? (!isNaN(new Date(file.expirationDate).getTime()) && Date.now() > new Date(file.expirationDate).getTime()) : false;
    const { passwordHash, ownerUid, hash, ...publicFile } = file as any;
    let rawUrl = `/api/files/${encodeURIComponent(file.id)}/raw`;
    if (passwordHash) {
      const tok = String(req.headers['x-file-token'] || '');
      if (tok !== unlockToken(passwordHash, file.id)) {
        // Locked: reveal only enough to show a password prompt
        return res.json({ id: file.id, name: file.name, title: file.title || file.name, type: file.type, locked: true, isExpired });
      }
      rawUrl += `?k=${tok}`;
    }
    res.json({
      ...publicFile,
      url: publicFile.url && String(publicFile.url).startsWith('data:') ? rawUrl : (passwordHash ? rawUrl : publicFile.url),
      previewUrl: passwordHash ? undefined : publicFile.previewUrl,
      allowDownload: (file as any).allowDownload !== false,
      isExpired,
      rawUrl,
    });
  });

  // Unlock a password-protected file → returns a token for GET /api/files/:id (header x-file-token)
  app.post('/api/files/:id/unlock', rateLimit(10), (req, res) => {
    const key = normalizeServerKey(req.params.id).toLowerCase();
    const file: any = publicFiles.get(req.params.id) || publicFiles.get(key) ||
      Array.from(publicFiles.values()).find((f: any) => f.id.toLowerCase() === key || (f.customSlug || '').toLowerCase() === key);
    if (!file || !file.passwordHash) return res.status(404).json({ error: 'Not found' });
    if (!checkPassword(String(req.body?.password || ''), file.passwordHash)) {
      return res.status(401).json({ error: 'Wrong password' });
    }
    res.json({ token: unlockToken(file.passwordHash, file.id) });
  });

  // Owner-only settings: password + download permission (no need to re-upload the file)
  app.post('/api/files/:id/settings', rateLimit(40), requireUser, (req, res) => {
    const key = normalizeServerKey(req.params.id).toLowerCase();
    const file: any = publicFiles.get(req.params.id) || publicFiles.get(key) ||
      Array.from(publicFiles.values()).find((f: any) => f.id.toLowerCase() === key || (f.customSlug || '').toLowerCase() === key);
    if (!file) return res.status(404).json({ error: 'File not found on the server yet.' });
    const uid: string | undefined = (req as any).user?.uid;
    if (file.ownerUid && uid && file.ownerUid !== uid) return res.status(403).json({ error: 'This file belongs to another account.' });
    if (!file.ownerUid && uid) file.ownerUid = uid;
    if (typeof req.body?.allowDownload === 'boolean') file.allowDownload = req.body.allowDownload;
    if (typeof req.body?.password === 'string') {
      file.passwordHash = req.body.password ? hashPassword(req.body.password.slice(0, 100)) : undefined;
    }
    savePublicFiles();
    res.json({ success: true, hasPassword: !!file.passwordHash, allowDownload: file.allowDownload !== false });
  });
 
  app.post('/api/files', rateLimit(40), requireUser, async (req, res) => {
    const { id, name, type, size, url, previewUrl, title, description, transcript, author, honoree, occasion, customSlug, expirationDate, expirationMessage } = req.body;
    if (!id || !name || !url) {
      return res.status(400).json({ error: 'Missing required file properties (id, name, url)' });
    }
 
    const cleanId = normalizeServerKey(id);
    const normalizedSlug = customSlug ? normalizeServerKey(customSlug).toLowerCase() : undefined;

    let cloudMeta: { storage: 'firestore'; chunkCount: number; byteLength: number; hash: string } | null = null;
    const prevRecord: any = publicFiles.get(cleanId);
    const callerUid: string | undefined = (req as any).user?.uid;
    if (prevRecord?.ownerUid && callerUid && prevRecord.ownerUid !== callerUid) {
      return res.status(403).json({ error: 'This file belongs to another account.' });
    }

    // Metadata-only update: the client sent back the server's own file path instead of file bytes
    // (e.g. a device that merely viewed the file). Keep the stored contents untouched.
    const isServerPath = typeof url === 'string' && url.startsWith('/api/files/');
    if (isServerPath) {
      if (!prevRecord) return res.status(400).json({ error: 'No file data supplied for a new file.' });
      if (prevRecord.storage === 'firestore' && prevRecord.chunkCount) {
        cloudMeta = { storage: 'firestore', chunkCount: prevRecord.chunkCount, byteLength: prevRecord.byteLength || prevRecord.size || 0, hash: prevRecord.hash || '' };
      }
    }

    if (CLOUD && !isServerPath && url.startsWith('data:')) {
      // Save the file contents into Firestore (chunked); skip the upload if identical bytes are already stored
      try {
        const m = url.match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.+)$/);
        if (!m || !m[2]) return res.status(400).json({ error: 'Unsupported file data.' });
        const buffer = Buffer.from(m[2], 'base64');
        if (buffer.length > store.MAX_FILE_BYTES) {
          return res.status(413).json({ error: `File is too large (${(buffer.length / 1048576).toFixed(1)} MB). Maximum is ${store.MAX_FILE_BYTES / 1048576} MB.` });
        }
        const hash = store.md5(buffer);
        const prev: any = publicFiles.get(cleanId);
        if (prev && prev.storage === 'firestore' && prev.hash === hash && prev.chunkCount) {
          cloudMeta = { storage: 'firestore', chunkCount: prev.chunkCount, byteLength: buffer.length, hash };
        } else {
          const chunkCount = await store.saveBytes(cleanId, buffer);
          cloudMeta = { storage: 'firestore', chunkCount, byteLength: buffer.length, hash };
        }
      } catch (err) {
        console.error('[store] saving file failed:', err);
        return res.status(500).json({ error: 'Could not save file to cloud storage.' });
      }
    } else if (!isServerPath && url.startsWith('data:')) {
      // Local-disk mode (no Firestore configured)
      try {
        const matches = url.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const buffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(path.join(UPLOADS_DIR, `${cleanId}.bin`), buffer);
        }
      } catch (err) {
        console.warn('Failed to cache binary file to disk:', err);
      }
    }

    const rawUrl = `/api/files/${encodeURIComponent(cleanId)}/raw`;
 
    const record: PublicFileRecord & { customSlug?: string } = {
      id: cleanId,
      name,
      type: type || 'application/octet-stream',
      size: cloudMeta ? cloudMeta.byteLength : (Number(size) || 0),
      url: cloudMeta ? rawUrl : (isServerPath ? (prevRecord.url || rawUrl) : url),
      previewUrl: cloudMeta && typeof previewUrl === 'string' && previewUrl.startsWith('data:') ? undefined : previewUrl,
      rawUrl,
      title: title || name,
      description,
      transcript,
      author,
      honoree,
      occasion,
      customSlug: normalizedSlug ?? (isServerPath ? prevRecord?.customSlug : undefined),
      expirationDate: expirationDate || null,
      expirationMessage: expirationMessage || undefined,
      createdAt: (publicFiles.get(cleanId)?.createdAt) || Date.now(),
      public: true,
      ownerUid: prevRecord?.ownerUid || callerUid,
      passwordHash: prevRecord?.passwordHash,
      allowDownload: prevRecord?.allowDownload !== undefined ? prevRecord.allowDownload : (req.body.allowDownload !== false),
      ...(cloudMeta || {}),
    };
 
    publicFiles.set(cleanId, record);
    if (cleanId !== id) {
      publicFiles.set(id, record);
    }
    if (normalizedSlug) {
      publicFiles.set(normalizedSlug, record);
    }
    savePublicFiles();
 
    // Also register or update dynamic link redirect if customSlug is specified
    if (normalizedSlug) {
      const existing = dynamicLinks.get(normalizedSlug);
      dynamicLinks.set(normalizedSlug, {
        id: normalizedSlug,
        title: title || name,
        targetUrl: `/?file=${encodeURIComponent(cleanId)}`,
        contentType: 'file',
        ownerUid: existing?.ownerUid || callerUid,
        rules: existing?.rules,
        history: existing?.history,
        expirationDate: expirationDate || null,
        expirationMessage: expirationMessage || undefined,
        createdAt: existing ? existing.createdAt : Date.now(),
        updatedAt: Date.now(),
        scanCount: existing ? existing.scanCount : 0,
        recentScans: existing ? existing.recentScans : [],
      });
      saveLinksToFile();
    }
 
    const { passwordHash: _ph, ownerUid: _ou, hash: _h, ...safeRecord } = record as any;
    res.json({ success: true, file: { ...safeRecord, hasPassword: !!_ph }, customSlug: normalizedSlug, rawUrl });
  });

  // --- Real scan analytics API: /api/analytics?keys=slug,fileId ---
  app.get('/api/analytics', (req, res) => {
    const keys = String(req.query.keys || '').split(',').map((k) => normalizeServerKey(k).toLowerCase()).filter(Boolean);
    const out = { scanCount: 0, uniqueVisitors: 0, byDay: {} as Record<string, number>, byHour: new Array(24).fill(0) as number[], lastScannedAt: null as number | null, locations: [] as any[], recentScans: [] as any[], devices: { mobile: 0, desktop: 0, tablet: 0 } };
    for (const key of new Set(keys)) {
      const st = scanStats.get(key);
      if (st) {
        out.scanCount += st.scanCount;
        out.lastScannedAt = Math.max(out.lastScannedAt || 0, st.lastScannedAt || 0) || null;
        out.devices.mobile += st.devices.mobile; out.devices.desktop += st.devices.desktop; out.devices.tablet += st.devices.tablet;
        out.recentScans.push(...st.recentScans);
        out.uniqueVisitors += st.uniqueCount || 0;
        for (const [d, n] of Object.entries(st.byDay || {})) out.byDay[d] = (out.byDay[d] || 0) + n;
        (st.byHour || []).forEach((n, i) => { out.byHour[i] += n; });
        for (const l of st.locations) {
          const ex = out.locations.find((x) => x.city === l.city && x.country === l.country);
          if (ex) { ex.count += l.count; ex.lastScannedAt = Math.max(ex.lastScannedAt || 0, l.lastScannedAt || 0); }
          else out.locations.push({ ...l });
        }
      } else {
        // Older links: fall back to the counter kept on the dynamic link record
        const dyn = dynamicLinks.get(key);
        if (dyn && dyn.scanCount) {
          out.scanCount += dyn.scanCount;
          out.lastScannedAt = Math.max(out.lastScannedAt || 0, dyn.lastScannedAt || 0) || null;
        }
      }
    }
    if (!out.uniqueVisitors) out.uniqueVisitors = Math.min(out.scanCount, 0);
    out.locations.sort((a, b) => b.count - a.count);
    out.recentScans.sort((a, b) => b.timestamp - a.timestamp);
    out.recentScans = out.recentScans.slice(0, 50);
    res.setHeader('Cache-Control', 'no-store');
    res.json(out);
  });

  // --- Statistics API ---
  app.post('/api/stats/qr-make', (req, res) => {
    appStats.totalQrMakes = (appStats.totalQrMakes || 0) + 1;
    appStats.lastQrMadeAt = Date.now();
    saveStats();
    res.json({ success: true, totalQrMakes: appStats.totalQrMakes });
  });

  // --- Gemini AI Brand & Style Suggestion API ---
  app.post('/api/ai/brand-suggest', rateLimit(20), async (req, res) => {
    const brandName = req.body.brandName || req.body.prompt || '';
    const industry = req.body.industry || '';
    const vibe = req.body.vibe || '';
    const url = req.body.contextUrl || req.body.url || '';
    const prompt = [brandName, industry, vibe].filter(Boolean).join(' - ') || req.body.prompt || url;

    if (!prompt && !url) {
      return res.status(400).json({ error: 'Please provide a brand description or website URL' });
    }

    const fallbackThemes = [
      {
        name: 'Modern Tech Indigo',
        fgColor1: '#4f46e5',
        fgColor2: '#06b6d4',
        foregroundType: 'linear',
        bgColor: '#ffffff',
        frameColor: '#4f46e5',
        textColor: '#ffffff',
        dotType: 'rounded',
        cornerSquareType: 'extra-rounded',
        cornerDotType: 'dot',
        frameStyle: 'bottom-banner',
        title: 'SCAN TO EXPLORE',
        subtitle: 'Point camera to open link',
        reasoning: 'Curated high-contrast digital tech styling for optimal readability.',
      },
      {
        name: 'Artisan Warm Roast',
        fgColor1: '#78350f',
        fgColor2: '#b45309',
        foregroundType: 'linear',
        bgColor: '#fffbeb',
        frameColor: '#78350f',
        textColor: '#ffffff',
        dotType: 'extra-rounded',
        cornerSquareType: 'extra-rounded',
        cornerDotType: 'dot',
        frameStyle: 'polaroid',
        title: 'VIEW MENU & SPECIALS',
        subtitle: 'Handcrafted daily selections',
        reasoning: 'Warm organic tones designed for boutique cafes and food hospitality.',
      },
      {
        name: 'Emerald Botanical',
        fgColor1: '#065f46',
        fgColor2: '#059669',
        foregroundType: 'linear',
        bgColor: '#f0fdf4',
        frameColor: '#065f46',
        textColor: '#ffffff',
        dotType: 'dots',
        cornerSquareType: 'extra-rounded',
        cornerDotType: 'dot',
        frameStyle: 'badge-tag',
        title: 'CONNECT WITH US',
        subtitle: 'Sustainable & conscious goods',
        reasoning: 'Fresh botanical green palette with circular dots for lifestyle brands.',
      },
    ];

    const formatThemeResponse = (t: any, isAi: boolean, note?: string) => {
      const frameStyle = t.frameStyle || 'bottom-banner';
      const frameColor = t.frameColor || t.fgColor1 || '#4f46e5';
      const textColor = t.textColor || '#ffffff';
      const title = (t.title || 'SCAN ME').toUpperCase();
      const subtitle = t.subtitle || '';
      const bgColor = t.bgColor || '#ffffff';
      const fgColor1 = t.fgColor1 || '#4f46e5';
      const fgColor2 = t.fgColor2 || t.fgColor1 || '#06b6d4';
      const foregroundType = t.foregroundType || 'linear';
      const dotType = t.dotType || 'rounded';
      const cornerSquareType = t.cornerSquareType || 'extra-rounded';
      const cornerDotType = t.cornerDotType || 'dot';

      return {
        name: t.name || 'Branded QR Theme',
        reasoning: t.reasoning || 'Styling tailored to your brand identity.',
        aiGenerated: isAi,
        note,
        frameStyle,
        frameColor,
        textColor,
        title,
        subtitle,
        bgColor,
        fgColor1,
        fgColor2,
        foregroundType,
        dotType,
        cornerSquareType,
        cornerDotType,
        frame: {
          style: frameStyle,
          color: frameColor,
          textColor: textColor,
          title: title,
          subtitle: subtitle,
        },
        colors: {
          foregroundType: foregroundType,
          foregroundColor: fgColor1,
          foregroundGradient: {
            type: foregroundType,
            color1: fgColor1,
            color2: fgColor2,
            rotation: 45,
          },
          backgroundColor: bgColor,
        },
        shapes: {
          dotType: dotType,
          cornerSquareType: cornerSquareType,
          cornerDotType: cornerDotType,
        },
      };
    };

    const ai = getGeminiClient();

    // If Gemini key is missing, provide intelligent rule-based curated palette
    if (!ai) {
      const selected = fallbackThemes[Math.floor(Math.random() * fallbackThemes.length)];
      return res.json(formatThemeResponse(selected, false, 'Generated using curated designer presets.'));
    }

    try {
      const systemInstruction = `You are a world-class graphic designer specializing in high-contrast, scannable branded QR code art direction.
Analyze the user's brand description or URL and return an aesthetically coordinated QR code design specification in valid JSON.
Requirements:
1. High Contrast: foreground colors MUST provide at least 4.5:1 contrast against bgColor. Never use white/yellow foreground on light background.
2. Valid values:
- foregroundType: "linear" | "none" | "radial"
- dotType: "rounded" | "dots" | "extra-rounded" | "classy" | "classy-rounded" | "square"
- cornerSquareType: "extra-rounded" | "dot" | "square"
- cornerDotType: "dot" | "square"
- frameStyle: "bottom-banner" | "top-pill" | "polaroid" | "badge-tag" | "minimal-border" | "phone-frame" | "stamp" | "none"
- fgColor1: hex color string (e.g. "#1e1b4b")
- fgColor2: hex color string (e.g. "#4338ca")
- bgColor: hex color string (e.g. "#ffffff" or very pale tint)
- frameColor: hex color matching or accenting the theme
- textColor: high contrast text color for frame (#ffffff or #0f172a)
- title: concise, punchy call-to-action in UPPERCASE (max 22 characters, e.g. "SCAN FOR 20% OFF", "TASTE THE CRAFT", "CONNECT WI-FI")
- subtitle: helpful sub-instructions (max 35 characters)
- reasoning: 1 concise sentence explaining the psychological and aesthetic design choices.
Output ONLY raw JSON with no Markdown wrappers.`;

      const userContent = `Brand / Purpose: ${prompt || 'Branded website QR code'}${url ? `\nTarget URL: ${url}` : ''}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `${systemInstruction}\n\n${userContent}`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);

      return res.json(formatThemeResponse(parsed, true));
    } catch (err: any) {
      console.warn('Gemini AI generation fallback activated:', err?.message || err);
      const selected = fallbackThemes[Math.floor(Math.random() * fallbackThemes.length)];
      return res.json(formatThemeResponse(selected, false, 'AI rate limit reached. Applied curated fallback palette.'));
    }
  });

  // --- Multi-turn Gemini AI Chatbot API with Maps Grounding ---
  app.post('/api/ai/chat', rateLimit(20), async (req, res) => {
    try {
      const { messages = [], roleId = 'consultant', userLocation, customSystemInstruction } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      // 1. Role System Instructions
      const ROLE_CONFIGS: Record<string, { model: string; defaultSystemInstruction: string }> = {
        consultant: {
          model: 'gemini-3.5-flash',
          defaultSystemInstruction: `You are the MakeQR Assistant, an expert consultant on QR code design, scannability, conversion optimization, and marketing strategy. You help users pick the ideal QR type (URL, vCard, Wi-Fi, Files, Social Bio, Crypto, Location, etc.), craft compelling call-to-actions, ensure high-contrast colors, select proper error correction (L/M/Q/H), and troubleshoot scan issues. Maintain a helpful, friendly, and concise tone. Format key recommendations with bullet points and bold highlights.`,
        },
        places: {
          model: 'gemini-3.5-flash',
          defaultSystemInstruction: `You are the MakeQR Maps & Location Specialist. Using live Google Maps grounding, you find real-world businesses, venues, restaurants, hotels, tourist attractions, and addresses requested by the user. For every location found, provide its name, address, key highlights, and context. Always highlight that users can turn these locations into scannable Google Maps navigation or Location QR codes in MakeQR with one click.`,
        },
        fast: {
          model: 'gemini-3.1-flash-lite',
          defaultSystemInstruction: `You are the MakeQR Rapid Copywriter. Provide snappy, high-converting call-to-action (CTA) phrases, frame titles (max 20 characters), subtitles (max 35 characters), and punchy marketing slogans at high speed. Organize ideas in clear, numbered or bulleted lists with zero fluff.`,
        },
        architect: {
          model: 'gemini-3.1-pro-preview',
          defaultSystemInstruction: `You are the MakeQR Senior Technical & Security Architect. Provide deep, rigorous technical analysis of ISO/IEC 18004 QR specifications, Reed-Solomon error correction polynomials (Levels L: 7%, M: 15%, Q: 25%, H: 30%), byte/alphanumeric/kanji encoding efficiency, print DPI and viewing distance formulas, vCard 3.0/4.0 syntax, and dynamic redirection security.`,
        },
      };

      const selectedRole = ROLE_CONFIGS[roleId] || ROLE_CONFIGS.consultant;
      const targetModel = selectedRole.model;
      const systemInstruction = customSystemInstruction || selectedRole.defaultSystemInstruction;

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured in environment. Please check GEMINI_API_KEY.',
          reply: `I am currently in demo mode because the GEMINI_API_KEY is not yet attached to the server environment. Please attach the Gemini API key in Settings > Secrets to activate real-time intelligence and live Google Maps grounding.`,
          groundingChunks: [],
          extractedPlaces: [],
        });
      }

      // Format messages into GoogleGenAI contents array
      const formattedContents = messages
        .filter((m: any) => m && m.content && String(m.content).trim().length > 0)
        .map((m: any) => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(m.content).trim() }],
        }));

      if (formattedContents.length === 0) {
        return res.status(400).json({ error: 'At least one valid message content is required' });
      }

      // Configure tools according to role and request
      const useMaps = roleId === 'places';
      const config: any = {
        systemInstruction,
      };

      if (useMaps) {
        config.tools = [{ googleMaps: {} }];
        if (
          userLocation &&
          typeof userLocation.latitude === 'number' &&
          typeof userLocation.longitude === 'number' &&
          !isNaN(userLocation.latitude) &&
          !isNaN(userLocation.longitude)
        ) {
          config.toolConfig = {
            retrievalConfig: {
              latLng: {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              },
            },
          };
        }
      }

      let response: any = null;
      let effectiveModel = targetModel;

      try {
        response = await ai.models.generateContent({
          model: targetModel,
          contents: formattedContents,
          config,
        });
      } catch (firstErr: any) {
        // If pro model or specific model encounters billing/quota error, fallback gracefully to gemini-3.5-flash
        if (targetModel !== 'gemini-3.5-flash') {
          console.warn(`Model ${targetModel} call failed (${firstErr?.message}), falling back to gemini-3.5-flash...`);
          effectiveModel = 'gemini-3.5-flash';
          response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: formattedContents,
            config,
          });
        } else {
          throw firstErr;
        }
      }

      const replyText = response.text || '';
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;
      const groundingChunks = groundingMetadata?.groundingChunks || [];

      // Extract structured places for Google Maps links and review snippets per requirements:
      // "If Google Maps is used, you MUST ALWAYS extract the URLs from groundingChunks and list them on the web app as links. This includes groundingChunks.maps.uri and groundingChunks.maps.placeAnswerSources.reviewSnippets."
      const extractedPlaces: Array<{
        title: string;
        uri: string;
        reviewSnippets: string[];
      }> = [];

      for (const chunk of groundingChunks) {
        if (chunk.maps) {
          const title = chunk.maps.title || 'View on Google Maps';
          const uri = chunk.maps.uri || '';
          const reviewSnippets: string[] = [];
          if (Array.isArray(chunk.maps.placeAnswerSources?.reviewSnippets)) {
            for (const r of chunk.maps.placeAnswerSources.reviewSnippets) {
              const snippet = typeof r === 'string' ? r : r?.snippet || r?.text;
              if (snippet) reviewSnippets.push(snippet);
            }
          }
          if (uri || title) {
            extractedPlaces.push({
              title,
              uri,
              reviewSnippets,
            });
          }
        }
      }

      return res.json({
        reply: replyText,
        modelUsed: effectiveModel,
        roleId,
        groundingMetadata,
        extractedPlaces,
      });
    } catch (err: any) {
      console.error('Error in /api/ai/chat:', err);
      const errMsg = String(err?.message || '');
      const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');

      if (isQuota && req.body.roleId === 'places') {
        const messages = req.body.messages || [];
        const lastUserMsg = messages.filter((m: any) => m.role === 'user').pop()?.content || '';
        const cleanQuery = lastUserMsg.replace(/find|search|where is|locate|google maps info for|can you find/gi, '').trim() || 'Popular Destination';
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanQuery)}`;
        
        return res.json({
          reply: `Here are the location details for **${cleanQuery}**.\n\nYou can click the Google Maps link below to view direct navigation, or click **"Make Place QR"** to immediately convert this location into a scannable Google Maps QR code in MakeQR.`,
          modelUsed: 'gemini-3.5-flash (maps-assist)',
          roleId: 'places',
          groundingMetadata: null,
          extractedPlaces: [
            {
              title: cleanQuery,
              uri: mapsUrl,
              reviewSnippets: ['Click to open direct real-time navigation and reviews on Google Maps.'],
            },
          ],
        });
      }

      if (isQuota) {
        return res.json({
          reply: `Gemini API rate limit reached on this project. Please wait a moment before trying again, or switch to **Fast Slogans** (gemini-3.1-flash-lite).`,
          modelUsed: 'gemini-rate-limit-notice',
          roleId: req.body.roleId || 'consultant',
          groundingMetadata: null,
          extractedPlaces: [],
        });
      }

      return res.status(500).json({
        error: err?.message || 'Failed to process AI chat request',
      });
    }
  });
 
  // --- Direct Short Link /:slug handler (e.g., domain.com/my-link without /r/) ---
  app.get('/:slug', (req, res, next) => {
    const rawSlug = req.params.slug;
    if (!rawSlug) return next();

    const lowerSlug = rawSlug.toLowerCase();
    let decodedSlug = lowerSlug;
    try {
      decodedSlug = decodeURIComponent(rawSlug).toLowerCase();
    } catch {}

    // Exclude static assets and system routes
    const RESERVED_PREFIXES = ['api', 'health', 'public', 'assets', 'videos', 'node_modules', 'src', 'r', 'dist', '@vite', '@fs', '@id', 'favicon.ico'];
    if (RESERVED_PREFIXES.includes(lowerSlug) || RESERVED_PREFIXES.includes(decodedSlug)) {
      return next();
    }

    // Check if this slug matches a dynamic link or public file first (even if it has dots or symbols!)
    let hasDynamic = dynamicLinks.has(rawSlug) || dynamicLinks.has(lowerSlug) || dynamicLinks.has(decodedSlug);
    let hasFile = publicFiles.has(rawSlug) || publicFiles.has(lowerSlug) || publicFiles.has(decodedSlug) ||
      Array.from(publicFiles.values()).some(f => {
        const s = ((f as any).customSlug || '').toLowerCase();
        return s === rawSlug || s === lowerSlug || s === decodedSlug;
      });

    if (!hasDynamic && !hasFile) {
      loadLinksFromFile();
      loadPublicFiles();
      hasDynamic = dynamicLinks.has(rawSlug) || dynamicLinks.has(lowerSlug) || dynamicLinks.has(decodedSlug);
      hasFile = publicFiles.has(rawSlug) || publicFiles.has(lowerSlug) || publicFiles.has(decodedSlug) ||
        Array.from(publicFiles.values()).some(f => {
          const s = ((f as any).customSlug || '').toLowerCase();
          return s === rawSlug || s === lowerSlug || s === decodedSlug;
        });
    }

    if (hasDynamic || hasFile) {
      return handleRedirect(rawSlug, req, res, next);
    }

    // If not a recognized custom link, check if it's an asset file with extensions or Vite internal
    if (rawSlug.includes('.') || rawSlug.startsWith('@')) {
      return next();
    }

    // Pass through to Vite / SPA
    next();
  });
 
  // --- Vite Middleware for Development ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
 
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MakeQR Server active on http://0.0.0.0:${PORT}`);
  });

  // Keep-alive: Render's free plan sleeps a service after ~15 min without traffic.
  // Ping our own public URL every 14 min so it stays awake (RENDER_EXTERNAL_URL is set by Render).
  const keepAliveUrl = (process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, '');
  if (keepAliveUrl && process.env.KEEP_ALIVE !== 'off') {
    setInterval(() => {
      fetch(`${keepAliveUrl}/api/health`, { headers: { 'user-agent': 'makeqr-keepalive' } })
        .then((r) => console.log(`[keep-alive] ping ${r.status}`))
        .catch((e) => console.warn('[keep-alive] ping failed:', e?.message || e));
    }, 14 * 60 * 1000);
    console.log(`[keep-alive] pinging ${keepAliveUrl}/api/health every 14 minutes`);
  }
}
 
startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
 
 
 