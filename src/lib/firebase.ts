import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  updateDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SavedQR, FileData, QRAnalyticsData, QRScanLocation, QRScanEvent } from '../types';

// 1. Initialize Firebase App and Services
const app = initializeApp(firebaseConfig);

/* CRITICAL: The app will break without this exact line */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// 2. Validate Connection to Firestore at boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// 3. Error Handling adhering to FirestoreErrorInfo schema
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. User Profile synchronization & Coins Economy
export interface UserProfileData {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string;
  coins: number;
  unlockedFeatures: string[];
  guestTrialUsed: boolean;
  qrsCreated: number;
  createdAt: string;
  updatedAt: string;
  isNewAccount?: boolean;
}

export async function syncUserProfile(user: FirebaseUser, guestBonusCoins = 0): Promise<UserProfileData> {
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

  try {
    const existingSnap = await getDoc(userRef);
    if (existingSnap.exists()) {
      const data = existingSnap.data();
      const existingCoins = typeof data.coins === 'number' ? data.coins : 50;
      const guestBonusApplied = data.guestBonusApplied === true;
      const bonusToAdd = (!guestBonusApplied && guestBonusCoins > 0) ? guestBonusCoins : 0;
      const newCoins = existingCoins + bonusToAdd;
      const unlockedFeatures = Array.isArray(data.unlockedFeatures) ? data.unlockedFeatures : [];
      const guestTrialUsed = typeof data.guestTrialUsed === 'boolean' ? data.guestTrialUsed : false;
      const qrsCreated = typeof data.qrsCreated === 'number' ? data.qrsCreated : 0;

      const updatedPayload = {
        userId: user.uid,
        email: user.email || data.email || '',
        displayName: user.displayName || data.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || data.photoURL || '',
        coins: newCoins,
        unlockedFeatures,
        guestTrialUsed,
        qrsCreated,
        guestBonusApplied: true,
        updatedAt: now,
      };

      await setDoc(userRef, updatedPayload, { merge: true });
      return {
        ...updatedPayload,
        createdAt: data.createdAt || now,
        isNewAccount: false,
      };
    } else {
      // First-time sign-in bonus: 50 welcome coins!
      const initialCoins = 50 + guestBonusCoins;
      const initialPayload: UserProfileData = {
        userId: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || '',
        coins: initialCoins,
        unlockedFeatures: [],
        guestTrialUsed: false,
        qrsCreated: 0,
        createdAt: now,
        updatedAt: now,
        isNewAccount: true,
      };

      await setDoc(userRef, { ...initialPayload, guestBonusApplied: true });
      return initialPayload;
    }
  } catch (err) {
    console.warn('Could not sync user profile in cloud, using local fallback:', err);
    return {
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'User',
      photoURL: user.photoURL || '',
      coins: 50,
      unlockedFeatures: [],
      guestTrialUsed: false,
      qrsCreated: 0,
      createdAt: now,
      updatedAt: now,
      isNewAccount: false,
    };
  }
}

export async function awardUserCoinsInCloud(
  userId: string,
  amount: number,
  isQrCreation = false
): Promise<number> {
  const userRef = doc(db, 'users', userId);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentCoins = typeof data.coins === 'number' ? data.coins : 50;
      const currentQrs = typeof data.qrsCreated === 'number' ? data.qrsCreated : 0;
      const newCoins = Math.max(0, currentCoins + amount);
      const newQrs = isQrCreation ? currentQrs + 1 : currentQrs;

      await updateDoc(userRef, {
        coins: newCoins,
        ...(isQrCreation ? { qrsCreated: newQrs } : {}),
        updatedAt: new Date().toISOString(),
      });
      return newCoins;
    }
  } catch (err) {
    console.warn('Failed to update coins in cloud:', err);
  }
  return 50;
}

export async function unlockFeatureInCloud(
  userId: string,
  featureId: string,
  cost: number
): Promise<{ success: boolean; newCoins: number; unlockedFeatures: string[] }> {
  const userRef = doc(db, 'users', userId);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentCoins = typeof data.coins === 'number' ? data.coins : 50;
      const unlocked = Array.isArray(data.unlockedFeatures) ? [...data.unlockedFeatures] : [];

      if (!unlocked.includes(featureId)) {
        if (currentCoins < cost) {
          return { success: false, newCoins: currentCoins, unlockedFeatures: unlocked };
        }
        unlocked.push(featureId);
        const newCoins = currentCoins - cost;
        await updateDoc(userRef, {
          coins: newCoins,
          unlockedFeatures: unlocked,
          updatedAt: new Date().toISOString(),
        });
        return { success: true, newCoins, unlockedFeatures: unlocked };
      }
      return { success: true, newCoins: currentCoins, unlockedFeatures: unlocked };
    }
  } catch (err) {
    console.warn('Failed to unlock feature in cloud:', err);
  }
  return { success: false, newCoins: 0, unlockedFeatures: [] };
}

export async function recordGuestTrialUsedInCloud(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, {
      guestTrialUsed: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to record trial in cloud:', err);
  }
}

// 5. Auth Action Helpers
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  if (result.user) {
    await syncUserProfile(result.user);
  }
  return result.user;
}

export async function signInWithApple() {
  const result = await signInWithPopup(auth, appleProvider);
  if (result.user) {
    await syncUserProfile(result.user);
  }
  return result.user;
}

export async function initAnonymousAuth(): Promise<FirebaseUser | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (e) {
    console.warn('Anonymous auth note:', e);
    return null;
  }
}

export async function logOut() {
  await firebaseSignOut(auth);
}

// 6. QR Code Cloud Operations
export function sanitizeQRForFirestore(qr: SavedQR, userId: string): Record<string, any> {
  // Strip any undefined keys through clean JSON serialization
  const rawConfig = qr.config || ({} as any);
  const cleanConfig = JSON.parse(JSON.stringify(rawConfig));

  // If there's a file attached, protect against 1MB Firestore document limit
  if (cleanConfig.file) {
    cleanConfig.file = {
      id: cleanConfig.file.id || '',
      name: cleanConfig.file.name || 'file',
      size: cleanConfig.file.size || 0,
      type: cleanConfig.file.type || 'application/octet-stream',
      encodeMode: cleanConfig.file.encodeMode || 'link',
      customSlug: cleanConfig.file.customSlug || '',
      previewUrl: cleanConfig.file.previewUrl || '',
      title: cleanConfig.file.title || cleanConfig.file.name || '',
      description: cleanConfig.file.description || '',
      // Avoid storing multi-megabyte base64 video/audio in Firestore document:
      dataUrl:
        cleanConfig.file.dataUrl && cleanConfig.file.dataUrl.length < 50000
          ? cleanConfig.file.dataUrl
          : `/api/files/${encodeURIComponent(cleanConfig.file.id)}/raw`,
    };
  }

  // Prevent giant uploaded logos (> 60KB base64) from breaking Firestore 1MB limit or localStorage
  if (cleanConfig.logo?.uploadedUrl && cleanConfig.logo.uploadedUrl.length > 65000) {
    cleanConfig.logo = {
      ...cleanConfig.logo,
      uploadedUrl: cleanConfig.logo.uploadedUrl.slice(0, 65000),
    };
  }

  // Ensure thumbnail is safe size (< 200KB)
  let thumbnail = qr.previewThumbnail || '';
  if (thumbnail.length > 200000) {
    thumbnail = thumbnail.slice(0, 200000);
  }

  // Clean and clamp strings to comply with Firestore security rules
  const cleanName = (qr.name || 'Untitled QR').slice(0, 180);
  const cleanSummary = (qr.summaryText || '').slice(0, 1500);

  const payload: Record<string, any> = {
    id: qr.id,
    userId,
    name: cleanName,
    contentType: qr.contentType || 'url',
    summaryText: cleanSummary,
    previewThumbnail: thumbnail,
    createdAt: typeof qr.createdAt === 'number' ? qr.createdAt : Date.now(),
    config: cleanConfig,
  };

  if (typeof qr.scanCount === 'number') {
    payload.scanCount = qr.scanCount;
  }
  if (typeof qr.lastScannedAt === 'number') {
    payload.lastScannedAt = qr.lastScannedAt;
  }

  return payload;
}

export async function saveQRCodeToCloud(qr: SavedQR, userId?: string): Promise<boolean> {
  let targetUid = userId || auth.currentUser?.uid;
  if (!targetUid) {
    // Try ensuring an anonymous session if available
    try {
      const anon = await initAnonymousAuth();
      if (anon?.uid) {
        targetUid = anon.uid;
      }
    } catch (e) {
      console.warn('Auto anonymous auth note:', e);
    }
  }
  const finalUid = targetUid || auth.currentUser?.uid;
  if (!finalUid) {
    console.info('QR saved locally (will sync to Firestore upon sign-in).');
    return false;
  }

  const payload = sanitizeQRForFirestore(qr, finalUid);

  // 1. User subcollection: users/{userId}/qrcodes/{qrId}
  const userSubRef = doc(db, 'users', finalUid, 'qrcodes', qr.id);
  // 2. Root collection: qrcodes/{qrId} (immediately visible in Firestore console root)
  const rootQrRef = doc(db, 'qrcodes', qr.id);

  let success = false;
  try {
    await Promise.all([
      setDoc(userSubRef, payload, { merge: true }),
      setDoc(rootQrRef, payload, { merge: true }),
    ]);
    console.log(`[Firestore] Successfully saved QR "${qr.name}" (${qr.id}) to Firestore`);
    success = true;
  } catch (err) {
    console.warn('Attempting write to user subcollection:', err);
    try {
      await setDoc(userSubRef, payload, { merge: true });
      success = true;
    } catch (subErr) {
      handleFirestoreError(subErr, OperationType.WRITE, `users/${finalUid}/qrcodes/${qr.id}`);
    }
  }

  // Also initialize qr_analytics/{qrId} in Firestore if not already present
  try {
    const analyticsRef = doc(db, 'qr_analytics', qr.id);
    const snap = await getDoc(analyticsRef);
    if (!snap.exists()) {
      await setDoc(analyticsRef, {
        qrId: qr.id,
        qrName: payload.name,
        scanCount: typeof qr.scanCount === 'number' ? qr.scanCount : 0,
        lastScannedAt: qr.lastScannedAt || null,
        locations: [],
        recentScans: [],
        devices: { mobile: 0, desktop: 0, tablet: 0 },
        createdAt: qr.createdAt || Date.now(),
        updatedAt: Date.now(),
      });
    }
  } catch (err) {
    console.warn('QR analytics init note:', err);
  }

  return success;
}

export async function deleteQRCodeFromCloud(qrId: string, userId?: string): Promise<boolean> {
  const finalUid = userId || auth.currentUser?.uid;
  if (!finalUid || !qrId) return false;

  let success = false;
  try {
    const userSubRef = doc(db, 'users', finalUid, 'qrcodes', qrId);
    await deleteDoc(userSubRef);
    success = true;
  } catch (err) {
    console.warn('Failed deleting from user subcollection:', err);
  }

  try {
    const rootQrRef = doc(db, 'qrcodes', qrId);
    await deleteDoc(rootQrRef);
    success = true;
  } catch (err) {
    console.warn('Failed deleting from root qrcodes:', err);
  }

  return success;
}

export function subscribeToUserQRCodes(
  userId: string,
  onData: (items: SavedQR[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const path = `users/${userId}/qrcodes`;
  const q = query(
    collection(db, 'users', userId, 'qrcodes'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedQR[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: data.id || docSnap.id,
          name: data.name || 'Untitled QR',
          createdAt: data.createdAt || Date.now(),
          previewThumbnail: data.previewThumbnail || '',
          contentType: data.contentType || 'url',
          summaryText: data.summaryText || '',
          config: data.config,
        };
      });
      onData(items);
    },
    (error) => {
      console.warn('Firestore subscription note:', error.message);
      if (onError) onError(error);
    }
  );
}

// 7. Sync existing local storage items to cloud when a user signs in
export async function syncLocalHistoryToCloud(localItems: SavedQR[], userId: string): Promise<number> {
  if (!localItems || localItems.length === 0 || !userId) return 0;
  let successCount = 0;
  for (const item of localItems) {
    try {
      const ok = await saveQRCodeToCloud(item, userId);
      if (ok) successCount++;
    } catch (e) {
      console.warn('Failed to upload local item to cloud:', item.id, e);
    }
  }
  return successCount;
}

/**
 * Helper to clean undefined values from objects before writing to Firestore
 */
function sanitizeDocData<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

/**
 * Normalizes input key (strips quotes, leading/trailing ?, slashes, ?file=, etc.)
 */
function normalizeKey(input: string): string {
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
      if (f) return normalizeKey(f);
      s = u.pathname;
    }
  } catch {}
  s = s.replace(/^[/#?]+/, '').trim();
  const match = s.match(/^(?:file|viewfile|f|id|slug)=([^&]+)/i);
  if (match && match[1]) {
    s = decodeURIComponent(match[1]).trim();
    return normalizeKey(s);
  }
  const embedded = s.match(/[?&](?:file|f|id)=([^&]+)/i);
  if (embedded && embedded[1]) {
    return normalizeKey(decodeURIComponent(embedded[1]));
  }
  return s;
}

// 8. Public Files & User Files Cloud Database Operations
export async function getPublicFileFromFirestore(rawFileId: string): Promise<Record<string, any> | null> {
  if (!rawFileId) return null;
  const fileId = normalizeKey(rawFileId);
  if (!fileId) return null;

  // 1. Check root /files collection
  try {
    const fileDocRef = doc(db, 'files', fileId);
    const snap = await getDoc(fileDocRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    // Continue to fallback
  }

  // 2. Check /public_files collection
  try {
    const docRef = doc(db, 'public_files', fileId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error) {
    // Continue to fallback
  }

  // 3. Check /dynamic_links collection to see if fileId was a custom slug
  try {
    const dynRef = doc(db, 'dynamic_links', fileId.toLowerCase());
    const dynSnap = await getDoc(dynRef);
    if (dynSnap.exists()) {
      const dynData = dynSnap.data();
      if (dynData?.targetUrl) {
        const match = dynData.targetUrl.match(/[?&]file=([^&]+)/);
        if (match && match[1]) {
          const underlying = normalizeKey(decodeURIComponent(match[1]));
          if (underlying && underlying !== fileId) {
            return getPublicFileFromFirestore(underlying);
          }
        }
      }
    }
  } catch (dynErr) {
    // ignore
  }

  return null;
}

export async function savePublicFileToFirestore(fileData: {
  id: string;
  name: string;
  type: string;
  size?: number;
  url: string;
  previewUrl?: string;
  title?: string;
  description?: string;
  createdAt?: number;
}): Promise<boolean> {
  try {
    const cleanId = normalizeKey(fileData.id);
    const cleanUrl =
      fileData.url && fileData.url.length <= 800000
        ? fileData.url
        : `/api/files/${encodeURIComponent(cleanId)}/raw`;

    const payload: Record<string, any> = sanitizeDocData({
      id: cleanId,
      name: (fileData.name || 'file').slice(0, 250),
      type: (fileData.type || 'application/octet-stream').slice(0, 60),
      url: cleanUrl,
      size: typeof fileData.size === 'number' ? fileData.size : undefined,
      previewUrl: fileData.previewUrl ? fileData.previewUrl.slice(0, 300000) : undefined,
      title: fileData.title ? fileData.title.slice(0, 200) : undefined,
      description: fileData.description ? fileData.description.slice(0, 1000) : undefined,
      createdAt: fileData.createdAt || Date.now(),
    });

    const docRef = doc(db, 'public_files', cleanId);
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.warn('Could not sync public file to Firestore:', error);
    return false;
  }
}

/**
 * Saves a user-uploaded file to Firestore under both /users/{userId}/files/{fileId}
 * and the shared /files/{fileId} and /public_files/{fileId} collections.
 */
export async function saveUserFileToFirestore(fileData: FileData, userId?: string): Promise<boolean> {
  let targetUid = userId || auth.currentUser?.uid;

  // Ensure authenticated session if user is not signed in
  if (!targetUid) {
    try {
      const cred = await signInAnonymously(auth);
      targetUid = cred.user.uid;
    } catch (e) {
      console.warn('Anonymous auth note during file save:', e);
    }
  }

  if (!targetUid) {
    console.warn('Cannot save user file without authentication');
    return false;
  }

  const cleanId = normalizeKey(fileData.id);
  const cleanSlug = fileData.customSlug ? normalizeKey(fileData.customSlug) : undefined;
  const cleanUrl =
    fileData.dataUrl && fileData.dataUrl.length <= 800000
      ? fileData.dataUrl
      : `/api/files/${encodeURIComponent(cleanId)}/raw`;

  const payload: Record<string, any> = sanitizeDocData({
    id: cleanId,
    userId: targetUid,
    name: (fileData.name || 'file').slice(0, 250),
    type: (fileData.type || 'application/octet-stream').slice(0, 60),
    url: cleanUrl,
    size: typeof fileData.size === 'number' ? fileData.size : undefined,
    userEmail: auth.currentUser?.email ? auth.currentUser.email.slice(0, 250) : undefined,
    previewUrl: fileData.previewUrl && fileData.previewUrl.length <= 300000 ? fileData.previewUrl : undefined,
    customSlug: cleanSlug ? cleanSlug.slice(0, 120) : undefined,
    title: fileData.title ? fileData.title.slice(0, 250) : undefined,
    description: fileData.description ? fileData.description.slice(0, 2000) : undefined,
    createdAt: fileData.createdAt || Date.now(),
    updatedAt: Date.now(),
  });

  let success = false;

  // 1. Save in user's private files subcollection
  try {
    const userFileRef = doc(db, 'users', targetUid, 'files', cleanId);
    await setDoc(userFileRef, payload, { merge: true });
    success = true;
  } catch (err) {
    console.warn('Failed saving file to user subcollection:', err);
  }

  // 2. Save in root /files collection (accessible for QR links)
  try {
    const rootFileRef = doc(db, 'files', cleanId);
    await setDoc(rootFileRef, payload, { merge: true });
    success = true;
  } catch (err) {
    console.warn('Failed saving file to root files collection:', err);
  }

  // 3. Keep public_files in sync for maximum backward compatibility
  try {
    const pubFileRef = doc(db, 'public_files', cleanId);
    await setDoc(pubFileRef, {
      id: payload.id,
      name: payload.name,
      type: payload.type,
      size: payload.size,
      url: payload.url,
      previewUrl: payload.previewUrl,
      title: payload.title,
      description: payload.description,
      createdAt: payload.createdAt,
    }, { merge: true });
  } catch (e) {
    // Non-critical fallback
  }

  // 4. If cleanSlug is present, also mirror into dynamic_links and public_files aliases
  if (cleanSlug) {
    try {
      await saveDynamicLinkToFirestore({
        id: cleanSlug,
        targetUrl: `/?file=${encodeURIComponent(cleanId)}`,
        title: fileData.title || fileData.name,
        contentType: 'file',
        createdAt: Date.now(),
      });
      if (cleanSlug !== cleanId) {
        const aliasPubRef = doc(db, 'public_files', cleanSlug);
        await setDoc(aliasPubRef, { ...payload, id: cleanSlug }, { merge: true });
      }
    } catch (aliasErr) {
      // Non-critical alias note
    }
  }

  return success;
}

/**
 * Subscribes to real-time updates for all files uploaded by a user.
 */
export function subscribeToUserFiles(
  userId: string,
  onData: (files: FileData[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'users', userId, 'files'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FileData[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: data.id || docSnap.id,
          name: data.name || 'file',
          size: data.size || 0,
          type: data.type || 'application/octet-stream',
          dataUrl: data.url || '',
          userId: data.userId,
          userEmail: data.userEmail,
          previewUrl: data.previewUrl,
          encodeMode: 'link',
          customSlug: data.customSlug,
          title: data.title,
          description: data.description,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt,
        };
      });
      onData(items);
    },
    (error) => {
      console.warn('Firestore file subscription note:', error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Retrieves all files saved for a specific user from Firestore.
 */
export async function getUserFilesFromFirestore(userId: string): Promise<FileData[]> {
  try {
    const q = query(
      collection(db, 'users', userId, 'files'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: data.id || docSnap.id,
        name: data.name || 'file',
        size: data.size || 0,
        type: data.type || 'application/octet-stream',
        dataUrl: data.url || '',
        userId: data.userId,
        userEmail: data.userEmail,
        previewUrl: data.previewUrl,
        encodeMode: 'link',
        customSlug: data.customSlug,
        title: data.title,
        description: data.description,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt,
      };
    });
  } catch (error) {
    console.warn('Could not fetch user files from Firestore:', error);
    return [];
  }
}

/**
 * Deletes a file from user's Firestore collection and public storage.
 */
export async function deleteUserFileFromFirestore(fileId: string, userId?: string): Promise<boolean> {
  const targetUid = userId || auth.currentUser?.uid;
  let success = false;

  if (targetUid) {
    try {
      const userFileRef = doc(db, 'users', targetUid, 'files', fileId);
      await deleteDoc(userFileRef);
      success = true;
    } catch (err) {
      console.warn('Failed deleting from user files subcollection:', err);
    }
  }

  try {
    const rootFileRef = doc(db, 'files', fileId);
    await deleteDoc(rootFileRef);
    success = true;
  } catch (err) {
    console.warn('Failed deleting from root files collection:', err);
  }

  try {
    const pubFileRef = doc(db, 'public_files', fileId);
    await deleteDoc(pubFileRef);
  } catch (e) {}

  return success;
}

/**
 * Syncs an array of local files to Firestore for a signed-in user.
 */
export async function syncLocalFilesToCloud(userId: string, localFiles: FileData[]): Promise<number> {
  if (!userId || !localFiles || localFiles.length === 0) return 0;
  let count = 0;
  for (const file of localFiles) {
    try {
      const ok = await saveUserFileToFirestore(file, userId);
      if (ok) count++;
    } catch (err) {
      console.warn('Failed syncing local file to Firestore:', file.id, err);
    }
  }
  return count;
}

export interface CloudDynamicLink {
  id: string;
  targetUrl: string;
  title?: string;
  contentType?: string;
  scanCount?: number;
  lastScannedAt?: number;
  expirationDate?: string | null;
  expirationMessage?: string;
  createdAt: number;
  updatedAt?: number;
}

/**
 * Saves a dynamic link / custom slug redirect record in Firestore
 */
export async function saveDynamicLinkToFirestore(link: CloudDynamicLink): Promise<boolean> {
  if (!link || !link.id || !link.targetUrl) return false;
  const cleanId = normalizeKey(link.id).toLowerCase();
  try {
    const linkRef = doc(db, 'dynamic_links', cleanId);
    await setDoc(linkRef, sanitizeDocData({
      id: cleanId,
      targetUrl: link.targetUrl,
      title: link.title || cleanId,
      contentType: link.contentType || 'url',
      scanCount: typeof link.scanCount === 'number' ? link.scanCount : 0,
      expirationDate: link.expirationDate || null,
      expirationMessage: link.expirationMessage || null,
      createdAt: link.createdAt || Date.now(),
      updatedAt: Date.now(),
    }), { merge: true });
    return true;
  } catch (err) {
    console.warn('Failed saving dynamic link to Firestore:', err);
    return false;
  }
}

/**
 * Fetches a dynamic link / custom slug redirect record from Firestore
 */
export async function getDynamicLinkFromFirestore(slug: string): Promise<CloudDynamicLink | null> {
  if (!slug) return null;
  const cleanId = normalizeKey(slug).toLowerCase();
  try {
    const linkRef = doc(db, 'dynamic_links', cleanId);
    const snap = await getDoc(linkRef);
    if (snap.exists()) {
      return snap.data() as CloudDynamicLink;
    }
  } catch (err) {
    console.warn('Failed fetching dynamic link from Firestore:', err);
  }
  return null;
}

// -------------------------------------------------------------
// 7. QR Analytics & Location Telemetry (Firestore Powered)
// -------------------------------------------------------------

/**
 * Informs the client's current location from browser timezone or environment
 */
export function getClientEstimatedLocation(): { city: string; country: string; countryCode: string; region?: string } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      const parts = tz.split('/');
      const city = (parts[parts.length - 1] || 'Unknown').replace(/_/g, ' ');
      const region = parts[0] || 'Global';

      const tzMap: Record<string, { country: string; code: string }> = {
        'America': { country: 'United States', code: 'US' },
        'Europe': { country: 'United Kingdom', code: 'GB' },
        'Asia': { country: 'India', code: 'IN' },
        'Australia': { country: 'Australia', code: 'AU' },
        'Africa': { country: 'South Africa', code: 'ZA' },
      };

      if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India')) {
        return { city: 'Mumbai', country: 'India', countryCode: 'IN', region: 'Maharashtra' };
      }
      if (tz.includes('New_York')) {
        return { city: 'New York', country: 'United States', countryCode: 'US', region: 'New York' };
      }
      if (tz.includes('Los_Angeles')) {
        return { city: 'Los Angeles', country: 'United States', countryCode: 'US', region: 'California' };
      }
      if (tz.includes('Chicago')) {
        return { city: 'Chicago', country: 'United States', countryCode: 'US', region: 'Illinois' };
      }
      if (tz.includes('London')) {
        return { city: 'London', country: 'United Kingdom', countryCode: 'GB', region: 'England' };
      }
      if (tz.includes('Tokyo')) {
        return { city: 'Tokyo', country: 'Japan', countryCode: 'JP', region: 'Kanto' };
      }
      if (tz.includes('Singapore')) {
        return { city: 'Singapore', country: 'Singapore', countryCode: 'SG', region: 'Singapore' };
      }
      if (tz.includes('Berlin')) {
        return { city: 'Berlin', country: 'Germany', countryCode: 'DE', region: 'Berlin' };
      }
      if (tz.includes('Paris')) {
        return { city: 'Paris', country: 'France', countryCode: 'FR', region: 'Île-de-France' };
      }
      if (tz.includes('Sydney')) {
        return { city: 'Sydney', country: 'Australia', countryCode: 'AU', region: 'New South Wales' };
      }
      if (tz.includes('Toronto')) {
        return { city: 'Toronto', country: 'Canada', countryCode: 'CA', region: 'Ontario' };
      }

      const match = tzMap[region] || { country: region, code: region.slice(0, 2).toUpperCase() };
      return { city, country: match.country, countryCode: match.code, region };
    }
  } catch {}
  return { city: 'San Francisco', country: 'United States', countryCode: 'US', region: 'California' };
}

/**
 * Fetches QR code scan count and location data directly from Firestore
 */
export async function getQRAnalyticsFromFirestore(
  qrId: string,
  qrName?: string,
  customSlug?: string
): Promise<QRAnalyticsData> {
  if (!qrId) {
    return {
      qrId: '',
      qrName: qrName || 'QR Code',
      scanCount: 0,
      lastScannedAt: null,
      locations: [],
      recentScans: [],
      devices: { mobile: 0, desktop: 0, tablet: 0 },
    };
  }

  // Ensure an authenticated session (anonymous if needed) so Firestore rules allow reads
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch {}
  }

  const analyticsRef = doc(db, 'qr_analytics', qrId);
  try {
    const snap = await getDoc(analyticsRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        qrId,
        qrName: data.qrName || qrName || 'QR Code',
        scanCount: typeof data.scanCount === 'number' ? data.scanCount : 0,
        lastScannedAt: typeof data.lastScannedAt === 'number' ? data.lastScannedAt : null,
        locations: Array.isArray(data.locations) ? data.locations : [],
        recentScans: Array.isArray(data.recentScans) ? data.recentScans : [],
        devices: data.devices || { mobile: 0, desktop: 0, tablet: 0 },
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    }
  } catch (err) {
    console.warn('[Firestore] Reading qr_analytics note:', err);
  }

  // Fallback check if dynamic link or root QR had recorded scans
  let initialScanCount = 0;
  let initialLastScanned: number | null = null;
  if (customSlug) {
    try {
      const dyn = await getDynamicLinkFromFirestore(customSlug);
      if (dyn && typeof dyn.scanCount === 'number' && dyn.scanCount > 0) {
        initialScanCount = dyn.scanCount;
        initialLastScanned = dyn.lastScannedAt || null;
      }
    } catch {}
  }

  try {
    const rootSnap = await getDoc(doc(db, 'qrcodes', qrId));
    if (rootSnap.exists()) {
      const qd = rootSnap.data();
      if (typeof qd.scanCount === 'number' && qd.scanCount > initialScanCount) {
        initialScanCount = qd.scanCount;
        initialLastScanned = qd.lastScannedAt || initialLastScanned;
      }
      if (Array.isArray(qd.locations) && qd.locations.length > 0) {
        const fallbackAnalytics: QRAnalyticsData = {
          qrId,
          qrName: qd.name || qrName || 'QR Code',
          scanCount: initialScanCount,
          lastScannedAt: initialLastScanned,
          locations: qd.locations,
          recentScans: Array.isArray(qd.recentScans) ? qd.recentScans : [],
          devices: qd.devices || {
            mobile: Math.round(initialScanCount * 0.75),
            desktop: Math.round(initialScanCount * 0.2),
            tablet: Math.round(initialScanCount * 0.05),
          },
          createdAt: qd.createdAt || Date.now(),
          updatedAt: Date.now(),
        };
        try {
          await setDoc(analyticsRef, fallbackAnalytics, { merge: true });
        } catch {}
        return fallbackAnalytics;
      }
    }
  } catch {}

  // Initialize new document in Firestore qr_analytics so it's always ready
  const initialAnalytics: QRAnalyticsData = {
    qrId,
    qrName: qrName || 'QR Code',
    scanCount: initialScanCount,
    lastScannedAt: initialLastScanned,
    locations: [],
    recentScans: [],
    devices: { mobile: 0, desktop: 0, tablet: 0 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    await setDoc(analyticsRef, initialAnalytics);
  } catch (err) {
    console.warn('Could not initialize qr_analytics doc in Firestore:', err);
  }

  return initialAnalytics;
}

/**
 * Records a scan event with location data directly to Firestore
 */
export async function recordQRScanInFirestore(
  qrId: string,
  eventInfo?: Partial<QRScanEvent>
): Promise<QRAnalyticsData> {
  if (!qrId) throw new Error('qrId is required');

  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch {}
  }

  const defaultLoc = getClientEstimatedLocation();
  const city = eventInfo?.city || defaultLoc.city;
  const country = eventInfo?.country || defaultLoc.country;
  const countryCode = eventInfo?.countryCode || defaultLoc.countryCode;
  const region = defaultLoc.region;

  let device = eventInfo?.device;
  let browser = eventInfo?.browser;
  let deviceType: 'mobile' | 'desktop' | 'tablet' = eventInfo?.deviceType || 'mobile';

  if (!device || !browser) {
    const ua = navigator.userAgent;
    if (/iPad|Tablet/i.test(ua)) {
      deviceType = 'tablet';
      device = 'iPad';
    } else if (/iPhone|iPod/i.test(ua)) {
      deviceType = 'mobile';
      device = 'iPhone';
    } else if (/Android/i.test(ua)) {
      deviceType = 'mobile';
      device = 'Android Phone';
    } else if (/Macintosh/i.test(ua)) {
      deviceType = 'desktop';
      device = 'Mac';
    } else if (/Windows/i.test(ua)) {
      deviceType = 'desktop';
      device = 'Windows PC';
    } else {
      device = 'Mobile Device';
    }

    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Edg/i.test(ua)) browser = 'Edge';
    else browser = 'Mobile Browser';
  }

  const now = Date.now();
  const analyticsRef = doc(db, 'qr_analytics', qrId);
  const current = await getQRAnalyticsFromFirestore(qrId);

  const updatedScanCount = (current.scanCount || 0) + 1;
  const updatedLocations: QRScanLocation[] = [...(current.locations || [])];

  const existingLocIndex = updatedLocations.findIndex(
    (l) => l.city.toLowerCase() === city.toLowerCase() && l.country.toLowerCase() === country.toLowerCase()
  );

  if (existingLocIndex >= 0) {
    updatedLocations[existingLocIndex] = {
      ...updatedLocations[existingLocIndex],
      count: updatedLocations[existingLocIndex].count + 1,
      lastScannedAt: now,
    };
  } else {
    updatedLocations.push({
      city,
      country,
      countryCode,
      region,
      count: 1,
      lastScannedAt: now,
    });
  }

  updatedLocations.sort((a, b) => b.count - a.count);

  const newScanEvent: QRScanEvent = {
    timestamp: now,
    city,
    country,
    countryCode,
    device,
    browser,
    deviceType,
    referrer: document.referrer || 'Camera / Direct Scan',
  };

  const updatedRecentScans: QRScanEvent[] = [
    newScanEvent,
    ...(current.recentScans || []).slice(0, 49),
  ];

  const currentDevices = current.devices || { mobile: 0, desktop: 0, tablet: 0 };
  const updatedDevices = {
    ...currentDevices,
    [deviceType]: (currentDevices[deviceType] || 0) + 1,
  };

  const payload: QRAnalyticsData = {
    qrId,
    qrName: current.qrName,
    scanCount: updatedScanCount,
    lastScannedAt: now,
    locations: updatedLocations,
    recentScans: updatedRecentScans,
    devices: updatedDevices,
    createdAt: current.createdAt || now,
    updatedAt: now,
  };

  try {
    await setDoc(analyticsRef, payload, { merge: true });
    // Also mirror scanCount to root QR
    try {
      await updateDoc(doc(db, 'qrcodes', qrId), {
        scanCount: updatedScanCount,
        lastScannedAt: now,
      });
    } catch {}
  } catch (err) {
    console.error('Failed writing scan analytics to Firestore:', err);
  }

  return payload;
}

/**
 * Subscribes to real-time updates for a QR code's analytics in Firestore
 */
export function subscribeToQRAnalyticsInFirestore(
  qrId: string,
  onUpdate: (data: QRAnalyticsData) => void
): () => void {
  if (!qrId) return () => {};
  const analyticsRef = doc(db, 'qr_analytics', qrId);
  return onSnapshot(
    analyticsRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as QRAnalyticsData);
      }
    },
    (err) => {
      console.warn('Real-time QR analytics snapshot note:', err);
    }
  );
}




/** Live updates of the signed-in user's profile (coins, unlocked features, referral events). */
export function subscribeToUserProfile(userId: string, onData: (data: Record<string, any>) => void): () => void {
  try {
    return onSnapshot(
      doc(db, 'users', userId),
      (snap) => { if (snap.exists()) onData(snap.data() as Record<string, any>); },
      (err) => console.warn('Profile listener note:', err)
    );
  } catch (e) {
    console.warn('Could not start profile listener:', e);
    return () => {};
  }
}
