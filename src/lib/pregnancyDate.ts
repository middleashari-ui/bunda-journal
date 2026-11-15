import { storageGet } from './storage/appStorage';
// Util tanggal kehamilan - SATU sumber kebenaran, berbasis HPL user.
// Rumus: HPHT = HPL - 280 hari. Minggu 1 = minggu kalender yang memuat HPHT
// (diselaraskan ke hari Senin). Minggu N mulai = SeninMinggu1 + (N-1)*7 hari.
// Tidak ada lagi patokan tetap "Minggu 32 = 26 Okt".

export const DAY_MS = 86400000;

export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const startOfDay = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Selisih hari kalender (b - a) tanpa jam, aman lintas DST. */
export const daysBetween = (later: Date, earlier: Date): number =>
  Math.round((startOfDay(later).getTime() - startOfDay(earlier).getTime()) / DAY_MS);

export const clampWeek = (w: number): number => Math.min(40, Math.max(1, w));

export const isSameDay = (a: Date | null, b: Date | null): boolean =>
  !!a && !!b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * Index storage hari (0=SEN .. 6=MIN) dari sebuah tanggal.
 * Satu konvensi dengan `habitStore.DAY_NAMES`; data lama (0=RAB) dimigrasikan
 * oleh `lib/schemaMigration.ts`.
 */
export const storageIndexOf = (d: Date): number => (d.getDay() + 6) % 7;

/** HPL user dari profil (localStorage `bunda_profile`.hplDate, format YYYY-MM-DD). */
export function getHplDate(): Date | null {
  try {
    const raw = storageGet('bunda_profile');
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p?.hplDate) return null;
    const d = new Date(p.hplDate);
    return Number.isNaN(d.getTime()) ? null : startOfDay(d);
  } catch {
    return null;
  }
}

/** HPHT = HPL - 280 hari. Null kalau HPL tidak ada / tidak valid. */
export function getHpht(hpl: Date | null = getHplDate()): Date | null {
  if (!hpl) return null;
  const d = new Date(hpl);
  d.setDate(d.getDate() - 280);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Senin dari minggu ke-1 (minggu kalender yang memuat HPHT). */
export function getWeek1Monday(hpl: Date | null = getHplDate()): Date | null {
  const hpht = getHpht(hpl);
  if (!hpht) return null;
  const d = new Date(hpht);
  const back = (d.getDay() + 6) % 7; // Senin = 0
  d.setDate(d.getDate() - back);
  return d;
}

/** Senin dari minggu ke-`week`. */
export function getWeekMonday(week: number, hpl: Date | null = getHplDate()): Date | null {
  const w = Number(week);
  const base = getWeek1Monday(hpl);
  if (!base || !Number.isFinite(w)) return null;
  const d = new Date(base);
  d.setDate(base.getDate() + (w - 1) * 7);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 7 tanggal Sen..Min untuk minggu ke-`week`. Null kalau tak bisa dihitung. */
export function getWeekDatesMonday(
  week: number,
  hpl: Date | null = getHplDate()
): Array<Date | null> {
  const monday = getWeekMonday(week, hpl);
  if (!monday) return Array.from({ length: 7 }).map(() => null);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return Number.isNaN(d.getTime()) ? null : d;
  });
}

/**
 * Posisi "hari ini": minggu kehamilan (dari HPL) + index hari di strip SEN..MIN.
 * Tanpa HPL -> minggu 1, index mengikuti hari ini (tanggal strip tampil '-').
 */
export function getTodayPosition(
  now: Date = new Date(),
  hpl: Date | null = getHplDate()
): { week: number; dayIndex: number } {
  const dayIndex = storageIndexOf(now);
  const base = getWeek1Monday(hpl);
  if (!base) return { week: 1, dayIndex };
  const diff = daysBetween(now, base);
  return { week: clampWeek(1 + Math.floor(diff / 7)), dayIndex };
}

/** "23 Nov" / "-" kalau tak bisa dihitung. */
export function fmtDayMonth(d: Date | null): string {
  if (!d) return '-';
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

/** "23 - 29 Nov 2026" untuk header minggu. */
export function fmtWeekRange(week: number, hpl: Date | null = getHplDate()): string {
  const dates = getWeekDatesMonday(week, hpl);
  const a = dates[0];
  const b = dates[6];
  if (!a || !b) return '-';
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()} – ${b.getDate()} ${MONTH_SHORT[b.getMonth()]} ${b.getFullYear()}`;
  }
  return `${a.getDate()} ${MONTH_SHORT[a.getMonth()]} – ${b.getDate()} ${MONTH_SHORT[b.getMonth()]} ${b.getFullYear()}`;
}

/**
 * Tanggal untuk strip 7 hari, di-index dengan index storage (0=SEN .. 6=MIN).
 * `date` null kalau HPL tidak ada -> tampilkan '-', jangan tanggal dummy.
 */
export function getWeekStrip(
  activeWeek: number,
  now: Date = new Date(),
  hpl: Date | null = getHplDate()
): Array<{ date: Date | null; isToday: boolean }> {
  const out: Array<{ date: Date | null; isToday: boolean }> = Array.from({ length: 7 }).map(
    () => ({ date: null, isToday: false })
  );
  const monday = getWeekMonday(activeWeek, hpl);
  if (!monday) return out;
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    out[storageIndexOf(d)] = { date: d, isToday: isSameDay(d, now) };
  }
  return out;
}
