// ============================================================================
// APP STORAGE — satu pintu untuk akses data lokal non-media.
//
// Tujuan: berhenti memanggil `localStorage` langsung dari komponen. Semua
// akses lewat sini supaya:
// - kegagalan kuota tertangani (setItemSafe → toast + event), bukan try/catch kosong
// - key media (foto/bab) otomatis diarahkan ke IndexedDB (mediaStore)
// - nama key gampang diaudit (`npm run audit:storage`)
// - migrasi skema berikutnya cukup di satu tempat
//
// Catatan: `authClient` sengaja tetap memakai localStorage mentah karena perlu
// mengiterasi semua key (backup/sync). File ini untuk pemakaian biasa.
// ============================================================================

import { isMediaKey, mediaGet, mediaRemove, mediaSet, mediaWipeAll } from '../mediaStore';
import { setItemSafe } from '../storageQuota';

/** Baca string mentah. Null kalau tidak ada. */
export function storageGet(key: string): string | null {
  if (isMediaKey(key)) return mediaGet(key);
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Baca JSON dengan fallback aman (tidak melempar kalau isinya rusak). */
export function storageGetJson<T>(key: string, fallback: T): T {
  const raw = storageGet(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Tulis string. Key media diarahkan ke IndexedDB. */
export function storageSet(key: string, value: string): boolean {
  if (isMediaKey(key)) {
    mediaSet(key, value);
    return true;
  }
  return setItemSafe(key, value);
}

/** Tulis JSON. */
export function storageSetJson(key: string, value: unknown): boolean {
  try {
    return storageSet(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

/** Hapus satu key (termasuk dari IndexedDB kalau media). */
export function storageRemove(key: string): void {
  if (isMediaKey(key)) {
    mediaRemove(key);
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {}
}

/**
 * Hapus SEMUA data lokal (dipakai tombol "Reset semua data").
 * Media ikut dibersihkan supaya tidak ada sisa foto di IndexedDB.
 */
export function storageClear(): void {
  try {
    localStorage.clear();
  } catch {}
  try {
    mediaWipeAll();
  } catch {}
}
