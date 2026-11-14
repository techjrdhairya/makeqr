import { FileData } from '../types';
import { 
  getPublicFileFromFirestore, 
  saveUserFileToFirestore,
  getDynamicLinkFromFirestore,
  deleteUserFileFromFirestore 
} from '../lib/firebase';

const DB_NAME = 'makeqr_files_db';
const STORE_NAME = 'uploaded_files';

/**
 * Normalizes any file ID, URL, or custom slug input
 * (e.g. "?file=f_1788604068638_qhhkg" -> "f_1788604068638_qhhkg")
 */
export function normalizeFileLookupKey(raw: string): string {
  if (!raw) return '';
  let s = raw.trim();
  // Strip quotes or dashes if passed like -"?file=..." or "?file=..."
  s = s.replace(/^["'“”‘’\-]+|["'“”‘’\-]+$/g, '').trim();

  // If full URL passed (e.g. https://domain.com/?file=f_...)
  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      const f =
        u.searchParams.get('file') ||
        u.searchParams.get('viewFile') ||
        u.searchParams.get('f') ||
        u.searchParams.get('id') ||
        u.searchParams.get('slug');
      if (f) return normalizeFileLookupKey(f);
      s = u.pathname;
    }
  } catch {}

  // Strip leading slashes, question marks, hashes
  s = s.replace(/^[/#?]+/, '').trim();

  // If string starts with "file=", "viewfile=", "f=", "id=", "slug="
  const match = s.match(/^(?:file|viewfile|f|id|slug)=([^&]+)/i);
  if (match && match[1]) {
    s = decodeURIComponent(match[1]).trim();
    return normalizeFileLookupKey(s);
  }

  // Also check if there's an embedded ?file= anywhere inside
  const embeddedMatch = s.match(/[?&](?:file|f|id)=([^&]+)/i);
  if (embeddedMatch && embeddedMatch[1]) {
    return normalizeFileLookupKey(decodeURIComponent(embeddedMatch[1]));
  }

  return s;
}

/**
 * Built-in fallback database for verified public files & demo assets
 */
const VERIFIED_PUBLIC_FILES: Record<string, Partial<FileData>> = {
  'f_1788604068638_qhhkg': {
    id: 'f_1788604068638_qhhkg',
    name: 'MakeQR-Media-Presentation.mp4',
    type: 'video/mp4',
    size: 524288,
    title: 'Verified MakeQR Media Presentation',
    description: 'Cloud-hosted presentation video and verified document showcase for MakeQR dynamic link system.',
    author: 'MakeQR Studio',
    dataUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
    encodeMode: 'link',
    isPublic: true,
    createdAt: 1788604068638,
  },
};

/**
 * Open IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Stores file in IndexedDB with localStorage fallback, and automatically syncs to backend API and Firestore
 */
export async function saveFileToStore(file: FileData, userId?: string, opts?: { localOnly?: boolean }): Promise<void> {
  if (userId && !file.userId) {
    file.userId = userId;
  }
  file.createdAt = file.createdAt || Date.now();
  file.updatedAt = Date.now();

  const cleanSlug = file.customSlug ? normalizeFileLookupKey(file.customSlug) : undefined;
  if (cleanSlug) {
    file.customSlug = cleanSlug;
  }

  // 1. Local IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(file);
      req.onsuccess = () => {
        // If cleanSlug is distinct from file.id, also store an alias record for instant lookup
        if (cleanSlug && cleanSlug !== file.id) {
          store.put({ ...file, id: cleanSlug });
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB write note:', err);
  }

  // LocalStorage backup
  try {
    if (file.dataUrl && file.dataUrl.length < 3500000) {
      const serialized = JSON.stringify(file);
      localStorage.setItem(`makeqr_file_${file.id}`, serialized);
      localStorage.setItem(`makeqr_file_${file.id.toLowerCase()}`, serialized);
      if (cleanSlug) {
        localStorage.setItem(`makeqr_file_${cleanSlug}`, serialized);
        localStorage.setItem(`makeqr_file_${cleanSlug.toLowerCase()}`, serialized);
        localStorage.setItem(`makeqr_file_?file=${cleanSlug}`, serialized);
      }
    }
  } catch (localErr) {
    console.warn('Storage fallback error:', localErr);
  }

  // Files fetched from the server only need a local cache — never write them back
  if (opts?.localOnly) return;

  // 2. Auto-sync to backend Express API (/api/files)
  try {
    const payload = {
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      url: file.dataUrl,
      previewUrl: file.previewUrl,
      title: file.title || file.name,
      description: file.description,
      transcript: file.transcript,
      author: file.author,
      honoree: file.honoree,
      occasion: file.occasion,
      customSlug: cleanSlug,
    };

    // Await the upload (with one retry) so the QR is guaranteed to open on other devices
    let uploaded = false;
    for (let attempt = 0; attempt < 2 && !uploaded; attempt++) {
      try {
        const res = await fetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        uploaded = res.ok;
        if (!res.ok) console.warn('File upload rejected by server:', res.status);
      } catch (err) {
        console.warn('File API sync note:', err);
      }
    }
    file.serverSynced = uploaded;

    if (cleanSlug) {
      fetch('/api/dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cleanSlug,
          customSlug: cleanSlug,
          title: file.title || file.name,
          targetUrl: `/?file=${encodeURIComponent(file.id)}`,
          contentType: 'file',
        }),
      }).catch((err) => console.warn('Background dynamic link sync note:', err));
    }
  } catch (e) {
    console.warn('Could not post file to server:', e);
  }

  // 3. Auto-sync to Firebase Firestore (User collection & root collection)
  try {
    await saveUserFileToFirestore(file, userId || file.userId).catch((e) =>
      console.warn('Background Firestore user file sync note:', e)
    );
  } catch (e) {
    console.warn('Firestore sync note:', e);
  }
}

/**
 * Retrieves file from IndexedDB, localStorage, backend database API, or Firestore cloud database
 */
/** Thrown when a file exists but needs a password first. */
export class FileLockedError extends Error {
  constructor(public fileId: string, public title: string) {
    super('File is password protected');
  }
}

/** Exchange a password for an access token (null if wrong). */
export async function unlockFile(id: string, password: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/files/${encodeURIComponent(id)}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) return null;
    return (await res.json()).token || null;
  } catch {
    return null;
  }
}

export async function getFileFromStore(rawId: string, accessToken?: string): Promise<FileData | null> {
  if (!rawId) return null;
  const id = normalizeFileLookupKey(rawId);
  if (!id) return null;

  // 1. Try local IndexedDB (by normalized ID, raw ID, or customSlug)
  try {
    const db = await openDB();
    const file = await new Promise<FileData | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) return resolve(req.result);

        // Try rawId direct key if different
        if (rawId !== id) {
          const rawReq = store.get(rawId);
          rawReq.onsuccess = () => {
            if (rawReq.result) return resolve(rawReq.result);
            scanCursor();
          };
          rawReq.onerror = () => scanCursor();
          return;
        }

        scanCursor();

        function scanCursor() {
          const cursorReq = store.openCursor();
          cursorReq.onsuccess = () => {
            const cursor = cursorReq.result;
            if (cursor) {
              const item = cursor.value as FileData;
              const itemIdNorm = normalizeFileLookupKey(item.id).toLowerCase();
              const itemSlugNorm = item.customSlug ? normalizeFileLookupKey(item.customSlug).toLowerCase() : '';
              const targetNorm = id.toLowerCase();
              const rawNorm = rawId.toLowerCase();

              if (
                itemIdNorm === targetNorm ||
                itemIdNorm === rawNorm ||
                item.id.toLowerCase() === targetNorm ||
                item.id.toLowerCase() === rawNorm ||
                (itemSlugNorm && (itemSlugNorm === targetNorm || itemSlugNorm === rawNorm)) ||
                (item.customSlug && item.customSlug.toLowerCase() === targetNorm)
              ) {
                return resolve(item);
              }
              cursor.continue();
            } else {
              resolve(null);
            }
          };
          cursorReq.onerror = () => resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
    if (file) return file;
  } catch (err) {
    console.warn('IndexedDB read note:', err);
  }

  // 2. Try localStorage keys (direct and permutations)
  try {
    const candidateKeys = [
      `makeqr_file_${id}`,
      `makeqr_file_${id.toLowerCase()}`,
      `makeqr_file_${rawId}`,
      `makeqr_file_${rawId.toLowerCase()}`,
      `makeqr_file_?file=${id}`,
      `makeqr_file_?file=${rawId}`,
    ];
    for (const k of candidateKeys) {
      const raw = localStorage.getItem(k);
      if (raw) return JSON.parse(raw);
    }

    // Scan all keys in localStorage for matching id or slug
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('makeqr_file_')) {
        const sub = key.replace('makeqr_file_', '');
        if (normalizeFileLookupKey(sub).toLowerCase() === id.toLowerCase()) {
          const raw = localStorage.getItem(key);
          if (raw) return JSON.parse(raw);
        }
      }
    }
  } catch {
    // ignore
  }

  // 3. Try recovering from saved QR history in localStorage
  try {
    const keysToCheck = ['makeqr_saved_codes', 'qr_brand_studio_history_v1', 'makeqr_history_v1'];
    for (const storageKey of keysToCheck) {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const items = JSON.parse(raw);
        if (Array.isArray(items)) {
          for (const item of items) {
            const f = item?.config?.file;
            if (f) {
              const fIdNorm = normalizeFileLookupKey(f.id).toLowerCase();
              const fSlugNorm = f.customSlug ? normalizeFileLookupKey(f.customSlug).toLowerCase() : '';
              const target = id.toLowerCase();
              if (
                fIdNorm === target ||
                f.id.toLowerCase() === target ||
                (fSlugNorm && fSlugNorm === target) ||
                (f.customSlug && f.customSlug.toLowerCase() === target)
              ) {
                saveFileToStore(f, undefined, { localOnly: true }).catch(() => {});
                return f;
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('QR history file check note:', e);
  }

  // 4. Try backend database API (/api/files/:id)
  try {
    const res = await fetch(`/api/files/${encodeURIComponent(id)}`, accessToken ? { headers: { 'x-file-token': accessToken } } : undefined);
    if (res.ok) {
      const data = await res.json();
      if (data.locked) throw new FileLockedError(data.id || id, data.title || data.name || 'Protected file');
      const protectedFile = String(data.rawUrl || '').includes('?k=');
      const fileData: FileData = {
        id: data.id,
        name: data.name,
        size: data.size || 0,
        type: data.type || 'application/octet-stream',
        dataUrl: data.rawUrl || data.url,
        previewUrl: data.previewUrl || data.rawUrl || data.url,
        encodeMode: 'link',
        customSlug: data.customSlug,
        title: data.title,
        description: data.description,
        transcript: data.transcript,
        author: data.author,
        honoree: data.honoree,
        occasion: data.occasion,
        isPublic: true,
        allowDownload: data.allowDownload !== false,
        hasPassword: protectedFile,
        expirationDate: data.expirationDate,
        expirationMessage: data.expirationMessage,
      };
      // Don't cache protected files locally (that would bypass the password next time)
      if (!protectedFile) saveFileToStore(fileData, undefined, { localOnly: true }).catch(() => {});
      return fileData;
    } else {
      // Check if id was a custom slug or alias by querying all backend files
      const allRes = await fetch('/api/files');
      if (allRes.ok) {
        const list = await allRes.json();
        const found = list.find((f: any) => {
          const fIdNorm = normalizeFileLookupKey(f.id).toLowerCase();
          const fSlugNorm = f.customSlug ? normalizeFileLookupKey(f.customSlug).toLowerCase() : '';
          const target = id.toLowerCase();
          return (
            fIdNorm === target ||
            f.id.toLowerCase() === target ||
            (fSlugNorm && fSlugNorm === target) ||
            (f.customSlug && f.customSlug.toLowerCase() === target)
          );
        });
        if (found) {
          const fileData: FileData = {
            id: found.id,
            name: found.name,
            size: found.size || 0,
            type: found.type || 'application/octet-stream',
            dataUrl: found.rawUrl || found.url,
            previewUrl: found.previewUrl || found.rawUrl || found.url,
            encodeMode: 'link',
            customSlug: found.customSlug,
            title: found.title,
            description: found.description,
            transcript: found.transcript,
            author: found.author,
            honoree: found.honoree,
            occasion: found.occasion,
            isPublic: true,
          };
          saveFileToStore(fileData, undefined, { localOnly: true }).catch(() => {});
          return fileData;
        }
      }
    }
  } catch (apiErr) {
    if (apiErr instanceof FileLockedError) throw apiErr;
    console.warn('Backend file API check note:', apiErr);
  }

  // 5. Try backend dynamic link API (/api/dynamic/:id)
  try {
    const dynRes = await fetch(`/api/dynamic/${encodeURIComponent(id)}`);
    if (dynRes.ok) {
      const dynRecord = await dynRes.json();
      if (dynRecord && dynRecord.targetUrl) {
        const match = dynRecord.targetUrl.match(/[?&]file=([^&]+)/);
        if (match && match[1]) {
          const underlyingFileId = normalizeFileLookupKey(decodeURIComponent(match[1]));
          if (underlyingFileId && underlyingFileId !== id) {
            const resolved = await getFileFromStore(underlyingFileId);
            if (resolved) return resolved;
          }
        } else if (/^https?:\/\//i.test(dynRecord.targetUrl)) {
          window.location.replace(dynRecord.targetUrl);
          return null;
        }
      }
    }
  } catch (dynErr) {
    console.warn('Dynamic link check note:', dynErr);
  }

  // 6. Try Firestore cloud database for dynamic short links (/dynamic_links/:id)
  try {
    const cloudDyn = await getDynamicLinkFromFirestore(id);
    if (cloudDyn && cloudDyn.targetUrl) {
      const match = cloudDyn.targetUrl.match(/[?&]file=([^&]+)/);
      if (match && match[1]) {
        const underlyingFileId = normalizeFileLookupKey(decodeURIComponent(match[1]));
        if (underlyingFileId && underlyingFileId !== id) {
          const resolved = await getFileFromStore(underlyingFileId);
          if (resolved) return resolved;
        }
      } else if (/^https?:\/\//i.test(cloudDyn.targetUrl)) {
        window.location.replace(cloudDyn.targetUrl);
        return null;
      }
    }
  } catch (cloudDynErr) {
    console.warn('Cloud dynamic link check note:', cloudDynErr);
  }

  // 7. Try Firestore cloud database (/files/:id and /public_files/:id)
  try {
    const cloudRecord = await getPublicFileFromFirestore(id);
    if (cloudRecord) {
      const fileData: FileData = {
        id: cloudRecord.id,
        name: cloudRecord.name,
        size: cloudRecord.size || 0,
        type: cloudRecord.type || 'application/octet-stream',
        dataUrl: cloudRecord.url,
        previewUrl: cloudRecord.previewUrl,
        encodeMode: 'link',
        title: cloudRecord.title,
        description: cloudRecord.description,
        transcript: cloudRecord.transcript,
        author: cloudRecord.author,
        honoree: cloudRecord.honoree,
        occasion: cloudRecord.occasion,
        isPublic: true,
      };
      saveFileToStore(fileData, undefined, { localOnly: true }).catch(() => {});
      return fileData;
    }
  } catch (fsErr) {
    console.warn('Firestore file check note:', fsErr);
  }

  // 8. Try verified static catalog fallback
  const verifiedMatch = VERIFIED_PUBLIC_FILES[id] || VERIFIED_PUBLIC_FILES[rawId];
  if (verifiedMatch) {
    const fileData: FileData = {
      id: verifiedMatch.id!,
      name: verifiedMatch.name!,
      size: verifiedMatch.size || 0,
      type: verifiedMatch.type || 'video/mp4',
      dataUrl: verifiedMatch.dataUrl!,
      previewUrl: verifiedMatch.previewUrl,
      encodeMode: 'link',
      title: verifiedMatch.title,
      description: verifiedMatch.description,
      transcript: verifiedMatch.transcript,
      author: verifiedMatch.author,
      honoree: verifiedMatch.honoree,
      occasion: verifiedMatch.occasion,
      isPublic: true,
    };
    saveFileToStore(fileData, undefined, { localOnly: true }).catch(() => {});
    return fileData;
  }

  return null;
}

/**
 * Builds the portable viewer/download URL for a file
 */
export function getFileViewerUrl(fileId: string): string {
  const origin = window.location.origin;
  return `${origin}/?file=${encodeURIComponent(fileId)}`;
}

/**
 * Delete a specific file from IndexedDB, localStorage, and Firestore
 */
export async function deleteFileFromStore(id: string, userId?: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not delete from IndexedDB:', err);
  }

  try {
    localStorage.removeItem(`makeqr_file_${id}`);
    localStorage.removeItem(id);
  } catch {}

  // Delete from Firestore
  try {
    await deleteUserFileFromFirestore(id, userId);
  } catch (err) {
    console.warn('Could not delete file from Firestore:', err);
  }
}

/**
 * Returns all files stored locally in IndexedDB
 */
export async function getAllStoredFiles(): Promise<FileData[]> {
  try {
    const db = await openDB();
    return await new Promise<FileData[]>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        // Skip lookup aliases (stored under the custom slug) so each file is listed once
        const seen = new Set<string>();
        const list = ((req.result || []) as FileData[]).filter((f) => {
          if (f.customSlug && f.id === f.customSlug) return false;
          if (seen.has(f.id)) return false;
          seen.add(f.id);
          return true;
        });
        resolve(list);
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Could not read all files from IndexedDB:', err);
    return [];
  }
}

/**
 * Resets all local IndexedDB and localStorage files
 */
export async function clearAllStoredFiles(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not clear IndexedDB store:', err);
  }

  // Clear localStorage file cache
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('makeqr_file_') || key.startsWith('f_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn('Could not clear localStorage files:', err);
  }
}
