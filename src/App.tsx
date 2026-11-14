import React, { useState, useEffect, useCallback } from 'react';
import { QUICKLINK_DEFS, DEFAULT_QUICKLINK, buildQuickLink, quickLinkHasValue, type QuickLinkKind } from './utils/quicklinks';
import { QUICKLINK_UI } from './components/quicklink-ui';
import { BrandKitPanel } from './components/BrandKitPanel';
import { ReferralPrompt } from './components/ReferralPrompt';
import { capturePendingRef } from './utils/referral';
import { applyKit, loadKits } from './utils/brandkit';
import { PAGE_KINDS, createPage, pageHasContent, publishPage, type PageKind } from './utils/pages';
import { Navbar, AppViewMode } from './components/Navbar';
import { ContentInputs } from './components/ContentInputs';
import { DesignCustomizer } from './components/DesignCustomizer';
import { QRPreviewCard } from './components/QRPreviewCard';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CoinsProvider, useCoins } from './context/CoinsContext';
import { CoinRewardToast } from './components/CoinRewardToast';
import { QRConfig, SavedQR, ContentType, FileData } from './types';
import { DEFAULT_CONFIG } from './utils/qr-constants';

const HomePage = React.lazy(() => import('./components/HomePage').then(m => ({ default: m.HomePage })));
const ChooseTypePage = React.lazy(() => import('./components/ChooseTypePage').then(m => ({ default: m.ChooseTypePage })));
const MyQRCodesPage = React.lazy(() => import('./components/MyQRCodesPage').then(m => ({ default: m.MyQRCodesPage })));
const PagePublicView = React.lazy(() => import('./components/PagePublicView').then(m => ({ default: m.PagePublicView })));
const PublicFileView = React.lazy(() => import('./components/PublicFileView').then(m => ({ default: m.PublicFileView })));
const ExpiredNoticeView = React.lazy(() => import('./components/ExpiredNoticeView').then(m => ({ default: m.ExpiredNoticeView })));
const TemplateModal = React.lazy(() => import('./components/TemplateModal').then(m => ({ default: m.TemplateModal })));
const ScannerModal = React.lazy(() => import('./components/ScannerModal').then(m => ({ default: m.ScannerModal })));
const HistoryDrawer = React.lazy(() => import('./components/HistoryDrawer').then(m => ({ default: m.HistoryDrawer })));
const DownloadSuccessModal = React.lazy(() => import('./components/DownloadSuccessModal').then(m => ({ default: m.DownloadSuccessModal })));
const AuthModal = React.lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const BarcodePage = React.lazy(() => import('./components/BarcodePage').then(m => ({ default: m.BarcodePage })));
const PricingPage = React.lazy(() => import('./components/PricingPage').then(m => ({ default: m.PricingPage })));
const SupportPage = React.lazy(() => import('./components/SupportPage').then(m => ({ default: m.SupportPage })));
const CoinsModal = React.lazy(() => import('./components/CoinsModal').then(m => ({ default: m.CoinsModal })));
import { AIChatModal, AIRoleId } from './components/AIChatModal';
import { clearAllStoredFiles, deleteFileFromStore, getAllStoredFiles, saveFileToStore, getFileViewerUrl } from './utils/file-store';
import { 
  saveQRCodeToCloud, 
  deleteQRCodeFromCloud, 
  subscribeToUserQRCodes,
  subscribeToUserFiles,
  saveDynamicLinkToFirestore
} from './lib/firebase';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Printer, 
  Home, 
  Plus, 
  ArrowLeft, 
  Cloud, 
  CheckCircle2, 
  Edit3, 
  Camera, 
  FolderHeart, 
  RotateCcw,
  Check,
  Sliders,
  Eye,
  Globe,
  FileText,
  Wifi,
  Contact2,
  AlignLeft,
  Share2,
  Mail,
  PhoneCall,
  Send,
  Calendar,
  MapPin,
  Coins,
  ArrowRightLeft,
  Tag,
  Download,
  BookmarkPlus,
  Copy,
  RefreshCw,
  ChevronRight,
  LogIn,
  Layers,
} from 'lucide-react';

const CONTENT_TYPE_INFO: Record<ContentType, {
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}> = {
  url: {
    title: 'URL / Website Link',
    badge: 'Web & Link',
    description: 'Redirect visitors directly to your website, blog, social link, or portfolio.',
    icon: Globe,
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  file: {
    title: 'File Upload & Media',
    badge: 'Cloud Host',
    description: 'Cloud-hosted PDF, documents, audio, videos, or image gallery with high-speed delivery.',
    icon: FileText,
    iconBg: 'bg-rose-50 dark:bg-rose-950/60',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  social: {
    title: 'Link-in-Bio & Socials',
    badge: 'Bio Profile',
    description: 'Mobile landing page featuring your bio, profile picture, and all social channels.',
    icon: Share2,
    iconBg: 'bg-pink-50 dark:bg-pink-950/60',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  vcard: {
    title: 'Contact Card (vCard)',
    badge: 'vCard Digital',
    description: 'Share your full contact details: name, phone, email, company, address & website.',
    icon: Contact2,
    iconBg: 'bg-purple-50 dark:bg-purple-950/60',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  wifi: {
    title: 'Wi-Fi Network',
    badge: 'Instant Connect',
    description: 'Allow guests and clients to join your Wi-Fi instantly without entering passwords.',
    icon: Wifi,
    iconBg: 'bg-sky-50 dark:bg-sky-950/60',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  text: {
    title: 'Plain Text & Note',
    badge: 'Plain Text',
    description: 'Display unformatted plain text, special instructions, access codes, or messages.',
    icon: AlignLeft,
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-700 dark:text-slate-300',
  },
  email: {
    title: 'E-mail Draft',
    badge: 'Quick Mail',
    description: 'Draft a direct email with pre-filled recipient address, subject line, and body message.',
    icon: Mail,
    iconBg: 'bg-blue-50 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  phone: {
    title: 'Phone Call',
    badge: 'Instant Dial',
    description: 'Prompt a direct phone call to customer support, sales, or personal line upon scan.',
    icon: PhoneCall,
    iconBg: 'bg-teal-50 dark:bg-teal-950/60',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  sms: {
    title: 'SMS Message',
    badge: 'Direct SMS',
    description: 'Compose and send a pre-written text message to a designated phone number.',
    icon: Send,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  event: {
    title: 'Calendar Event',
    badge: 'Calendar',
    description: 'Add webinar, conference, party, or wedding event directly to calendar app.',
    icon: Calendar,
    iconBg: 'bg-orange-50 dark:bg-orange-950/60',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  geo: {
    title: 'Location & Google Maps',
    badge: 'GPS Pin',
    description: 'Direct customers to your physical business, event venue, or GPS coordinates.',
    icon: MapPin,
    iconBg: 'bg-red-50 dark:bg-red-950/60',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  quicklink: {
    title: 'Quick Link',
    badge: 'Social & Pay',
    description: 'WhatsApp, Instagram, YouTube, reviews, payments and more.',
    icon: Globe,
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  page: {
    title: 'Hosted Page',
    badge: 'Editable',
    description: 'A business card, menu or gallery page you can edit after printing.',
    icon: Layers,
    iconBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/60',
    iconColor: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
  crypto: {
    title: 'Cryptocurrency Wallet',
    badge: 'Crypto Pay',
    description: 'Receive Bitcoin, Ethereum, Solana, or USDT payments directly to your wallet.',
    icon: Coins,
    iconBg: 'bg-amber-50 dark:bg-amber-950/60',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
};

const STORAGE_KEY = 'makeqr_history_v1';
const LEGACY_STORAGE_KEY = 'qr_brand_studio_history_v1';
const THEME_STORAGE_KEY = 'makeqr_theme_mode';

function extractFileIdFromUrl(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    let urlObj: URL | null = null;
    if (/^https?:\/\//i.test(trimmed)) {
      urlObj = new URL(trimmed);
    } else if (trimmed.startsWith('/') || trimmed.startsWith('?')) {
      urlObj = new URL(trimmed, window.location.origin);
    }

    if (urlObj) {
      const params = urlObj.searchParams;

      // 1. Explicit query parameter value: ?file=, ?viewFile=, ?f=, ?id=, ?v=, ?slug=
      const explicit =
        params.get('file') ||
        params.get('viewFile') ||
        params.get('f') ||
        params.get('id') ||
        params.get('v') ||
        params.get('slug');
      if (explicit && explicit.trim()) {
        return explicit.trim();
      }

      // 2. Query param key itself starting with f_ (e.g. ?f_1788604068638_qhhkg)
      for (const k of params.keys()) {
        const cleanK = k.trim();
        if (cleanK.startsWith('f_')) {
          return cleanK;
        }
      }

      // 3. Standalone query without '=' (e.g. ?f_1788604068638_qhhkg or ?my-video-slug)
      const rawSearch = urlObj.search.replace(/^\?/, '').trim();
      if (rawSearch && !rawSearch.includes('&') && !rawSearch.includes('=')) {
        const decoded = decodeURIComponent(rawSearch).trim();
        if (
          decoded &&
          !['home', 'studio', 'choose-type', 'my-codes', 'fbclid', 'gclid', 'ref'].includes(decoded.toLowerCase())
        ) {
          return decoded;
        }
      }

      // 4. Any query param key with empty value (e.g. ?my-video)
      for (const [k, v] of params.entries()) {
        const cleanK = k.trim();
        if (
          cleanK &&
          (!v || v === '') &&
          !['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid', 'gclid'].includes(
            cleanK.toLowerCase()
          )
        ) {
          return cleanK;
        }
      }

      // 5. Hash checks (e.g. #f_1788604068638_qhhkg or #file=...)
      if (urlObj.hash) {
        const cleanHash = urlObj.hash.replace(/^#\/?/, '').trim();
        if (cleanHash.startsWith('f_')) return cleanHash;
        try {
          const hashParams = new URLSearchParams(cleanHash);
          const hFile = hashParams.get('file') || hashParams.get('f') || hashParams.get('id');
          if (hFile && hFile.trim()) return hFile.trim();
        } catch {}
      }

      // 6. Pathname checks (e.g. /my-slug or /f_123 or /r/my-slug)
      const cleanPath = urlObj.pathname.replace(/^\/+|\/+$/g, '').replace(/^(r|v|file|view)\//, '').trim();
      if (cleanPath) {
        const systemPaths = [
          'api',
          'public',
          'assets',
          'videos',
          'dist',
          'src',
          '@vite',
          '@fs',
          'choose-type',
          'my-codes',
          'studio',
          'home',
          'barcode',
          'pricing',
          'support',
          'expired',
          'p/',
        ];
        if (!systemPaths.some((p) => cleanPath.startsWith(p)) && !cleanPath.includes('.')) {
          return cleanPath;
        }
      }
    }
  } catch {}

  // Direct string without full URL (e.g. "f_1788604068638_qhhkg" or "?f_1788604068638_qhhkg")
  const stripped = trimmed.replace(/^[?#\/]+/, '').trim();
  if (stripped.startsWith('f_')) {
    return stripped;
  }

  return null;
}

function parseCurrentRoute(): { view: AppViewMode; fileId: string | null } {
  try {
    const fileId = extractFileIdFromUrl(window.location.href);
    if (fileId) {
      return { view: 'file-view', fileId };
    }

    // Deep link used by the Chrome extension: /?newurl=https://… opens the studio with that link
    if (/^https?:\/\//i.test(new URLSearchParams(window.location.search).get('newurl') || '')) {
      return { view: 'studio', fileId: null };
    }

    const cleanPath = window.location.pathname.replace(/^\/+|\/+$/g, '').trim();
    if (/^p\/[A-Za-z0-9]+$/.test(cleanPath)) return { view: 'page-view', fileId: cleanPath.slice(2) };
    if (cleanPath === 'choose-type') return { view: 'choose-type', fileId: null };
    if (cleanPath === 'my-codes') return { view: 'my-codes', fileId: null };
    if (cleanPath === 'studio') return { view: 'studio', fileId: null };
    if (cleanPath === 'expired') return { view: 'expired', fileId: null };
    if (cleanPath === 'barcode') return { view: 'barcode', fileId: null };
    if (cleanPath === 'pricing') return { view: 'pricing', fileId: null };
    if (cleanPath === 'support') return { view: 'support', fileId: null };
    if (cleanPath === 'home' || cleanPath === '') return { view: 'home', fileId: null };
  } catch {}
  return { view: 'home', fileId: null };
}

function MainApp() {
  const { user, openAuthModal } = useAuth();
  const { earnCoins } = useCoins();

  const initialRoute = parseCurrentRoute();
  const [viewFileId, setViewFileId] = useState<string | null>(initialRoute.fileId);
  const [currentView, setCurrentView] = useState<AppViewMode>(initialRoute.view);
  const navigateTo = (view: AppViewMode) => {
    setCurrentView(view);
    try {
      window.history.pushState({}, '', view === 'home' ? '/' : `/${view}`);
      window.scrollTo({ top: 0 });
    } catch {}
  };

  const [config, setConfig] = useState<QRConfig>(() => {
    try {
      const nu = new URLSearchParams(window.location.search).get('newurl');
      if (nu && /^https?:\/\//i.test(nu)) return { ...DEFAULT_CONFIG, contentType: 'url', url: nu };
    } catch {}
    return DEFAULT_CONFIG;
  });

  const [savedItems, setSavedItems] = useState<SavedQR[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      const parsed: SavedQR[] = stored ? JSON.parse(stored) : [];
      // drop exact duplicate ids left over from earlier double-saves
      const seen = new Set<string>();
      return parsed.filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)));
    } catch {
      return [];
    }
  });

  const [userFiles, setUserFiles] = useState<FileData[]>([]);

  useEffect(() => {
    getAllStoredFiles().then((files) => {
      setUserFiles(files);
    }).catch(() => {});
  }, []);

  // Dark / Light Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
    } catch {
      return false;
    }
  });

  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [mobileStudioTab, setMobileStudioTab] = useState<'edit' | 'preview'>('edit');
  const [wizardStep, setWizardStep] = useState<2 | 3 | 4>(2);
  const goToStep = (step: 2 | 3 | 4) => {
    setWizardStep(step);
    setMobileStudioTab('edit');
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  };

  // Gemini AI Assistant & Maps Grounding State
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiChatRole, setAiChatRole] = useState<AIRoleId>('consultant');
  const [aiChatQuery, setAiChatQuery] = useState('');

  const handleOpenAIChat = (role: AIRoleId = 'consultant', initialQuery = '') => {
    setAiChatRole(role);
    setAiChatQuery(initialQuery);
    setIsAIChatOpen(true);
  };

  const handleApplyPlaceToQR = (place: { title: string; uri: string; lat?: number; lng?: number }) => {
    const placeTitle = place.title || 'Location';
    setConfig((prev) => {
      if (prev.contentType === 'geo') {
        return {
          ...prev,
          geo: {
            latitude: place.lat || prev.geo?.latitude || 37.7749,
            longitude: place.lng || prev.geo?.longitude || -122.4194,
            query: placeTitle,
            provider: 'google',
          },
          frame: {
            ...prev.frame,
            title: prev.frame.title && prev.frame.title !== 'SCAN ME' ? prev.frame.title : `VISIT ${placeTitle.slice(0, 14).toUpperCase()}`,
          },
        };
      }
      return {
        ...prev,
        contentType: 'url',
        url: place.uri,
        frame: {
          ...prev.frame,
          title: prev.frame.title && prev.frame.title !== 'SCAN ME' ? prev.frame.title : 'FIND US HERE',
          subtitle: placeTitle.slice(0, 32),
        },
      };
    });

    setWizardStep(3);
    setCurrentView('studio');
    try {
      window.history.pushState({}, '', '/studio');
    } catch {}
  };

  // Sync theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      try {
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      } catch {}
    } else {
      root.classList.remove('dark');
      try {
        localStorage.setItem(THEME_STORAGE_KEY, 'light');
      } catch {}
    }
  }, [isDark]);

  // Sync saved items to localStorage with automatic size compression so saves NEVER fail
  useEffect(() => {
    if (savedItems.length === 0) {
      try {
        localStorage.setItem(STORAGE_KEY, '[]');
      } catch {}
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItems));
    } catch (e) {
      console.warn('LocalStorage quota pressure, optimizing thumbnails to ensure persistence...', e);
      try {
        // Truncate heavy thumbnail strings and large file base64 data to safely fit within quota
        const optimized = savedItems.slice(0, 100).map((item) => ({
          ...item,
          previewThumbnail: item.previewThumbnail && item.previewThumbnail.length > 50000
            ? item.previewThumbnail.slice(0, 50000)
            : item.previewThumbnail,
          config: {
            ...item.config,
            logo: item.config.logo ? { ...item.config.logo, uploadedUrl: undefined } : item.config.logo,
            file: item.config.file ? { ...item.config.file, dataUrl: '' } : item.config.file,
          },
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(optimized));
      } catch (err2) {
        console.error('Final localStorage attempt failed:', err2);
      }
    }
  }, [savedItems]);

  const deletedIdsRef = React.useRef<Set<string>>(new Set());

  // Always-current copy of the saved list (the save handler can be called twice before React re-renders)
  const savedItemsRef = React.useRef<SavedQR[]>(savedItems);
  savedItemsRef.current = savedItems;

  // Normalised view of a QR's config. Firestore stores a slimmed-down copy (file bytes dropped,
  // '' for empty slug, truncated logo), so compare only the parts that survive that round-trip.
  const normalizedConfig = (c: any) => ({
    ...c,
    folder: undefined,
    tags: undefined,
    file: c?.file ? { id: c.file.id, customSlug: c.file.customSlug || '' } : undefined,
    logo: c?.logo ? { ...c.logo, uploadedUrl: c.logo.uploadedUrl ? 'set' : undefined } : undefined,
    dynamic: c?.dynamic ? { ...c.dynamic, scanCount: undefined, lastScannedAt: undefined } : undefined,
  });
  // Identity of "the same QR": a file QR is identified by its uploaded file; others by their full settings
  const qrIdentityKey = (c: any) =>
    c?.contentType === 'file' && c?.file?.id ? `file:${c.file.id}`
    : c?.contentType === 'page' && c?.page?.id ? `page:${c.page.id}`
    : JSON.stringify(normalizedConfig(c));

  // Collapse duplicate saved QRs (same id, or identical content saved twice). Keeps the oldest.
  const dedupeSaved = (items: SavedQR[]): { kept: SavedQR[]; removed: SavedQR[] } => {
    const contentKey = (i: SavedQR) => (i.contentType === 'page' && i.config?.page?.id ? `page:${i.config.page.id}` : JSON.stringify({ t: i.contentType, n: i.name, c: normalizedConfig(i.config) }));
    const sorted = [...items].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const seenIds = new Set<string>();
    const seenContent = new Set<string>();
    const kept: SavedQR[] = [];
    const removed: SavedQR[] = [];
    for (const it of sorted) {
      const ck = contentKey(it);
      if (seenIds.has(it.id) || seenContent.has(ck)) {
        removed.push(it);
        continue;
      }
      seenIds.add(it.id);
      seenContent.add(ck);
      kept.push(it);
    }
    kept.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return { kept, removed };
  };

  // Restore deleted IDs from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('makeqr_deleted_ids');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((id) => deletedIdsRef.current.add(id));
        }
      }
    } catch {}
  }, []);

  // Firebase Cloud Sync Listener when user is authenticated
  useEffect(() => {
    if (!user) return;

    // Listen to real-time cloud items
    const unsubscribe = subscribeToUserQRCodes(user.uid, (cloudItems) => {
      // Exclude any IDs deleted in this session
      const validCloudItems = cloudItems.filter((c) => !deletedIdsRef.current.has(c.id));

      setSavedItems((prevLocal) => {
        const filteredLocal = prevLocal.filter((p) => !deletedIdsRef.current.has(p.id));
        const cloudIds = new Set(validCloudItems.map((c) => c.id));
        const unsyncedLocal = filteredLocal.filter((p) => !cloudIds.has(p.id));

        // Auto-save any local QRs that aren't in the cloud yet and NOT deleted
        if (unsyncedLocal.length > 0) {
          unsyncedLocal.forEach((item) => {
            if (!deletedIdsRef.current.has(item.id)) {
              saveQRCodeToCloud(item, user.uid).catch((err) => {
                console.warn('Syncing local QR to cloud error:', err);
              });
            }
          });
        }

        const { kept, removed } = dedupeSaved([...validCloudItems, ...unsyncedLocal]);
        // Remove leftover duplicate copies from the cloud so they don't come back
        removed.forEach((dup) => {
          if (kept.some((k) => k.id === dup.id)) return; // same id = same doc, nothing to delete
          deletedIdsRef.current.add(dup.id);
          deleteQRCodeFromCloud(dup.id, user.uid).catch(() => {});
        });
        return kept;
      });
    });

    // Listen to real-time user files stored in Firestore
    const unsubFiles = subscribeToUserFiles(user.uid, (cloudFiles) => {
      setUserFiles((prevLocal) => {
        const cloudIds = new Set(cloudFiles.map((f) => f.id));
        const unsyncedLocal = prevLocal.filter((p) => !cloudIds.has(p.id) && !(p.customSlug && p.id === p.customSlug));
        const seen = new Set<string>();
        return [...cloudFiles, ...unsyncedLocal].filter((f) => (seen.has(f.id) ? false : (seen.add(f.id), true)));
      });
    });

    return () => {
      unsubscribe();
      unsubFiles();
    };
  }, [user]);

  // Sync browser back/forward buttons with AppView
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseCurrentRoute();
      setCurrentView(parsed.view);
      setViewFileId(parsed.fileId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const updateConfig = (updater: Partial<QRConfig>) => {
    setConfig((prev) => ({ ...prev, ...updater }));
  };

  const handleContentTypeChange = (type: ContentType, quickKind?: QuickLinkKind, pageKind?: PageKind) => {
    setConfig((prev) => ({
      ...prev,
      contentType: type,
      page: type === 'page' ? createPage(pageKind ?? 'card') : prev.page,
      quicklink: type === 'quicklink'
        ? { kind: quickKind ?? prev.quicklink?.kind ?? 'whatsapp', value: '', message: '', amount: '' }
        : prev.quicklink,
      frame: {
        ...prev.frame,
        title:
          type === 'page'
            ? PAGE_KINDS[pageKind ?? 'card'].frameTitle
            : type === 'quicklink'
            ? QUICKLINK_DEFS[quickKind ?? prev.quicklink?.kind ?? 'whatsapp'].frameTitle
            : type === 'wifi'
            ? 'FREE WI-FI'
            : type === 'vcard'
            ? 'SAVE CONTACT'
            : type === 'file'
            ? 'DOWNLOAD FILE'
            : prev.frame.title || 'SCAN ME',
      },
    }));
  };

  const handleSaveToHistory = async (previewThumbnail: string) => {
    // Saving to the library (and earning coins) requires a signed-in account.
    if (!user) return;
    let summary = '';
    if (config.contentType === 'url') summary = config.url;
    else if (config.contentType === 'wifi') summary = `SSID: ${config.wifi.ssid}`;
    else if (config.contentType === 'vcard')
      summary = `${config.vcard.firstName} ${config.vcard.lastName} (${config.vcard.company})`;
    else if (config.contentType === 'file') summary = config.file?.name || 'Uploaded file';
    else if (config.contentType === 'page') summary = `${PAGE_KINDS[config.page.kind].short}: ${config.page.title || config.page.card.name || 'Untitled'} — /p/${config.page.id}`;
    else if (config.contentType === 'quicklink') summary = buildQuickLink(config.quicklink ?? DEFAULT_QUICKLINK);
    else summary = config.text.slice(0, 30);

    // Same QR already saved (e.g. download then Save)? Update that entry in place instead of adding a copy.
    const currentKey = qrIdentityKey(config);
    const existingItem = savedItemsRef.current.find((i) => qrIdentityKey(i.config) === currentKey);

    const newItem: SavedQR = {
      id: existingItem?.id || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: config.name?.trim() || config.frame.title?.trim() || `${config.contentType.toUpperCase()} QR`,
      createdAt: existingItem?.createdAt || Date.now(),
      previewThumbnail,
      contentType: config.contentType,
      summaryText: summary,
      folder: config.folder ?? existingItem?.folder,
      tags: config.tags ?? existingItem?.tags,
      config: JSON.parse(JSON.stringify({ ...config, folder: config.folder ?? existingItem?.folder, tags: config.tags ?? existingItem?.tags })),
    };

    // Update local state immediately for instant feedback (ref first, so a second call right after sees it)
    savedItemsRef.current = [newItem, ...savedItemsRef.current.filter((i) => i.id !== newItem.id)];
    setSavedItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);

    // 1. Generate deduplication fingerprint so saving or re-saving the same QR doesn't award infinite coins
    const qrFingerprint = `${config.contentType}:${
      config.contentType === 'file'
        ? (config.file?.id || '') + ':' + (config.file?.customSlug || '')
        : config.contentType === 'url'
        ? config.url + ':' + (config.dynamic?.customSlug || '')
        : summary
    }`;

    // Award coins for creating a new QR (deduplicated!)
    earnCoins(10, 'Earned 10 Coins for creating QR!', true, `create_qr_${qrFingerprint}`);

    // Hosted pages must be live before anyone scans the QR
    if (config.contentType === 'page' && config.page && pageHasContent(config.page)) {
      const pr = await publishPage(config.page);
      if (!pr.ok) window.alert(`Your QR was saved, but the page was not published: ${pr.error}`);
    }

    // 2. Persist File & Custom Slug across all layers if this is a file QR
    if (config.contentType === 'file' && config.file) {
      const effectiveSlug = (config.file.customSlug || config.dynamic?.customSlug || '').trim().toLowerCase();
      const fileToSave = {
        ...config.file,
        customSlug: effectiveSlug || undefined,
        userId: user?.uid || config.file.userId,
        userEmail: user?.email || config.file.userEmail,
      };

      // A. Save to IndexedDB, server (/api/files, awaited) & Cloud Firestore — single upload
      try {
        await saveFileToStore(fileToSave, user?.uid);
      } catch (err) {
        console.warn('saveFileToStore note:', err);
      }

      // C. If customSlug exists, register dynamic redirect route immediately
      if (fileToSave.customSlug) {
        const dest = `/?file=${encodeURIComponent(fileToSave.id)}`;
        fetch('/api/dynamic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: fileToSave.customSlug,
            customSlug: fileToSave.customSlug,
            title: fileToSave.title || fileToSave.name,
            targetUrl: dest,
            contentType: 'file',
          }),
        }).catch((err) => console.warn('Server dynamic link sync note:', err));

        saveDynamicLinkToFirestore({
          id: fileToSave.customSlug,
          targetUrl: dest,
          title: fileToSave.title || fileToSave.name,
          contentType: 'file',
          scanCount: 0,
          createdAt: Date.now(),
        }).catch((err) => console.warn('Firestore dynamic link sync note:', err));
      }
    } else if (config.dynamic?.isDynamic && (config.dynamic.customSlug || config.dynamic.dynamicId)) {
      const slug = (config.dynamic.customSlug || config.dynamic.dynamicId)!.trim();
      const dest = (config.url || config.dynamic.targetUrl || 'https://example.com').trim();
      fetch('/api/dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: slug,
          customSlug: slug,
          title: config.frame.title || slug,
          targetUrl: dest,
          contentType: config.contentType,
        }),
      }).catch((err) => console.warn('Dynamic route server sync note:', err));

      saveDynamicLinkToFirestore({
        id: slug,
        targetUrl: dest,
        title: config.frame.title || slug,
        contentType: config.contentType,
        scanCount: config.dynamic.scanCount || 0,
        createdAt: Date.now(),
      }).catch((err) => console.warn('Dynamic route cloud sync note:', err));
    }

    // Save directly to Firestore cloud collection (auto-authenticates anonymously if needed)
    try {
      await saveQRCodeToCloud(newItem, user?.uid);
    } catch (err) {
      console.error('Failed to sync QR code to Firebase Firestore:', err);
    }

    setIsSuccessModalOpen(true);
  };

  const handleBatchSave = (items: SavedQR[]) => {
    savedItemsRef.current = [...items, ...savedItemsRef.current];
    setSavedItems((prev) => [...items, ...prev]);
    items.forEach((it) => saveQRCodeToCloud(it, user?.uid).catch(() => {}));
  };

  const handleUpdateMeta = (id: string, meta: { folder?: string; tags: string[] }) => {
    let updated: SavedQR | null = null;
    setSavedItems((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      updated = { ...i, folder: meta.folder, tags: meta.tags, config: { ...i.config, folder: meta.folder, tags: meta.tags } };
      return updated;
    }));
    setTimeout(() => { if (updated) saveQRCodeToCloud(updated, user?.uid).catch(() => {}); }, 0);
  };

  const [isSavingQR, setIsSavingQR] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);

  const saveLockRef = React.useRef(false);

  const triggerSaveQR = async () => {
    if (saveLockRef.current || isSavingQR) return;
    saveLockRef.current = true;
    if (!user) {
      saveLockRef.current = false;
      openAuthModal();
      return;
    }
    setIsSavingQR(true);
    let thumbnail = '';

    // 1. Try finding rendered canvas from QRPreviewCard or DOM
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      try {
        const miniCanvas = document.createElement('canvas');
        miniCanvas.width = 160;
        miniCanvas.height = 160;
        const ctx = miniCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, 0, 160, 160);
          thumbnail = miniCanvas.toDataURL('image/jpeg', 0.8);
        }
      } catch (e) {
        try {
          thumbnail = canvas.toDataURL('image/png', 0.6);
        } catch {}
      }
    }

    // 2. If thumbnail is still empty, create a clean minimal SVG thumbnail
    if (!thumbnail) {
      const title = (config.name || config.frame.title || config.contentType).slice(0, 16);
      const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <rect width="160" height="160" rx="16" fill="#4f46e5"/>
        <text x="80" y="88" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">${title.toUpperCase()}</text>
      </svg>`;
      thumbnail = `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
    }

    try {
      await handleSaveToHistory(thumbnail);
      setIsSaveSuccess(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#a855f7', '#10b981', '#f59e0b'],
      });
      setTimeout(() => setIsSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error saving QR code:', err);
    } finally {
      setIsSavingQR(false);
      saveLockRef.current = false;
    }
  };

  const handleStartNew = () => {
    setConfig(DEFAULT_CONFIG);
    setWizardStep(2);
    setViewFileId(null);
    setCurrentView('choose-type');
    try {
      window.history.pushState({}, '', '/choose-type');
    } catch {}
  };

  const handleContinue = () => {
    setCurrentView('studio');
    try {
      window.history.pushState({}, '', '/studio');
    } catch {}
  };

  const handleSelectType = (type: ContentType, quickKind?: QuickLinkKind, pageKind?: PageKind) => {
    handleContentTypeChange(type, quickKind, pageKind);
    const defaultKit = loadKits().find((k) => k.isDefault);
    if (defaultKit) setConfig((prev) => applyKit(prev, defaultKit));
    setWizardStep(2);
    setMobileStudioTab('edit');
    setCurrentView('studio');
    try {
      window.history.pushState({}, '', '/studio');
    } catch {}
  };

  const handleLoadItem = (item: SavedQR) => {
    setConfig({ ...DEFAULT_CONFIG, ...item.config, quicklink: item.config.quicklink ?? DEFAULT_QUICKLINK });
    setWizardStep(3);
    setCurrentView('studio');
    try {
      window.history.pushState({}, '', '/studio');
    } catch {}
  };

  const handleDeleteItem = async (id: string) => {
    // 1. Mark as deleted in session immediately to block real-time re-insertion
    deletedIdsRef.current.add(id);
    try {
      sessionStorage.setItem('makeqr_deleted_ids', JSON.stringify(Array.from(deletedIdsRef.current)));
    } catch {}

    // 2. Remove immediately from local state
    setSavedItems((prev) => prev.filter((i) => i.id !== id));

    // 3. Purge from all persistent localStorage keys
    const storageKeys = [STORAGE_KEY, LEGACY_STORAGE_KEY, 'makeqr_saved_codes'];
    for (const key of storageKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((item: any) => item.id !== id);
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      } catch {}
    }

    // 4. Delete local file from IndexedDB
    try {
      await deleteFileFromStore(id);
    } catch {}

    // 5. Delete from Firestore cloud collections (root & subcollection)
    try {
      await deleteQRCodeFromCloud(id, user?.uid);
    } catch (err) {
      console.warn('Failed to delete QR from Firestore cloud:', err);
    }
  };

  const handleDeleteUserFile = async (fileId: string) => {
    try {
      await deleteFileFromStore(fileId, user?.uid);
    } catch (e) {
      console.warn('Error deleting file from store/Firestore:', e);
    }
    setUserFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSelectFileAsQR = (file: FileData) => {
    setConfig((prev) => ({
      ...prev,
      contentType: 'file',
      file: file,
      frame: {
        ...prev.frame,
        title: file.name ? file.name.slice(0, 30) : prev.frame.title,
      },
      dynamic: {
        ...prev.dynamic,
        customSlug: file.customSlug || '',
      },
    }));
    setWizardStep(3);
    setCurrentView('studio');
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to reset all data and remove all saved items?')) {
      const itemsToDelete = [...savedItems];
      setSavedItems([]);
      setConfig(DEFAULT_CONFIG);

      // Clear local IndexedDB files and cache
      await clearAllStoredFiles();

      // Reset server links and uploaded files
      try {
        await fetch('/api/reset-data', { method: 'POST' });
      } catch (err) {
        console.error('Failed to notify server of data reset:', err);
      }

      if (user) {
        try {
          await Promise.all(itemsToDelete.map((item) => deleteQRCodeFromCloud(item.id, user.uid)));
        } catch (err) {
          console.error('Failed to clear cloud items:', err);
        }
      }
    }
  };

  const handleSyncLocalToCloud = useCallback(async () => {
    if (!user || savedItems.length === 0) return;
    try {
      await Promise.all(savedItems.map((item) => saveQRCodeToCloud(item, user.uid)));
    } catch (err) {
      console.error('Failed to bulk sync items to cloud:', err);
    }
  }, [user, savedItems]);

  const handleApplyTemplate = (partialConfig: Partial<QRConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...partialConfig,
      colors: {
        ...prev.colors,
        ...(partialConfig.colors || {}),
      },
      shapes: {
        ...prev.shapes,
        ...(partialConfig.shapes || {}),
      },
      logo: {
        ...prev.logo,
        ...(partialConfig.logo || {}),
      },
      frame: {
        ...prev.frame,
        ...(partialConfig.frame || {}),
      },
    }));
    setWizardStep(4);
    setCurrentView('studio');
  };

  const handleCloseFileViewer = () => {
    setViewFileId(null);
    setCurrentView('home');
    try {
      window.history.pushState({}, '', '/');
    } catch {}
  };

  const handleLoadScannedData = (decoded: string) => {
    const trimmed = (decoded || '').trim();
    setIsScannerOpen(false);

    const fileId = extractFileIdFromUrl(trimmed);
    if (fileId) {
      setViewFileId(fileId);
      setCurrentView('file-view');
      try {
        window.history.pushState({}, '', `/?file=${encodeURIComponent(fileId)}`);
      } catch {}
      return;
    }

    // Otherwise load into studio editor based on pattern
    if (/^https?:\/\//i.test(trimmed)) {
      setConfig((prev) => ({ ...prev, contentType: 'url', url: trimmed }));
    } else {
      setConfig((prev) => ({ ...prev, contentType: 'text', text: trimmed }));
    }
    setWizardStep(3);
    setCurrentView('studio');
    try {
      window.history.pushState({}, '', '/studio');
    } catch {}
  };

  const baseTypeInfo = CONTENT_TYPE_INFO[config.contentType] || CONTENT_TYPE_INFO.url;
  const quickDef = config.contentType === 'quicklink' ? QUICKLINK_DEFS[(config.quicklink ?? DEFAULT_QUICKLINK).kind] : null;
  const quickUi = quickDef ? QUICKLINK_UI[quickDef.kind] : null;
  const pageKindDef = config.contentType === 'page' ? PAGE_KINDS[(config.page ?? createPage('card')).kind] : null;
  const currentTypeInfo = pageKindDef ? { ...baseTypeInfo, title: pageKindDef.title, description: pageKindDef.description }
    : quickDef && quickUi
    ? { ...baseTypeInfo, title: quickDef.title, description: quickUi.description, icon: quickUi.icon, iconBg: quickUi.iconBg, iconColor: quickUi.iconColor }
    : baseTypeInfo;
  const TypeIcon = currentTypeInfo.icon;
  const detailsValid = (() => {
    switch (config.contentType) {
      case 'url': return Boolean(config.url?.trim());
      case 'text': return Boolean(config.text?.trim());
      case 'page': return pageHasContent(config.page);
      case 'quicklink': return quickLinkHasValue(config.quicklink ?? DEFAULT_QUICKLINK);
      case 'email': return Boolean(config.email?.email?.trim());
      case 'phone': return Boolean(config.phone?.trim());
      case 'wifi': return Boolean(config.wifi?.ssid?.trim());
      default: return true;
    }
  })();

  // Shared file pages are standalone: no studio navbar / footer / floating widgets
  const isStandaloneView = currentView === 'file-view' || currentView === 'page-view';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Header Navbar */}
{!isStandaloneView && (
      <Navbar
        currentView={currentView}
        onNavigateHome={() => navigateTo('home')}
        onNavigateChooseType={() => navigateTo('choose-type')}
        onNavigateStudio={() => navigateTo('studio')}
        onNavigateMyCodes={() => navigateTo('my-codes')}
        onNavigateView={navigateTo}
        onStartNew={handleStartNew}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onQuickExport={() => {
          if (currentView !== 'studio') {
            setCurrentView('studio');
            setTimeout(() => {
              const downloadBtn = document.querySelector('button[title="Download PNG"]') as HTMLButtonElement;
              downloadBtn?.click();
            }, 250);
          } else {
            const downloadBtn = document.querySelector('button[title="Download PNG"]') as HTMLButtonElement;
            downloadBtn?.click();
          }
        }}
        historyCount={savedItems.length}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onOpenAIChat={handleOpenAIChat}
      />
)}

      {/* Dynamic View Router */}
      {currentView === 'home' ? (
        <React.Suspense fallback={<div className="flex-1 flex items-center justify-center p-12 text-slate-400">Loading...</div>}>
          <HomePage
            onStartNew={handleStartNew}
            onContinue={handleContinue}
            onSelectType={handleSelectType}
            onOpenTemplates={() => setIsTemplatesOpen(true)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onLoadItem={handleLoadItem}
            savedItems={savedItems}
            currentConfig={config}
          />
        </React.Suspense>
      ) : currentView === 'choose-type' ? (
        <React.Suspense fallback={<div className="flex-1 flex items-center justify-center p-12 text-slate-400">Loading...</div>}>
          <ChooseTypePage
            onSelectType={handleSelectType}
            onBackToHome={() => setCurrentView('home')}
          />
        </React.Suspense>
      ) : currentView === 'barcode' ? (
        <React.Suspense fallback={<div className="flex-1 flex items-center justify-center p-12 text-slate-400">Loading...</div>}>
          <BarcodePage onGoToStudio={() => navigateTo('studio')} />
        </React.Suspense>
      ) : currentView === 'pricing' ? (
        <React.Suspense fallback={<div className="flex-1 flex items-center justify-center p-12 text-slate-400">Loading...</div>}>
          <PricingPage onGoToStudio={() => navigateTo('studio')} />
        </React.Suspense>
      ) : currentView === 'support' ? (
        <React.Suspense fallback={<div className="flex-1 flex items-center justify-center p-12 text-slate-400">Loading...</div>}>
          <SupportPage />
        </React.Suspense>
      ) : currentView === 'my-codes' ? (
        <React.Suspense fallback={<div className="flex-1 flex items-center justify-center p-12 text-slate-400">Loading...</div>}>
          <MyQRCodesPage
            savedItems={savedItems}
            userFiles={userFiles}
            onSelectQR={handleLoadItem}
            onDeleteQR={handleDeleteItem}
            onDeleteFile={handleDeleteUserFile}
            onSelectFileAsQR={handleSelectFileAsQR}
            onCreateNewQR={handleStartNew}
            onBackToStudio={() => setCurrentView('studio')}
            user={user}
            onSyncToCloud={user ? handleSyncLocalToCloud : undefined}
            onOpenAuthModal={openAuthModal}
            onUpdateMeta={handleUpdateMeta}
          />
        </React.Suspense>
      ) : currentView === 'page-view' ? (
        <React.Suspense fallback={<div className="flex-1 flex items-center justify-center p-12 text-slate-400">Loading...</div>}>
          <PagePublicView pageId={viewFileId || ''} onCreateNewQR={() => { handleStartNew(); }} />
        </React.Suspense>
      ) : currentView === 'file-view' ? (
        <React.Suspense fallback={<div className="flex-1 flex items-center justify-center p-12 text-slate-400">Loading...</div>}>
          <PublicFileView
            fileId={viewFileId || ''}
            onGoToStudio={() => setCurrentView('studio')}
            onCreateNewQR={handleStartNew}
          />
        </React.Suspense>
      ) : currentView === 'expired' ? (
        <React.Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading notice...</div>}>
          <ExpiredNoticeView
            message={new URLSearchParams(window.location.search).get('msg') || new URLSearchParams(window.location.search).get('message') || undefined}
            expiredDateFormatted={new URLSearchParams(window.location.search).get('date') ? (() => {
              try {
                return new Date(new URLSearchParams(window.location.search).get('date')!).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
              } catch {
                return new URLSearchParams(window.location.search).get('date') || undefined;
              }
            })() : undefined}
            onGoToStudio={() => {
              setCurrentView('studio');
              window.history.pushState(null, '', '/studio');
            }}
            onCreateNew={handleStartNew}
          />
        </React.Suspense>
      ) : (
        /* Main Studio Area */
        <main className="flex-1 mx-auto w-full max-w-7xl px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-6">
          {/* Wizard progress stepper */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 px-3 py-3 sm:px-5 shadow-2xs mb-3 sm:mb-5">
            <ol className="flex items-center justify-between gap-1" aria-label="Create QR steps">
              {([
                { n: 1, label: 'Type' },
                { n: 2, label: 'Name' },
                { n: 3, label: 'Details' },
                { n: 4, label: 'Design & Save' },
              ] as const).map((st, idx) => {
                const done = st.n < wizardStep || st.n === 1;
                const active = st.n === wizardStep;
                const reachable = st.n === 1 || st.n <= wizardStep || (st.n === 3 && true);
                return (
                  <React.Fragment key={st.n}>
                    {idx > 0 && (
                      <li aria-hidden className={`h-0.5 flex-1 rounded-full ${st.n <= wizardStep ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    )}
                    <li className="shrink-0">
                      <button
                        type="button"
                        id={`wizard-step-${st.n}`}
                        disabled={!reachable}
                        onClick={() => (st.n === 1 ? navigateTo('choose-type') : goToStep(st.n as 2 | 3 | 4))}
                        className="flex items-center gap-1.5 cursor-pointer disabled:cursor-default"
                        aria-current={active ? 'step' : undefined}
                      >
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold transition-colors ${
                          active ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                          : done ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                        }`}>
                          {done && !active ? <Check className="h-3.5 w-3.5" /> : st.n}
                        </span>
                        <span className={`${active ? 'inline' : 'hidden'} sm:inline text-[11px] sm:text-xs font-bold whitespace-nowrap ${active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                          {st.label}
                        </span>
                      </button>
                    </li>
                  </React.Fragment>
                );
              })}
            </ol>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
          {/* Left Column: Creator & Customizer (7 cols) */}
          <div className={`lg:col-span-7 space-y-4 sm:space-y-6 ${mobileStudioTab === 'edit' ? 'block' : 'hidden lg:block'}`}>
            {/* Chosen type chip (always visible) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${currentTypeInfo.iconBg} ${currentTypeInfo.iconColor}`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Step 1 · Type</div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">{currentTypeInfo.title}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  id="wizard-change-type"
                  onClick={() => navigateTo('choose-type')}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Change</span>
                </button>
              </div>
            </div>

            {/* STEP 2: NAME + TITLE */}
            {wizardStep === 2 && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">Name your QR code</h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Give it a name for your library and a short title shown above the code.</p>
                </div>
                <div>
                  <label htmlFor="qr-name-input-step2" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">QR name <span className="font-normal text-slate-400">(only you see this)</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Tag className="h-4 w-4" /></div>
                    <input
                      type="text"
                      id="qr-name-input-step2"
                      value={config.name ?? ''}
                      onChange={(e) => updateConfig({ name: e.target.value })}
                      placeholder="e.g. Summer Menu 2026"
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="qr-title-input-step2" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Title on the QR frame <span className="font-normal text-slate-400">(people see this)</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Edit3 className="h-4 w-4" /></div>
                    <input
                      type="text"
                      id="qr-title-input-step2"
                      maxLength={40}
                      value={config.frame.title ?? ''}
                      onChange={(e) => updateConfig({ frame: { ...config.frame, title: e.target.value } })}
                      placeholder="e.g. SCAN ME"
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div>
                    <label htmlFor="qr-folder-input" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Folder <span className="font-normal text-slate-400">(optional)</span></label>
                    <input
                      type="text"
                      id="qr-folder-input"
                      list="qr-folder-list"
                      maxLength={40}
                      value={config.folder ?? ''}
                      onChange={(e) => updateConfig({ folder: e.target.value })}
                      placeholder="e.g. Diwali Campaign"
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                    <datalist id="qr-folder-list">{Array.from(new Set(savedItems.map((i) => i.folder).filter(Boolean) as string[])).map((f) => <option key={f} value={f} />)}</datalist>
                  </div>
                  <div>
                    <label htmlFor="qr-tags-input" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Tags <span className="font-normal text-slate-400">(comma separated)</span></label>
                    <input
                      type="text"
                      id="qr-tags-input"
                      defaultValue={(config.tags ?? []).join(', ')}
                      onBlur={(e) => updateConfig({ tags: Array.from(new Set(e.target.value.split(',').map((t) => t.trim().replace(/^#/, '').slice(0, 24)).filter(Boolean))).slice(0, 8) })}
                      placeholder="e.g. flyer, instagram"
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: DETAILS */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">Add the details</h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Tell us what the QR code should open or contain.</p>
                </div>
                <ContentInputs config={config} onChange={updateConfig} onOpenAIChat={handleOpenAIChat} />
              </div>
            )}

            {/* STEP 4: DESIGN */}
            {wizardStep === 4 && (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">Design &amp; save</h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Style it, then save it to your account or download it.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTemplatesOpen(true)}
                    aria-label="Templates"
                    className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-amber-200/80 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Templates</span>
                  </button>
                </div>
                <BrandKitPanel config={config} onApply={(next) => setConfig(next)} />
                <DesignCustomizer config={config} onChange={updateConfig} />
              </div>
            )}

            {/* SAVE / DOWNLOAD */}
            {wizardStep === 4 && (<>
            <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 p-4 sm:p-5 shadow-xs transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Step 4 • Save / Download
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    Ready
                  </span>
                </div>
              </div>

              {!user && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                  <LogIn className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>Sign in to save this QR to your account{config.contentType === 'file' || config.dynamic?.isDynamic ? ' — file and dynamic QR codes only work once saved' : ''}. You can still download it for free.</span>
                </div>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Export your QR code in high-resolution raster, vector SVG for print, or save securely to your cloud library.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Download PNG */}
                <button
                  type="button"
                  onClick={() => {
                    const btn = document.getElementById('qr-btn-download-png');
                    if (btn) btn.click();
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white px-4 py-3 text-xs sm:text-sm font-bold shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PNG (HD)</span>
                </button>

                {/* Save to Cloud/Library */}
                <button
                  type="button"
                  onClick={triggerSaveQR}
                  disabled={isSavingQR}
                  className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 active:scale-[0.98] text-indigo-700 dark:text-indigo-300 px-4 py-3 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaveSuccess ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Saved!</span>
                    </>
                  ) : isSavingQR ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                      <span>Saving QR...</span>
                    </>
                  ) : (
                    <>
                      {user ? <BookmarkPlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> : <LogIn className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                      <span>{user ? 'Save to my account' : 'Sign in to save'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {/* Vector SVG */}
                <button
                  type="button"
                  onClick={() => {
                    const btn = document.getElementById('qr-btn-download-svg');
                    if (btn) btn.click();
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 px-2 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Vector SVG</span>
                </button>

                {/* Copy Image */}
                <button
                  type="button"
                  onClick={() => {
                    const btn = document.getElementById('qr-btn-copy-image');
                    if (btn) btn.click();
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 px-2 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Copy Image</span>
                </button>

                {/* Print */}
                <button
                  type="button"
                  onClick={() => {
                    const btn = document.getElementById('qr-btn-print');
                    if (btn) btn.click();
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 px-2 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Print Direct</span>
                </button>
              </div>
            </div>

            {/* Pro Print & Scanning Tips Footer Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 mt-0.5">
                  <Printer className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Professional Printing & Scanning Guidelines
                  </h4>
                  <ul className="mt-1.5 space-y-1 text-xs text-slate-500 dark:text-slate-400 list-disc list-inside">
                    <li>
                      <strong>Size:</strong> Minimum 2 x 2 cm (0.8 x 0.8 in) for standard smartphone cameras.
                    </li>
                    <li>
                      <strong>High Contrast:</strong> Always keep QR dots distinctly darker than the background (or dark mode inverted).
                    </li>
                    <li>
                      <strong>Logos:</strong> Error Correction Level &quot;H&quot; (30% recovery) is automatically enforced when logos are applied.
                    </li>
                    <li>
                      <strong>Vector SVG:</strong> Use the SVG export for billboards, vinyl wraps, packaging, Figma, and Illustrator without pixelation.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

</>)}

            {/* Wizard navigation */}
            <div className="sticky bottom-[4.75rem] lg:bottom-4 z-20 flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur p-2.5 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/95">
              <button
                type="button"
                id="wizard-back"
                onClick={() => (wizardStep === 2 ? navigateTo('choose-type') : goToStep((wizardStep - 1) as 2 | 3))}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              {wizardStep < 4 ? (
                <button
                  type="button"
                  id="wizard-next"
                  disabled={wizardStep === 3 && !detailsValid}
                  onClick={() => goToStep((wizardStep + 1) as 3 | 4)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-sm font-extrabold text-white shadow-sm shadow-indigo-600/30 cursor-pointer"
                >
                  <span>{wizardStep === 2 ? 'Continue' : detailsValid ? 'Continue to design' : 'Fill in the details to continue'}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  id="wizard-save"
                  onClick={triggerSaveQR}
                  disabled={isSavingQR}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-3 text-sm font-extrabold text-white shadow-sm shadow-indigo-600/30 cursor-pointer"
                >
                  {isSaveSuccess ? <Check className="h-4 w-4" /> : user ? <BookmarkPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  <span>{isSaveSuccess ? 'Saved!' : user ? 'Save QR' : 'Sign in to save'}</span>
                </button>
              )}
            </div>

            {/* Mobile Floating Preview Button */}
            <div className={`lg:hidden fixed bottom-[9.5rem] right-3 z-30 ${wizardStep === 2 ? 'hidden' : ''}`}>
              <button
                type="button"
                onClick={() => setMobileStudioTab('preview')}
                className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/40 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer ring-4 ring-white dark:ring-slate-900"
              >
                <Eye className="h-4 w-4" />
                <span>Preview QR</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Framed QR Preview (5 cols) */}
          <div className={`lg:col-span-5 ${mobileStudioTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
            {/* Mobile Return to Edit Button */}
            <div className="lg:hidden mb-3">
              <button
                type="button"
                onClick={() => setMobileStudioTab('edit')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/60"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>← Back to Customize & Content</span>
              </button>
            </div>

            <QRPreviewCard
              config={config}
              onSaveToHistory={handleSaveToHistory}
              onDownloadSuccess={() => setIsSuccessModalOpen(true)}
              onStartNew={handleStartNew}
              isCloudUser={Boolean(user)}
              onRequireSignIn={openAuthModal}
              onBatchSave={handleBatchSave}
            />
          </div>
        </div>
      </main>
      )}

      {/* Footer */}
{!isStandaloneView && (
      <Footer onNavigate={navigateTo} onOpenScanner={() => setIsScannerOpen(true)} />
)}

      {/* Download / Save Success Modal */}
      {isSuccessModalOpen && (
        <React.Suspense fallback={null}>
          <DownloadSuccessModal
            isOpen={isSuccessModalOpen}
            onClose={() => setIsSuccessModalOpen(false)}
            qrName={config.frame.title || `${config.contentType.toUpperCase()} QR Code`}
            qrUrl={
              config.contentType === 'file' && config.file
                ? (config.file.customSlug
                    ? `${window.location.origin}/${config.file.customSlug}`
                    : getFileViewerUrl(config.file.id))
                : config.contentType === 'url'
                ? (config.dynamic?.isDynamic && config.dynamic?.customSlug
                    ? `${window.location.origin}/${config.dynamic.customSlug}`
                    : config.url)
                : config.dynamic?.isDynamic && config.dynamic?.customSlug
                ? `${window.location.origin}/${config.dynamic.customSlug}`
                : undefined
            }
            onRestartNewQR={handleStartNew}
            onGoToMyQRCodes={() => setCurrentView('my-codes')}
          />
        </React.Suspense>
      )}

      {/* Modals & Drawers */}
      {isTemplatesOpen && (
        <React.Suspense fallback={null}>
          <TemplateModal
            isOpen={isTemplatesOpen}
            onClose={() => setIsTemplatesOpen(false)}
            onApplyTemplate={handleApplyTemplate}
          />
        </React.Suspense>
      )}

      {isScannerOpen && (
        <React.Suspense fallback={null}>
          <ScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onLoadDecodedToEditor={handleLoadScannedData}
          />
        </React.Suspense>
      )}

      {isHistoryOpen && (
        <React.Suspense fallback={null}>
          <HistoryDrawer
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            savedItems={savedItems}
            onLoadItem={handleLoadItem}
            onDeleteItem={handleDeleteItem}
            onClearAll={handleClearAll}
            onSyncLocalToCloud={user ? handleSyncLocalToCloud : undefined}
          />
        </React.Suspense>
      )}

      {/* Firebase Google / Apple Auth Modal */}
      <React.Suspense fallback={null}>
        <AuthModal />
      </React.Suspense>

      {/* Floating AI & Maps Assistant Button */}
{!isStandaloneView && (
      <button
        type="button"
        onClick={() => handleOpenAIChat('consultant')}
        className={`${currentView === 'studio' ? 'max-lg:hidden' : ''} fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-3.5 py-2.5 text-white font-extrabold text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer ring-2 ring-white/40 dark:ring-indigo-500/40 group`}
        title="Open MakeQR AI Assistant & Google Maps Explorer"
      >
        <div className="relative flex h-6 w-6 items-center justify-center rounded-xl bg-white/20">
          <Sparkles className="h-3.5 w-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
        </div>
        <div className="text-left hidden xs:block">
          <div className="flex items-center gap-1.5 leading-none">
            <span>AI &amp; Maps</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          </div>
          <span className="text-[9px] font-medium text-indigo-200 block mt-0.5 leading-none">Gemini Grounded</span>
        </div>
      </button>
)}

      {/* Gemini AI Multi-turn Chat & Maps Grounding Modal */}
      <AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        onApplyPlaceToQR={handleApplyPlaceToQR}
        initialRole={aiChatRole}
        initialQuery={aiChatQuery}
      />

      {/* Mobile App Bottom Navigation Bar */}
{!isStandaloneView && (
      <MobileBottomNav
        currentView={currentView}
        onNavigateHome={() => navigateTo('home')}
        onNavigateChooseType={() => navigateTo('choose-type')}
        onNavigateStudio={() => {
          navigateTo('studio');
          setMobileStudioTab('edit');
        }}
        onNavigateMyCodes={() => navigateTo('my-codes')}
        onOpenScanner={() => setIsScannerOpen(true)}
        onNavigateView={navigateTo}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenAIChat={() => handleOpenAIChat('consultant')}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        historyCount={savedItems.length}
      />
)}
    </div>
  );
}

export default function App() {
  // Remember a friend's invite link (?ref=CODE) until they sign in
  React.useMemo(() => { capturePendingRef(); }, []);
  return (
    <AuthProvider>
      <CoinsProvider>
        <MainApp />
        <React.Suspense fallback={null}>
          <CoinsModal />
        </React.Suspense>
        <CoinRewardToast />
        <ReferralPrompt />
      </CoinsProvider>
    </AuthProvider>
  );
}
