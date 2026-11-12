// Klien auth + sinkronisasi data per-user (email) ke Cloudflare D1.
// Login = email + password (hash PBKDF2 di server). Tidak ada login tanpa password.

import { idbSet, idbGet, idbDelete } from './idb';

export interface AuthUser {
  email: string;
  name?: string;
  tier: string;
  token: string;
}

const TOKEN_KEY = 'bunda_session_token';

// Pemilik data global di device ini (email yang terakhir mengisi key bunda_* tanpa
// suffix). Dipakai supaya login akun BERBEDA tidak mewarisi data akun sebelumnya.
const OWNER_KEY = 'bunda_local_owner';

function normalizeEmail(v: string | null | undefined): string {
  return (v || '').trim().toLowerCase();
}

function getLocalOwner(): string {
  try { return normalizeEmail(localStorage.getItem(OWNER_KEY)); } catch { return ''; }
}

function setLocalOwner(email: string) {
  try { localStorage.setItem(OWNER_KEY, normalizeEmail(email)); } catch {}
}

// Key yang TIDAK ikut disinkronkan (identitas/sesi/flag UI)
const EXCLUDE = new Set<string>([
  'bunda_session_token',
  'bunda_is_paid',
  'bunda_is_onboarded',
  'bunda_isLoggedIn',
  'bunda_user_email',
  'bunda_user_tier',
  'bunda_lastActive',
  'bunda_promo_consent',
  'bunda_pwa_tutorial_dismissed',
  'bunda_onboarding_done',
  'bunda_week', // posisi minggu bukan data jurnal: selalu hitung dari hari ini
  'bunda_sync_marker',
  'bunda_local_owner', // penanda pemilik data lokal (bukan data jurnal)
]);

// Key yang selalu terikat ke satu email
const PER_USER_BASES = ['bunda_appointment', 'bunda_catatan_ayah', 'bunda_appointment_status'];

async function post(url: string, body: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export function getToken(): string {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}

export function setToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

export function saveAuthUser(u: AuthUser) {
  // Catat pemilik data global SEBELUM email diganti: kalau belum ada penanda,
  // pemilik lamanya adalah akun yang sebelumnya login di device ini.
  if (!getLocalOwner()) setLocalOwner(localStorage.getItem('bunda_user_email') || '');
  setToken(u.token);
  try {
    localStorage.setItem('bunda_user_email', u.email);
    localStorage.setItem('bunda_user_tier', u.tier === 'vip' ? 'vip' : 'essential');
    localStorage.setItem('bunda_is_paid', u.tier === 'vip' || u.tier === 'essential' ? 'true' : 'false');
    localStorage.setItem('bunda_isLoggedIn', 'true');
  } catch {}
}

export function clearAuthUser() {
  clearToken();
  try {
    localStorage.removeItem('bunda_user_email');
    localStorage.removeItem('bunda_user_tier');
    localStorage.removeItem('bunda_is_paid');
    localStorage.setItem('bunda_isLoggedIn', 'false');
    // Snapshot editan offline berisi salinan data akun ini. Buang supaya tidak
    // pernah tergabung/ter-push ke akun lain yang login berikutnya di device ini.
    // (Data jurnalnya sendiri tetap disimpan untuk login berikutnya.)
    clearOfflineSnapshot();
  } catch {}
}

export async function apiLogin(email: string, password: string): Promise<AuthUser> {
  const { res, data } = await post('/api/auth/login', { email, password });
  if (!res.ok || !data.token) {
    const err: any = new Error(data.error || 'Gagal masuk.');
    err.status = res.status;
    throw err;
  }
  return data as AuthUser;
}

export async function apiRegister(email: string, password: string, name?: string): Promise<AuthUser> {
  const { res, data } = await post('/api/auth/register', { email, password, name });
  if (!res.ok || !data.token) {
    const err: any = new Error(data.error || 'Gagal mendaftar.');
    err.status = res.status;
    throw err;
  }
  return data as AuthUser;
}

export async function apiMe(token: string): Promise<AuthUser | null> {
  if (!token) return null;
  try {
    const res = await fetch(`/api/auth/me?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.ok) return null;
    return { email: data.email, name: data.name, tier: data.tier, token };
  } catch {
    return null;
  }
}

export async function apiLogout(token: string): Promise<void> {
  try { await post('/api/auth/logout', { token }); } catch {}
}

/** Kumpulkan semua data jurnal di device ini (key per-user dinormalisasi jadi base). */
export function collectUserPayload(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('bunda_')) continue;
      if (EXCLUDE.has(k)) continue;
      let base = k;
      for (const b of PER_USER_BASES) {
        if (k.startsWith(`${b}::`)) { base = b; break; }
      }
      const val = localStorage.getItem(k);
      if (val !== null) out[base] = val;
    }
  } catch {}
  return out;
}

// ---------------------------------------------------------------------------
// SNAPSHOT SEBELUM PEMULIHAN
// Menyimpan salinan data lokal ke IndexedDB sebelum applyUserPayload menimpa.
// UI: TabProfil -> "Batalkan pemulihan terakhir".
// ---------------------------------------------------------------------------
const PRE_RESTORE_KEY = 'bunda_pre_restore_v1';
const PRE_RESTORE_AT = 'bunda_pre_restore_at';
const PRE_RESTORE_COUNT = 'bunda_pre_restore_count';
const PRE_RESTORE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface RestoreSnapshotInfo {
  at: string;
  count: number;
}

/** Ambil SEMUA key jurnal apa adanya (tanpa normalisasi), untuk snapshot & undo. */
function captureRawJournal(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('bunda_')) continue;
      if (EXCLUDE.has(k)) continue;
      const v = localStorage.getItem(k);
      if (v !== null) out[k] = v;
    }
  } catch {}
  return out;
}

function writeRestoreSnapshot(email: string, reason: string) {
  const keys = captureRawJournal();
  const count = Object.keys(keys).length;
  if (!count) return; // device kosong: tidak ada yang perlu dibatalkan
  const at = new Date().toISOString();
  try {
    localStorage.setItem(PRE_RESTORE_AT, at);
    localStorage.setItem(PRE_RESTORE_COUNT, String(count));
  } catch {}
  void idbSet(PRE_RESTORE_KEY, { at, email: normalizeEmail(email), reason, keys });
}

/** Info snapshot (null kalau tidak ada / sudah kedaluwarsa 7 hari). */
export async function getRestoreSnapshotInfo(): Promise<RestoreSnapshotInfo | null> {
  let at = '';
  let count = 0;
  try {
    at = localStorage.getItem(PRE_RESTORE_AT) || '';
    count = Number(localStorage.getItem(PRE_RESTORE_COUNT) || '0');
  } catch {}
  if (!at) return null;
  const age = Date.now() - new Date(at).getTime();
  if (!Number.isFinite(age) || age > PRE_RESTORE_TTL_MS) return null;
  return { at, count };
}

/** Kembalikan data lokal ke kondisi sebelum pemulihan terakhir. */
export async function undoLastRestore(): Promise<{ ok: boolean; at?: string; count?: number }> {
  const snap: any = await idbGet(PRE_RESTORE_KEY);
  if (!snap || !snap.keys || typeof snap.keys !== 'object') return { ok: false };
  try {
    Object.entries(snap.keys).forEach(([k, v]) => {
      if (typeof v === 'string') localStorage.setItem(k, v);
    });
    await idbDelete(PRE_RESTORE_KEY);
    localStorage.removeItem(PRE_RESTORE_AT);
    localStorage.removeItem(PRE_RESTORE_COUNT);
    localStorage.removeItem('bunda_offline_snapshot');
    window.dispatchEvent(new Event('bunda_journal_updated'));
    return { ok: true, at: snap.at, count: Object.keys(snap.keys).length };
  } catch {
    return { ok: false };
  }
}

/** Tulis payload ke localStorage sebagai milik `email` (key per-user diberi suffix email). */
export function applyUserPayload(payload: Record<string, string>, email: string) {
  if (!payload || typeof payload !== 'object') return;
  // PENGAMAN SEBELUM MENIMPA: simpan salinan data lokal lebih dulu.
  // Kalau hasil merge ternyata salah, user masih bisa "Batalkan pemulihan".
  writeRestoreSnapshot(email, 'restore');
  try {
    // Isolasi antar-akun: data global (bunda_profile, bunda_daily_w*, bunda_bab*,
    // dst. tanpa suffix email) tidak boleh tercampur. Kalau pemilik data di device
    // ini berbeda dengan email yang baru masuk, bersihkan dulu SEMUA data lama
    // sebelum payload akun baru ditulis - sisanya (key yang tidak ada di payload)
    // tidak akan bocor ke akun baru.
    const owner = getLocalOwner();
    const next = normalizeEmail(email);
    if (owner && next && owner !== next) {
      wipeLocalJournalData(); // sekalian membuang snapshot offline milik akun lama
    }

    // bersihkan dulu data per-user milik akun lain
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (PER_USER_BASES.some((b) => k === b || k.startsWith(`${b}::`))) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
    // 'bunda_week' SENGAJA tidak dihapus: itu posisi minggu yang sedang dibuka
    // user. Kalau dihapus, app selalu balik ke minggu hari ini (33) saat boot.

    Object.keys(payload).forEach((k) => {
      const v = payload[k];
      if (typeof v !== 'string') return;
      if (k === 'bunda_week') return;
      if (PER_USER_BASES.includes(k)) {
        localStorage.setItem(`${k}::${email}`, v);
      } else {
        localStorage.setItem(k, v);
      }
    });
    // data sudah sinkron -> antrean offline tidak relevan lagi
    localStorage.removeItem('bunda_offline_snapshot');
    // tandai pemilik data global yang baru (backward compat: email lama dipertahankan
    // kalau payload dipanggil tanpa email valid)
    setLocalOwner(next || owner);
  } catch {}
}

/** Hapus data jurnal di device (dipakai saat akun baru login di device bekas akun lain). */export function wipeLocalJournalData() {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('bunda_')) continue;
      if (EXCLUDE.has(k)) continue;
      toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
    // data sudah bersih -> tidak ada pemilik sampai akun berikutnya menulis data
    setLocalOwner('');
  } catch {}
}

export async function pullUserData(
  token: string
): Promise<{ ok: boolean; exists: boolean; payload: Record<string, string> | null; updatedAt: string | null }> {
  try {
    const res = await fetch(`/api/userdata?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
    if (!res.ok) return { ok: false, exists: false, payload: null, updatedAt: null };
    const data = await res.json();
    if (!data?.ok) return { ok: false, exists: false, payload: null, updatedAt: null };
    if (!data.exists || !data.payload) return { ok: true, exists: false, payload: null, updatedAt: null };
    return { ok: true, exists: true, payload: JSON.parse(data.payload), updatedAt: data.updated_at || null };
  } catch {
    return { ok: false, exists: false, payload: null, updatedAt: null };
  }
}

export function getSyncMarker(): string {
  try { return localStorage.getItem('bunda_sync_marker') || ''; } catch { return ''; }
}

export function setSyncMarker(v: string) {
  try { localStorage.setItem('bunda_sync_marker', v || ''); } catch {}
}

export async function pushUserData(token: string, payload: Record<string, string>): Promise<boolean> {
  try {
    const { res } = await post('/api/userdata', { token, payload: JSON.stringify(payload) });
    return res.ok;
  } catch {
    return false;
  }
}

// GERBANG SYNC: push ke D1 hanya boleh setelah device ini selesai menarik
// data server. Tanpa ini, komponen yang dispatch 'bunda_journal_updated' saat
// mount akan menimpa data D1 dengan localStorage kosong.
let syncReady = false;

export function setSyncReady(v: boolean) {
  syncReady = v;
}

export function isSyncReady(): boolean {
  return syncReady;
}

const OFFLINE_SNAP_KEY = 'bunda_offline_snapshot';

/** Catat kondisi data saat mulai offline (dasar untuk menghitung editan offline). */
export function markOfflineSnapshot() {
  try {
    if (!localStorage.getItem(OFFLINE_SNAP_KEY)) {
      localStorage.setItem(OFFLINE_SNAP_KEY, JSON.stringify(collectUserPayload()));
    }
  } catch {}
}

export function clearOfflineSnapshot() {
  try { localStorage.removeItem(OFFLINE_SNAP_KEY); } catch {}
}

function readOfflineSnapshot(): Record<string, string> | null {
  try {
    const s = localStorage.getItem(OFFLINE_SNAP_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

/** Ada editan offline yang belum terkirim? (bandingkan snapshot vs kondisi sekarang) */
export function hasOfflineEdits(): boolean {
  const snap = readOfflineSnapshot();
  if (!snap) return false;
  const now = collectUserPayload();
  const keys = new Set([...Object.keys(snap), ...Object.keys(now)]);
  for (const k of keys) {
    if (snap[k] !== now[k]) return true;
  }
  return false;
}

/**
 * Online lagi: TARIK dulu dari API -> GABUNG dengan editan offline -> PUSH hasil gabungan.
 * Aturan: key yang hanya ada di offline tetap dibawa; untuk key yang sama,
 * editan offline (yang belum terkirim) menang; sisanya data D1 yang menang.
 */
export async function flushOfflineEdits(token: string): Promise<boolean> {
  try {
    let snap = readOfflineSnapshot();
    let staleSnapshot = false;
    // Snapshot offline bisa milik akun SEBELUMNYA di device ini (logout tidak
    // menghapus data jurnal). Jangan digabung/dipush ke akun yang sedang login -
    // cukup buang, data akun ini tetap ditarik dari server di bawah.
    const owner = getLocalOwner();
    const current = normalizeEmail(localStorage.getItem('bunda_user_email'));
    if (snap && owner && current && owner !== current) {
      clearOfflineSnapshot();
      snap = null;
      staleSnapshot = true;
    }
    // data lokal yang sedang berada di device bisa juga milik akun lama -> jangan
    // ikut digabung kalau snapshot-nya tadi dibuang.
    const local = staleSnapshot ? {} : collectUserPayload();
    const server = await pullUserData(token);
    if (!server.ok) return false; // gagal tarik -> jangan push (fail closed)

    const serverPayload = server.payload || {};
    let merged: Record<string, string>;

    if (snap) {
      const dirty: Record<string, string> = {};
      const keys = new Set([...Object.keys(snap), ...Object.keys(local)]);
      keys.forEach((k) => {
        if (snap[k] !== local[k] && typeof local[k] === 'string') dirty[k] = local[k];
      });
      merged = { ...serverPayload, ...dirty };
    } else {
      merged = { ...serverPayload, ...local };
    }

    const okPush = await pushUserData(token, merged);
    if (okPush) {
      clearOfflineSnapshot();
      const email = (localStorage.getItem('bunda_user_email') || '').trim().toLowerCase();
      if (email) applyUserPayload(merged, email);
    }
    return okPush;
  } catch {
    return false;
  }
}

let pushTimer: any = null;

/** Dorong data ke server (debounce 1.5s) — dipanggil tiap ada perubahan jurnal. */
export function scheduleUserDataPush(delay = 1500) {
  const token = getToken();
  if (!token || !syncReady) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    markOfflineSnapshot();
    return;
  }
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    const t = getToken();
    if (!t) return;
    pushUserData(t, collectUserPayload()).then((ok) => {
      // Push sukses = server sudah sama dengan device ini -> antrean offline selesai
      if (ok) clearOfflineSnapshot();
    });
  }, delay);
}

export function pushUserDataNow() {
  const token = getToken();
  if (!token || !syncReady) return Promise.resolve(false);
  return pushUserData(token, collectUserPayload()).then((ok) => {
    if (ok) clearOfflineSnapshot();
    return ok;
  });
}
