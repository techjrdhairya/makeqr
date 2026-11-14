/**
 * Cloud persistence for the MakeQR API server (Firestore via Firebase Admin SDK).
 *
 * Enabled when FIREBASE_SERVICE_ACCOUNT is set (JSON, or base64 of the JSON).
 * Collections (server-only — browsers can't read them, Firestore rules deny clients):
 *   srv_links/{slug}                 short links
 *   srv_files/{id}                   file records (metadata)
 *   srv_files/{id}/chunks/{000..}    file contents, split into ~700 KB pieces
 *   srv_scans/{key}                  scan analytics
 * Without the env var the server falls back to local JSON files (local dev).
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import crypto from 'crypto';

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // keeps each file to ~8 Firestore documents
const CHUNK_BYTES = 700 * 1024; // < 1 MiB document limit, with headroom

let db: Firestore | null = null;

export function initCloud(): boolean {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (!raw) return false;
  try {
    const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf-8');
    const sa = JSON.parse(json);
    if (sa.private_key) sa.private_key = String(sa.private_key).replace(/\\n/g, '\n');
    const app = getApps()[0] || initializeApp({ credential: cert(sa), projectId: sa.project_id });
    const dbId = process.env.FIRESTORE_DATABASE_ID || '(default)';
    db = dbId === '(default)' ? getFirestore(app) : getFirestore(app, dbId);
    db.settings({ ignoreUndefinedProperties: true });
    console.log(`[store] Firestore persistence ENABLED (project ${sa.project_id}).`);
    return true;
  } catch (e) {
    console.error('[store] FIREBASE_SERVICE_ACCOUNT is set but invalid — falling back to local files:', e);
    db = null;
    return false;
  }
}

export const cloudEnabled = () => db !== null;

/** Verifies a Firebase ID token from an `Authorization: Bearer <token>` header. */
export async function verifyToken(header?: string): Promise<{ uid: string; email?: string } | null> {
  if (!db) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header || '');
  if (!m) return null;
  try {
    const d = await getAuth(getApps()[0]).verifyIdToken(m[1]);
    return { uid: d.uid, email: d.email };
  } catch {
    return null;
  }
}

/** Writes only what changed between flushes (and deletes what disappeared). */
class DiffSync<T> {
  private last = new Map<string, string>();
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private again = false;
  constructor(private collection: string, private toDoc: (v: T) => Record<string, any>) {}

  hydrate(items: Record<string, any>[], idOf: (d: any) => string) {
    for (const d of items) this.last.set(idOf(d), JSON.stringify(d));
  }

  schedule(getAll: () => [string, T][]) {
    this.getAll = getAll;
    if (this.timer) return;
    this.timer = setTimeout(() => { this.timer = null; this.flush(); }, 400);
  }
  private getAll: () => [string, T][] = () => [];

  async flush() {
    if (!db) return;
    if (this.running) { this.again = true; return; }
    this.running = true;
    try {
      const current = new Map(this.getAll());
      const writes: [string, Record<string, any>, string][] = [];
      for (const [id, v] of current) {
        const doc = this.toDoc(v);
        const json = JSON.stringify(doc);
        if (this.last.get(id) !== json) writes.push([id, doc, json]);
      }
      const deletes = [...this.last.keys()].filter((id) => !current.has(id));
      for (let i = 0; i < writes.length; i += 300) {
        const batch = db.batch();
        for (const [id, doc] of writes.slice(i, i + 300)) batch.set(db.collection(this.collection).doc(id), doc);
        await batch.commit();
        for (const [id, , json] of writes.slice(i, i + 300)) this.last.set(id, json);
      }
      for (let i = 0; i < deletes.length; i += 300) {
        const batch = db.batch();
        for (const id of deletes.slice(i, i + 300)) batch.delete(db.collection(this.collection).doc(id));
        await batch.commit();
        for (const id of deletes.slice(i, i + 300)) this.last.delete(id);
      }
    } catch (e) {
      console.error(`[store] Failed saving ${this.collection}:`, e);
      setTimeout(() => this.flush(), 5000); // retry
    } finally {
      this.running = false;
      if (this.again) { this.again = false; this.flush(); }
    }
  }
}

export const linkSync = new DiffSync<any>('srv_links', (v) => v);
export const scanSync = new DiffSync<any>('srv_scans', (v) => v);
export const pageSync = new DiffSync<any>('srv_pages', (v) => v);
export const fileSync = new DiffSync<any>('srv_files', (v) => {
  // never put file bytes inside the metadata document
  const { url, previewUrl, ...rest } = v;
  return {
    ...rest,
    url: typeof url === 'string' && url.startsWith('data:') ? rest.rawUrl || '' : url,
    previewUrl: typeof previewUrl === 'string' && previewUrl.startsWith('data:') ? undefined : previewUrl,
  };
});

export async function loadAll(): Promise<{ links: any[]; files: any[]; scans: any[]; pages: any[] }> {
  if (!db) return { links: [], files: [], scans: [], pages: [] };
  const [l, f, s, pg] = await Promise.all([
    db.collection('srv_links').get(),
    db.collection('srv_files').get(),
    db.collection('srv_scans').get(),
    db.collection('srv_pages').get(),
  ]);
  const links = l.docs.map((d) => d.data());
  const files = f.docs.map((d) => d.data());
  const scans = s.docs.map((d) => d.data());
  const pages = pg.docs.map((d) => d.data());
  pageSync.hydrate(pages, (d) => d.id);
  linkSync.hydrate(links, (d) => d.id);
  fileSync.hydrate(files, (d) => d.id);
  scanSync.hydrate(scans, (d) => d.key);
  return { links, files, scans, pages };
}

// ---- file bytes ----
const cache = new Map<string, Buffer>();
let cacheBytes = 0;
const CACHE_LIMIT = 64 * 1024 * 1024;
function cachePut(id: string, buf: Buffer) {
  if (buf.length > CACHE_LIMIT / 2) return;
  cachePurge(id);
  cache.set(id, buf);
  cacheBytes += buf.length;
  while (cacheBytes > CACHE_LIMIT && cache.size > 1) {
    const oldest = cache.keys().next().value as string;
    cachePurge(oldest);
  }
}
function cachePurge(id: string) {
  const b = cache.get(id);
  if (b) { cacheBytes -= b.length; cache.delete(id); }
}

export const md5 = (b: Buffer) => crypto.createHash('md5').update(b).digest('hex');

export async function saveBytes(id: string, buf: Buffer): Promise<number> {
  if (!db) throw new Error('Cloud storage not enabled');
  const col = db.collection('srv_files').doc(id).collection('chunks');
  const count = Math.max(1, Math.ceil(buf.length / CHUNK_BYTES));
  for (let i = 0; i < count; i += 4) {
    const batch = db.batch();
    for (let j = i; j < Math.min(i + 4, count); j++) {
      batch.set(col.doc(String(j).padStart(4, '0')), {
        i: j,
        data: buf.subarray(j * CHUNK_BYTES, (j + 1) * CHUNK_BYTES),
      });
    }
    await batch.commit();
  }
  // remove stale chunks if the file got smaller
  const old = await col.get();
  const stale = old.docs.filter((d) => (d.data().i as number) >= count);
  if (stale.length) {
    const batch = db.batch();
    stale.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  cachePut(id, buf);
  return count;
}

export async function readBytes(id: string, chunkCount: number): Promise<Buffer | null> {
  if (!db) return null;
  const hit = cache.get(id);
  if (hit) { cachePut(id, hit); return hit; }
  const col = db.collection('srv_files').doc(id).collection('chunks');
  const refs = Array.from({ length: chunkCount }, (_, i) => col.doc(String(i).padStart(4, '0')));
  const snaps = await db.getAll(...refs);
  const parts: Buffer[] = [];
  for (const s of snaps) {
    if (!s.exists) return null;
    parts.push(Buffer.from(s.data()!.data as Uint8Array));
  }
  const buf = Buffer.concat(parts);
  cachePut(id, buf);
  return buf;
}

/** How many stored chunks exist for a file (used to repair records that lost their metadata). */
export async function countChunks(id: string): Promise<number> {
  if (!db) return 0;
  const snap = await db.collection('srv_files').doc(id).collection('chunks').select('i').get();
  return snap.size;
}

export async function resetAll() {
  if (!db) return;
  cache.clear(); cacheBytes = 0;
  for (const c of ['srv_links', 'srv_files', 'srv_scans']) {
    await db.recursiveDelete(db.collection(c));
  }
  linkSync.hydrate([], (d) => d.id);
}


// ---------- Referral coins (server-authoritative) ----------
// srv_referral_codes/{CODE}  -> { uid }          srv_referral_users/{uid} -> { code, referredBy?, referralsCount, referralEarned }
// Coins live in users/{uid}.coins (the app's profile document); only this server credits referral coins.
export const REFERRAL_BONUS = Math.max(1, Number(process.env.REFERRAL_BONUS) || 25);
export const REFERRAL_CAP = 20; // rewarded referrals per person
export const REFERRAL_WINDOW_DAYS = 7; // a code can only be added within a week of creating the account
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newRefCode = () => Array.from(crypto.randomBytes(8), (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join('');

let accountIsNewOverride: ((uid: string) => Promise<boolean>) | null = null;
/** Test seam: lets unit tests supply a fake Firestore and account-age check. */
export const __testHooks = {
  setDb(d: any) { db = d; },
  setAccountCheck(f: (uid: string) => Promise<boolean>) { accountIsNewOverride = f; },
};

async function accountIsNew(uid: string): Promise<boolean> {
  if (accountIsNewOverride) return accountIsNewOverride(uid);
  try {
    const u = await getAuth().getUser(uid);
    const created = new Date(u.metadata.creationTime).getTime();
    return Date.now() - created <= REFERRAL_WINDOW_DAYS * 86400_000;
  } catch { return false; }
}

export async function getReferralInfo(uid: string) {
  if (!db) throw new Error('cloud-disabled');
  const database = db;
  const meRef = database.collection('srv_referral_users').doc(uid);
  let data = (await meRef.get()).data();
  for (let i = 0; i < 6 && !data?.code; i++) {
    const code = newRefCode();
    await database.runTransaction(async (t) => {
      const cur = (await t.get(meRef)).data();
      if (cur?.code) return;
      const cRef = database.collection('srv_referral_codes').doc(code);
      if ((await t.get(cRef)).exists) return; // collision, loop again
      t.set(cRef, { uid, createdAt: Date.now() });
      t.set(meRef, { code, createdAt: Date.now() }, { merge: true });
    });
    data = (await meRef.get()).data();
  }
  if (!data?.code) throw new Error('could-not-create-code');
  const redeemed = Boolean(data.referredBy);

  // Friends who joined with this user's code (newest first). Sorted in memory, so no composite index is needed.
  const friends: { name: string; at: number; bonus: number }[] = [];
  try {
    const logSnap = await database.collection('srv_referral_log').where('referrerUid', '==', uid).limit(100).get();
    const rows = logSnap.docs.map((d) => d.data());
    const names = await Promise.all(rows.map(async (r) => {
      if (r.refereeName) return String(r.refereeName);
      try { return String((await database.collection('users').doc(r.refereeUid).get()).data()?.displayName || 'A friend'); } catch { return 'A friend'; }
    }));
    rows.forEach((r, i) => friends.push({ name: names[i], at: Number(r.at) || 0, bonus: Number(r.bonus) || REFERRAL_BONUS }));
    friends.sort((a, b) => b.at - a.at);
  } catch (e) { console.warn('[referral] could not list friends:', e); }

  let referredByName = data.referredByName as string | undefined;
  if (redeemed && !referredByName) {
    try { referredByName = String((await database.collection('users').doc(data.referredBy).get()).data()?.displayName || 'A friend'); } catch { referredByName = 'A friend'; }
  }
  return {
    enabled: true,
    friends: friends.slice(0, 50),
    referredByName: referredByName || undefined,
    code: data.code as string,
    count: (data.referralsCount as number) || 0,
    earned: (data.referralEarned as number) || 0,
    redeemed,
    canRedeem: !redeemed && (await accountIsNew(uid)),
    bonus: REFERRAL_BONUS,
    cap: REFERRAL_CAP,
    windowDays: REFERRAL_WINDOW_DAYS,
  };
}

type RedeemResult = { ok: true; newCoins: number; bonus: number; referrerName: string } | { ok: false; status: number; error: string };

export async function redeemReferral(uid: string, raw: string): Promise<RedeemResult> {
  if (!db) throw new Error('cloud-disabled');
  const database = db;
  const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 8) return { ok: false, status: 400, error: 'That referral code does not look right.' };
  if (!(await accountIsNew(uid))) {
    return { ok: false, status: 403, error: `Referral codes can only be added within ${REFERRAL_WINDOW_DAYS} days of creating your account.` };
  }
  await getReferralInfo(uid); // makes sure this user has their own record
  return database.runTransaction(async (t): Promise<RedeemResult> => {
    const codeSnap = await t.get(database.collection('srv_referral_codes').doc(code));
    if (!codeSnap.exists) return { ok: false, status: 404, error: 'Referral code not found.' };
    const referrerUid: string = codeSnap.data()!.uid;
    if (referrerUid === uid) return { ok: false, status: 400, error: 'You cannot use your own referral code.' };
    const meRef = database.collection('srv_referral_users').doc(uid);
    const refRef = database.collection('srv_referral_users').doc(referrerUid);
    const meProfile = database.collection('users').doc(uid);
    const refProfile = database.collection('users').doc(referrerUid);
    const [me, rr, meP, rrP] = await Promise.all([t.get(meRef), t.get(refRef), t.get(meProfile), t.get(refProfile)]);
    if (me.data()?.referredBy) return { ok: false, status: 409, error: 'You have already used a referral code.' };
    if (rr.data()?.referredBy === uid) return { ok: false, status: 409, error: 'That person was referred by you, so this code cannot be used.' };
    if ((rr.data()?.referralsCount || 0) >= REFERRAL_CAP) return { ok: false, status: 409, error: 'This code has reached its referral limit.' };
    if (!meP.exists) return { ok: false, status: 409, error: 'Your account is still being set up. Try again in a few seconds.' };
    if (!rrP.exists) return { ok: false, status: 409, error: 'The owner of this code has not finished setting up their account.' };
    const referrerName = String(rrP.data()?.displayName || 'A friend');
    const refereeName = String(meP.data()?.displayName || 'A friend');
    t.set(meRef, { referredBy: referrerUid, referredByCode: code, referredByName: referrerName, redeemedAt: Date.now() }, { merge: true });
    t.set(refRef, { referralsCount: FieldValue.increment(1), referralEarned: FieldValue.increment(REFERRAL_BONUS) }, { merge: true });
    t.update(meProfile, { coins: FieldValue.increment(REFERRAL_BONUS), updatedAt: new Date().toISOString() });
    // lastReferral* lets the referrer's open app show "<friend> joined" live
    t.update(refProfile, { coins: FieldValue.increment(REFERRAL_BONUS), lastReferralName: refereeName, lastReferralAt: Date.now(), lastReferralBonus: REFERRAL_BONUS, updatedAt: new Date().toISOString() });
    t.set(database.collection('srv_referral_log').doc(), { referrerUid, refereeUid: uid, code, bonus: REFERRAL_BONUS, at: Date.now(), refereeName, referrerName });
    const base = typeof meP.data()?.coins === 'number' ? (meP.data()!.coins as number) : 50;
    return { ok: true, newCoins: base + REFERRAL_BONUS, bonus: REFERRAL_BONUS, referrerName };
  });
}
