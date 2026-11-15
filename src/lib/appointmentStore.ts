// ============================================================
// appointmentStore.ts
// Penyimpanan jadwal dokter (Atur Jadwal) yang PER-USER (by email).
// Tujuan: data jadwal Bunda tidak boleh hilang / ketimpa user lain,
// dan tidak boleh di-purge oleh boot purge di main.tsx.
//
// Skema key:
//   Login (ada email) -> `bunda_appointment::<email-lowercase>`
//   Guest (tanpa email) -> `bunda_appointment` (bucket guest)
// Key lain yang ikut per-user: `bunda_catatan_ayah`, `bunda_appointment_status`.
// ============================================================

export interface AppointmentData {
  date: string | null;
  jam: string;
  jenis: string;
  minggu: string | number;
  dokter: string;
  lokasi: string;
  klinik: string;
  pesanAyah: string;
}

export const EMPTY_APPOINTMENT: AppointmentData = {
  date: null,
  jam: '',
  jenis: '',
  minggu: '',
  dokter: '',
  lokasi: '',
  klinik: '',
  pesanAyah: '',
};

const K_APPOINTMENT = 'bunda_appointment';
const K_CATATAN = 'bunda_catatan_ayah';
const K_STATUS = 'bunda_appointment_status';
const DEFAULT_STATUS = 'PERLU BOOK';

export const normalizeEmail = (email?: string | null): string =>
  (email || '').trim().toLowerCase();

/** Email user yang sedang aktif di perangkat ini. */
export function getActiveEmail(): string {
  try {
    return normalizeEmail(localStorage.getItem('bunda_user_email'));
  } catch {
    return '';
  }
}

/** base key + scope email -> key fisik di localStorage. */
export function scopedKey(base: string, email?: string | null): string {
  const e = normalizeEmail(email);
  return e ? `${base}::${e}` : base;
}

function readJSON(key: string): any | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

/** Apakah sudah ada akun lain (email lain) yang punya data jadwal di device ini. */
function hasOtherScopedAccount(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`${K_APPOINTMENT}::`)) return true;
    }
  } catch {}
  return false;
}

/**
 * Load jadwal untuk email aktif.
 * Urutan: key per-user -> (migrasi sekali dari bucket guest, hanya bila
 * belum ada akun lain di device ini) -> kosong.
 */
export function loadAppointment(email?: string | null): AppointmentData {
  const e = normalizeEmail(email);

  const own = readJSON(scopedKey(K_APPOINTMENT, e));
  if (own) return { ...EMPTY_APPOINTMENT, ...own };

  if (e) {
    const guest = readJSON(K_APPOINTMENT);
    if (guest && !hasOtherScopedAccount()) {
      const migrated = { ...EMPTY_APPOINTMENT, ...guest };
      writeRaw(scopedKey(K_APPOINTMENT, e), JSON.stringify(migrated));
      return migrated;
    }
  }

  return { ...EMPTY_APPOINTMENT };
}

/** Simpan jadwal ke bucket email aktif (guest -> bucket guest). */
export function saveAppointment(data: AppointmentData, email?: string | null): void {
  writeRaw(scopedKey(K_APPOINTMENT, email), JSON.stringify(data));
}

export function loadCatatanAyah(email?: string | null): string {
  const e = normalizeEmail(email);
  try {
    const own = localStorage.getItem(scopedKey(K_CATATAN, e));
    if (own !== null) return own;
    if (e) return localStorage.getItem(K_CATATAN) || '';
  } catch {}
  return '';
}

export function saveCatatanAyah(text: string, email?: string | null): void {
  writeRaw(scopedKey(K_CATATAN, email), text);
}

export function loadStatus(email?: string | null): string {
  const e = normalizeEmail(email);
  try {
    const own = localStorage.getItem(scopedKey(K_STATUS, e));
    if (own) return own;
    if (e) return localStorage.getItem(K_STATUS) || DEFAULT_STATUS;
  } catch {}
  return DEFAULT_STATUS;
}

export function saveStatus(status: string, email?: string | null): void {
  writeRaw(scopedKey(K_STATUS, email), status);
}

/** True bila jadwal benar-benar kosong (belum pernah diisi). */
export function isAppointmentEmpty(a: AppointmentData | null | undefined): boolean {
  if (!a) return true;
  return !a.date && !a.dokter && !a.jam && !a.jenis && !a.lokasi && !a.klinik && !a.pesanAyah;
}

/** Kabari komponen (TabJurnal) bahwa identitas user berubah tanpa reload. */
export function notifyUserChanged(email?: string | null): void {
  try {
    window.dispatchEvent(
      new CustomEvent('bunda_user_changed', { detail: { email: normalizeEmail(email) } })
    );
  } catch {}
}
