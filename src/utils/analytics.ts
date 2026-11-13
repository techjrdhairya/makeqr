import { SavedQR, QRAnalyticsData } from '../types';
import { getQRAnalyticsFromFirestore } from '../lib/firebase';

/** Keys a QR's scans are recorded under on the server: its short-link slug and/or file id. */
export function getAnalyticsKeys(qr: SavedQR): string[] {
  const keys: string[] = [];
  const cfg = qr.config;
  if (!cfg) return keys;
  if (cfg.contentType === 'file' && cfg.file) {
    if (cfg.file.customSlug) keys.push(cfg.file.customSlug);
    keys.push(cfg.file.id);
  } else if (cfg.dynamic?.isDynamic) {
    const slug = cfg.dynamic.customSlug || cfg.dynamic.dynamicId;
    if (slug) keys.push(slug);
  }
  return Array.from(new Set(keys.map((k) => k.trim().toLowerCase()).filter(Boolean)));
}

/** Static URL/text QRs open their destination directly, so nothing can be counted. */
export function isTrackable(qr: SavedQR): boolean {
  return getAnalyticsKeys(qr).length > 0;
}

export async function fetchQRAnalytics(qr: SavedQR): Promise<QRAnalyticsData> {
  const empty: QRAnalyticsData = {
    qrId: qr.id,
    qrName: qr.name,
    scanCount: 0,
    lastScannedAt: null,
    locations: [],
    recentScans: [],
    devices: { mobile: 0, desktop: 0, tablet: 0 },
  };
  const keys = getAnalyticsKeys(qr);
  if (keys.length === 0) return empty;

  try {
    const res = await fetch(`/api/analytics?keys=${encodeURIComponent(keys.join(','))}`, { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      return { ...empty, ...d, qrId: qr.id, qrName: qr.name };
    }
  } catch {
    // server unreachable (e.g. static hosting) — fall through to Firestore
  }
  try {
    return await getQRAnalyticsFromFirestore(qr.id, qr.name, keys[0]);
  } catch {
    return empty;
  }
}
