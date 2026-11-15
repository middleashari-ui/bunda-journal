// ============================================================================
// MEDIA STORE — data berat (foto base64 & isi bab buku) keluar dari
// localStorage ke IndexedDB.
//
// Kenapa: localStorage hanya ~5 MB, sedangkan foto USG base64 saja bisa
// 200-400 KB per foto. Setelah penuh, `setItem` gagal dan data user hilang.
// IndexedDB kuotanya jauh lebih besar.
//
// Kontrak:
// - SEMUA akses key media (lihat `isMediaKey`) wajib lewat modul ini.
// - Nilai disimpan sebagai string JSON apa adanya, sama seperti di localStorage,
//   supaya pemanggil tetap memakai `JSON.parse` seperti biasa.
// - Ada cache sinkron di memori, diisi sekali saat boot oleh `hydrateMedia()`
//   (dipanggil di `main.tsx` sebelum React render). Jadi `mediaGet()` tetap
//   sinkron dan komponen tidak perlu async.
// - Fallback: kalau IndexedDB tidak tersedia/gagal, nilai tetap ditulis ke
//   localStorage (perilaku lama) supaya tidak ada data yang hilang.
// ============================================================================

import { idbDelete, idbGet, idbPut } from './idb';
import { setItemSafe } from './storageQuota';

/** Index daftar key media (kecil, boleh di localStorage). */
export const MEDIA_INDEX_KEY = 'bunda_media_index';

const MEDIA_PATTERNS: RegExp[] = [
  /^bunda_photos$/,
  /^bunda_bab[1-5]$/,
  /^bunda_\d+_foto_\d+$/, // slot foto mingguan (bunda_{week}_foto_{i})
  /^bunda_\d+_\d_foto$/, // foto per hari (bunda_{week}_{day}_foto)
];

export function isMediaKey(key: string): boolean {
  return MEDIA_PATTERNS.some((re) => re.test(key));
}

const cache = new Map<string, string>();
let hydrated = false;

function readIndex(): string[] {
  try {
    const raw = localStorage.getItem(MEDIA_INDEX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((k: unknown): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

function writeIndex(keys: string[]) {
  try {
    const unique = Array.from(new Set(keys)).filter((k) => isMediaKey(k));
    if (unique.length === 0) localStorage.removeItem(MEDIA_INDEX_KEY);
    else setItemSafe(MEDIA_INDEX_KEY, JSON.stringify(unique));
  } catch {}
}

function addToIndex(key: string) {
  const keys = readIndex();
  if (!keys.includes(key)) writeIndex([...keys, key]);
}

function removeFromIndex(key: string) {
  writeIndex(readIndex().filter((k) => k !== key));
}

/**
 * Muat semua media ke cache dan pindahkan sisa key media di localStorage ke
 * IndexedDB. Aman dipanggil berkali-kali; hanya benar-benar jalan sekali.
 */
export async function hydrateMedia(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  if (typeof localStorage === 'undefined') return;

  const index = readIndex();

  // 1. Migrasi: key media yang masih di localStorage -> IndexedDB.
  const pending: Array<{ key: string; value: string }> = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !isMediaKey(key)) continue;
      const value = localStorage.getItem(key);
      if (value !== null) pending.push({ key, value });
    }
  } catch {}

  for (const entry of pending) {
    cache.set(entry.key, entry.value);
    const ok = await idbPut(entry.key, entry.value);
    if (ok) {
      // Baru hapus dari localStorage setelah IDB sukses.
      try {
        localStorage.removeItem(entry.key);
      } catch {}
      if (!index.includes(entry.key)) index.push(entry.key);
    }
  }
  if (pending.length > 0) writeIndex(index);

  // 2. Muat key media yang tercatat di index tapi belum ada di cache.
  const missing = index.filter((key) => !cache.has(key));
  for (const key of missing) {
    const value = await idbGet<string>(key);
    if (typeof value === 'string') cache.set(key, value);
  }
}

/** Baca nilai media (string JSON) secara sinkron. */
export function mediaGet(key: string): string | null {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  // Fallback: belum terhidrasi / IDB gagal -> masih di localStorage.
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Tulis nilai media. IndexedDB jadi sumber utama; localStorage hanya fallback. */
export function mediaSet(key: string, value: string): void {
  cachedSet(key, value);
  addToIndex(key);
  void idbPut(key, value).then((ok) => {
    if (!ok) {
      // IDB gagal: simpan di localStorage supaya data tidak hilang. Hanya kalau
      // nilai ini masih yang terbaru (hindari menimpa nilai yang lebih baru).
      if (cache.get(key) === value) setItemSafe(key, value);
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch {}
  });
}

function cachedSet(key: string, value: string) {
  cache.set(key, value);
}

/** Hapus media dari cache, IndexedDB, dan localStorage. */
export function mediaRemove(key: string): void {
  cache.delete(key);
  removeFromIndex(key);
  void idbDelete(key);
  try {
    localStorage.removeItem(key);
  } catch {}
}

/** Semua media dalam bentuk Record (untuk backup/snapshot/sync). */
export function mediaSnapshot(): Record<string, string> {
  const out: Record<string, string> = {};
  cache.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

/** Hapus SEMUA media milik device (dipakai saat ganti akun). */
export function mediaWipeAll(): void {
  const keys = new Set<string>(readIndex());
  cache.forEach((_, key) => keys.add(key));
  cache.clear();
  try {
    localStorage.removeItem(MEDIA_INDEX_KEY);
  } catch {}
  keys.forEach((key) => {
    void idbDelete(key);
    try {
      localStorage.removeItem(key);
    } catch {}
  });
}
