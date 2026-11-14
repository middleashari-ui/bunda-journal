import { storageGet } from './storage/appStorage';
// ============================================================================
// HABIT STORE — satu pintu untuk data kebiasaan harian:
// suplemen, hidrasi, dan aktivitas jasmani.
//
// Aturan (kontrak integrasi):
// 1. Semua UI (Beranda, Jurnal, widget ringkasan, PDF, fitur baru) WAJIB baca/tulis
//    lewat modul ini. Jangan menyentuh localStorage `bunda_{week}_{day}_*` langsung,
//    supaya saat UI diganti, datanya tetap nyambung.
// 2. Indeks hari: 0 = Senin ... 6 = Minggu (satu konvensi untuk seluruh app).
// 3. Setiap perubahan mengirim event `bunda_habits_updated` (+ `bunda_journal_updated`
//    untuk kompatibilitas listener lama), jadi semua tab ikut ter-update.
// ============================================================================

import { setItemSafe } from './storageQuota';

export const HABITS_EVENT = 'bunda_habits_updated';
export const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] as const;

export const WATER_TARGET_ML = 2000;
export const ACTIVITY_TARGET_MIN = 15;

export type HabitKind = 'vitamin' | 'water' | 'activity';

export interface SupplementState {
  [key: string]: unknown;
  count?: number;
}

export interface WaterState {
  current: number;
  target: number;
}

export interface ActivityState {
  jalan: number;
  senam: number;
  tidur: number;
  percent?: number;
}

export interface DayHabits {
  week: number;
  dayIndex: number;
  supplements: SupplementState;
  water: WaterState;
  activity: ActivityState;
}

const suppKey = (week: number, day: number) => `bunda_${week}_${day}_suplemen`;
const waterKey = (week: number, day: number) => `bunda_${week}_${day}_hidrasi`;
const activityKey = (week: number, day: number) => `bunda_${week}_${day}_jasmani`;

function readJson<T>(key: string): T | null {
  try {
    const raw = storageGet(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  // Lewat setItemSafe: kalau kuota penuh, UI diberi tahu (jangan gagal diam-diam).
  setItemSafe(key, JSON.stringify(value));
}

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function readDayHabits(week: number, dayIndex: number): DayHabits {
  const supplements = (hasStorage() ? readJson<SupplementState>(suppKey(week, dayIndex)) : null) || {};
  const waterRaw = hasStorage() ? readJson<Partial<WaterState>>(waterKey(week, dayIndex)) : null;
  const activityRaw = hasStorage() ? readJson<Partial<ActivityState>>(activityKey(week, dayIndex)) : null;

  if (typeof supplements.count !== 'number') {
    supplements.count = Object.values(supplements).filter((v) => v === true).length;
  }

  return {
    week,
    dayIndex,
    supplements,
    water: {
      current: Number(waterRaw?.current ?? 0),
      target: Number(waterRaw?.target ?? WATER_TARGET_ML),
    },
    activity: {
      jalan: Number(activityRaw?.jalan ?? 0),
      senam: Number(activityRaw?.senam ?? 0),
      tidur: Number(activityRaw?.tidur ?? 0),
      percent: typeof activityRaw?.percent === 'number' ? activityRaw.percent : undefined,
    },
  };
}

export function notifyHabitsChanged(source = 'habit-store') {
  try {
    window.dispatchEvent(new CustomEvent(HABITS_EVENT, { detail: { source } }));
    // Kompatibilitas: listener lama mendengarkan event ini.
    window.dispatchEvent(new Event('bunda_journal_updated'));
  } catch {}
}

export function subscribeHabits(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = () => handler();
  window.addEventListener(HABITS_EVENT, listener);
  return () => window.removeEventListener(HABITS_EVENT, listener);
}

// ---------------------------------------------------------------------------
// Penulis (writer) — semua lewat sini
// ---------------------------------------------------------------------------
export function writeSupplements(week: number, dayIndex: number, next: SupplementState, silent = false) {
  const value: SupplementState = { ...next };
  value.count = Object.entries(value).filter(([k, v]) => k !== 'count' && v === true).length;
  writeJson(suppKey(week, dayIndex), value);
  if (!silent) notifyHabitsChanged('supplements');
}

export function writeWater(week: number, dayIndex: number, currentMl: number, silent = false) {
  const prev = readDayHabits(week, dayIndex).water;
  const value: WaterState = {
    current: Math.max(0, Math.round(currentMl)),
    target: prev.target || WATER_TARGET_ML,
  };
  writeJson(waterKey(week, dayIndex), value);
  if (!silent) notifyHabitsChanged('water');
}

export function writeActivity(week: number, dayIndex: number, patch: Partial<ActivityState>, silent = false) {
  const prev = readDayHabits(week, dayIndex).activity;
  const value: ActivityState = {
    jalan: Math.max(0, Number(patch.jalan ?? prev.jalan)),
    senam: Math.max(0, Number(patch.senam ?? prev.senam)),
    tidur: Math.max(0, Number(patch.tidur ?? prev.tidur)),
  };
  if (typeof patch.percent === 'number') value.percent = patch.percent;
  writeJson(activityKey(week, dayIndex), value);
  if (!silent) notifyHabitsChanged('activity');
}

/** Toggle satu id suplemen (dipakai Beranda: asamFolat, vitaminD, dst). */
export function setSupplementTaken(week: number, dayIndex: number, id: string, taken: boolean) {
  const current = readDayHabits(week, dayIndex).supplements;
  writeSupplements(week, dayIndex, { ...current, [id]: taken });
}

// ---------------------------------------------------------------------------
// Status "selesai" untuk satu kebiasaan (dipakai ceklis jurnal & widget)
// ---------------------------------------------------------------------------
export function isHabitDone(habits: DayHabits, kind: HabitKind): boolean {
  if (kind === 'vitamin') {
    const explicit = habits.supplements.vitamin;
    if (typeof explicit === 'boolean' && explicit) return true;
    return Number(habits.supplements.count || 0) >= 1;
  }
  if (kind === 'water') {
    return habits.water.current >= habits.water.target;
  }
  return habits.activity.jalan + habits.activity.senam >= ACTIVITY_TARGET_MIN;
}

/**
 * Toggle dari ceklis jurnal / UI baru.
 * Catatan penting: "matikan" tidak menghapus data nyata bila nilainya melebihi target
 * yang ditandai ceklis (mis. jalan 40 menit tidak jadi 0 hanya karena ceklis dimatikan).
 */
export function toggleHabitDone(week: number, dayIndex: number, kind: HabitKind, done: boolean) {
  const habits = readDayHabits(week, dayIndex);

  if (kind === 'vitamin') {
    const next: SupplementState = { ...habits.supplements, vitamin: done };
    if (done && Number(next.count || 0) < 1) next.count = 1;
    writeSupplements(week, dayIndex, next);
    return;
  }

  if (kind === 'water') {
    writeWater(week, dayIndex, done ? habits.water.target : 0);
    return;
  }

  // activity
  const total = habits.activity.jalan + habits.activity.senam;
  if (done) {
    if (total < ACTIVITY_TARGET_MIN) {
      writeActivity(week, dayIndex, { jalan: habits.activity.jalan + (ACTIVITY_TARGET_MIN - total) });
    }
  } else if (total <= ACTIVITY_TARGET_MIN) {
    // hanya hapus nilai yang memang dipakai untuk memenuhi ceklis
    writeActivity(week, dayIndex, { jalan: 0, senam: 0 });
  }
}

// ---------------------------------------------------------------------------
// Ringkasan mingguan (dipakai widget / laporan / PDF)
// ---------------------------------------------------------------------------
export interface WeekHabitDay {
  dayIndex: number;
  dayName: string;
  waterMl: number;
  waterTargetMl: number;
  supplementsTaken: number;
  activityMinutes: number;
  walkMinutes: number;
  workoutMinutes: number;
  sleepHours: number;
  vitaminDone: boolean;
  waterDone: boolean;
  activityDone: boolean;
  hasData: boolean;
}

export function getWeekHabits(week: number): WeekHabitDay[] {
  return DAY_NAMES.map((dayName, dayIndex) => {
    const habits = readDayHabits(week, dayIndex);
    const supplementsTaken = Number(habits.supplements.count || 0);
    const activityMinutes = habits.activity.jalan + habits.activity.senam;
    const vitaminDone = isHabitDone(habits, 'vitamin');
    const waterDone = isHabitDone(habits, 'water');
    const activityDone = isHabitDone(habits, 'activity');
    const hasData =
      supplementsTaken > 0 ||
      habits.water.current > 0 ||
      activityMinutes > 0 ||
      habits.activity.tidur > 0 ||
      habits.supplements.vitamin === true;

    return {
      dayIndex,
      dayName,
      waterMl: habits.water.current,
      waterTargetMl: habits.water.target,
      supplementsTaken,
      activityMinutes,
      walkMinutes: habits.activity.jalan,
      workoutMinutes: habits.activity.senam,
      sleepHours: habits.activity.tidur,
      vitaminDone,
      waterDone,
      activityDone,
      hasData,
    };
  });
}

export function getWeekHabitScore(week: number): {
  daysLogged: number;
  vitaminPct: number;
  waterPct: number;
  activityPct: number;
  overallPct: number;
} {
  const days = getWeekHabits(week);
  const total = days.length || 1;
  const vitamin = days.filter((d) => d.vitaminDone).length;
  const water = days.filter((d) => d.waterDone).length;
  const activity = days.filter((d) => d.activityDone).length;
  return {
    daysLogged: days.filter((d) => d.hasData).length,
    vitaminPct: Math.round((vitamin / total) * 100),
    waterPct: Math.round((water / total) * 100),
    activityPct: Math.round((activity / total) * 100),
    overallPct: Math.round(((vitamin + water + activity) / (total * 3)) * 100),
  };
}
