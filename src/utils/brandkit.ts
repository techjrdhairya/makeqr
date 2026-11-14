import type { QRConfig } from '../types';

export interface BrandKit {
  id: string;
  name: string;
  isDefault?: boolean;
  colors: QRConfig['colors'];
  shapes: QRConfig['shapes'];
  logo: QRConfig['logo'];
  errorCorrectionLevel: QRConfig['errorCorrectionLevel'];
  frame: { style: QRConfig['frame']['style']; frameColor: string; textColor: string; badgeColor: string };
}

const KEY = 'makeqr_brandkits_v1';
export const MAX_KITS = 6;

export function loadKits(): BrandKit[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

/** Returns false when the browser refuses to store (private mode / quota). */
export function saveKits(kits: BrandKit[]): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(kits)); return true; } catch { return false; }
}

export function kitFromConfig(name: string, c: QRConfig): BrandKit {
  return {
    id: `kit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || 'My brand',
    colors: JSON.parse(JSON.stringify(c.colors)),
    shapes: JSON.parse(JSON.stringify(c.shapes)),
    logo: JSON.parse(JSON.stringify(c.logo)),
    errorCorrectionLevel: c.errorCorrectionLevel,
    frame: { style: c.frame.style, frameColor: c.frame.frameColor, textColor: c.frame.textColor, badgeColor: c.frame.badgeColor },
  };
}

/** Applies a kit's look to a config, leaving content, title and subtitle alone. */
export function applyKit(c: QRConfig, kit: BrandKit): QRConfig {
  return {
    ...c,
    colors: JSON.parse(JSON.stringify(kit.colors)),
    shapes: JSON.parse(JSON.stringify(kit.shapes)),
    logo: JSON.parse(JSON.stringify(kit.logo)),
    errorCorrectionLevel: kit.errorCorrectionLevel,
    frame: { ...c.frame, ...kit.frame },
  };
}
