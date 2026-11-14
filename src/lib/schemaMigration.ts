// ============================================================================
// MIGRASI SKEMA DATA LOKAL
//
// Konvensi index hari yang dipakai SELURUH app: 0 = Senin ... 6 = Minggu
// (sama dengan `habitStore.DAY_NAMES`). Sebelum v1, `storageIndexOf()` memakai
// 0 = Rabu ... 6 = Selasa, sehingga data index-harian (catatan, foto harian,
// suplemen, hidrasi, jasmani, mood) bisa tampil di hari yang salah.
//
// Migrasi v1 menggeser index lama -> baru: Rab(0)->Rab(2) = +2 mod 7.
// Key berbasis NAMA hari (`bunda_daily_w{week}`) TIDAK disentuh karena sudah
// benar. Key foto berslot (`bunda_{week}_foto_{i}`, i = 0..4) juga tidak,
// karena `i` adalah nomor slot, bukan index hari.
// ============================================================================

export const SCHEMA_VERSION = 1;
export const SCHEMA_VERSION_KEY = 'bunda_schema_version';

/** Geseran index hari lama (Rab=0) ke baru (Sen=0). */
const DAY_SHIFT = 2;

/** `bunda_{week}_{day}_{jenis}` — day 0..6, bukan key foto berslot. */
const DAY_KEY_RE = /^bunda_(\d+)_([0-6])_(catatan|foto|suplemen|hidrasi|jasmani)$/;
/** Array mood 7 posisi per minggu. */
const MOODS_KEY_RE = /^bunda_daily_moods_w(\d+)$/;

const toNewDayIndex = (old: number): number => (old + DAY_SHIFT) % 7;

function shiftMoodsArray(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 7) return null;
    const next: unknown[] = new Array(7).fill(null);
    for (let old = 0; old < 7; old += 1) next[toNewDayIndex(old)] = parsed[old];
    return JSON.stringify(next);
  } catch {
    return null;
  }
}

interface RemapResult {
  key: string;
  value: string;
}

/** Nilai/key hasil migrasi untuk satu entri; null kalau tidak perlu diubah. */
function remapEntry(key: string, value: string): RemapResult | null {
  const dayMatch = key.match(DAY_KEY_RE);
  if (dayMatch) {
    const [, week, dayRaw, kind] = dayMatch;
    const newDay = toNewDayIndex(Number(dayRaw));
    if (newDay === Number(dayRaw)) return null;
    return { key: `bunda_${week}_${newDay}_${kind}`, value };
  }

  if (MOODS_KEY_RE.test(key)) {
    const shifted = shiftMoodsArray(value);
    if (shifted === null || shifted === value) return null;
    return { key, value: shifted };
  }

  return null;
}

function needsMigration(version: string | null): boolean {
  const current = Number(version || 0);
  return !Number.isFinite(current) || current < SCHEMA_VERSION;
}

/**
 * Migrasi semua data index-harian di localStorage. Idempoten lewat
 * `bunda_schema_version`. Mengembalikan true kalau ada yang dimigrasikan.
 */
export function migrateLocalStorage(storage?: Storage): boolean {
  const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return false;

  try {
    if (!needsMigration(store.getItem(SCHEMA_VERSION_KEY))) return false;

    const keys: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key) keys.push(key);
    }

    const writes: RemapResult[] = [];
    const removes: string[] = [];
    keys.forEach((key) => {
      const value = store.getItem(key);
      if (value === null) return;
      const remapped = remapEntry(key, value);
      if (!remapped) return;
      writes.push(remapped);
      if (remapped.key !== key) removes.push(key);
    });

    if (writes.length === 0) {
      store.setItem(SCHEMA_VERSION_KEY, String(SCHEMA_VERSION));
      return false;
    }

    // Pemetaan index hari bersifat bijektif: key lama bisa menjadi key tujuan
    // milik hari lain. Karena itu NILAI dibaca dulu ke memori, lalu:
    // backup -> hapus semua key lama -> tulis key baru -> hapus backup.
    const backupKey = 'bunda_schema_backup_v1';
    const snapshot: Record<string, string> = {};
    removes.forEach((key) => {
      const value = store.getItem(key);
      if (value !== null) snapshot[key] = value;
    });
    store.setItem(backupKey, JSON.stringify({ at: new Date().toISOString(), from: SCHEMA_VERSION - 1, keys: snapshot }));

    removes.forEach((key) => store.removeItem(key));
    writes.forEach((entry) => store.setItem(entry.key, entry.value));
    store.setItem(SCHEMA_VERSION_KEY, String(SCHEMA_VERSION));
    store.removeItem(backupKey);
    return true;
  } catch {
    // Jangan set version kalau gagal: biar dicoba lagi di boot berikutnya.
    return false;
  }
}

/**
 * Versi pure untuk payload cloud (`Record<key, string>`) sebelum ditulis ke
 * localStorage. Payload lama (tanpa `bunda_schema_version`) ikut dimigrasikan
 * agar restore dari backup lama tidak mengembalikan bug hari.
 */
export function migratePayload(payload: Record<string, string>): Record<string, string> {
  if (!payload || typeof payload !== 'object') return payload;
  if (!needsMigration(payload[SCHEMA_VERSION_KEY] ?? null)) return payload;

  const out: Record<string, string> = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (typeof value !== 'string') return;
    const remapped = remapEntry(key, value);
    if (!remapped) {
      out[key] = value;
      return;
    }
    // Kalau key tujuan sudah ada di payload, jangan timpa data yang lebih baru.
    if (remapped.key !== key && out[remapped.key] !== undefined) return;
    out[remapped.key] = remapped.value;
  });
  out[SCHEMA_VERSION_KEY] = String(SCHEMA_VERSION);
  return out;
}
