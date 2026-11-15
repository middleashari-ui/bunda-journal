// Guard kuota localStorage. Foto masih disimpan sebagai base64 (lihat P0 di
// docs/architecture.md), jadi kuota ~5 MB mudah penuh. Saat `setItem` gagal
// karena kuota, app TIDAK boleh diam saja: kirim event supaya UI menampilkan
// pesan yang bisa ditindaklanjuti user.

export const STORAGE_FULL_EVENT = 'bunda_storage_full';

const NOTICE_INTERVAL_MS = 10_000;
let lastNoticeAt = 0;

export function isQuotaError(error: unknown): boolean {
  if (!error) return false;
  const name = (error as { name?: string })?.name || '';
  const message = (error as { message?: string })?.message || '';
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    /quota/i.test(message)
  );
}

function notifyStorageFull(key: string) {
  const now = Date.now();
  if (now - lastNoticeAt < NOTICE_INTERVAL_MS) return;
  lastNoticeAt = now;
  try {
    window.dispatchEvent(new CustomEvent(STORAGE_FULL_EVENT, { detail: { key } }));
  } catch {}
}

/**
 * `localStorage.setItem` yang tidak melempar. Mengembalikan false kalau gagal.
 * Error non-kuota (mis. storage diblokir) tetap dianggap gagal tanpa notifikasi.
 */
export function setItemSafe(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (isQuotaError(error)) notifyStorageFull(key);
    return false;
  }
}

/** Ringkasan pemakaian localStorage (byte, perkiraan kasar UTF-16). */
export function estimateLocalStorageBytes(): number {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) || '';
      total += key.length + value.length;
    }
    return total * 2;
  } catch {
    return 0;
  }
}
