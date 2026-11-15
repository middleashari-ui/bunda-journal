// ============================================================================
// JASMANI STORE — ringkasan aktivitas jasmani dari catatan jurnal.
//
// Sumber data (sama dengan input Jurnal/Beranda):
//   bunda_{week}_{day}_jasmani -> { jalan, senam, tidur }
//
// Ringkasan disimpan per periode sebagai "kesimpulan":
//   - harian : bunda_jasmani_daily_w{week}d{day}
//   - mingguan: bunda_jasmani_weekly_w{week}
//   - bulanan : bunda_jasmani_monthly_{YYYY-MM}
// ============================================================================

import { getWeekDatesMonday } from './pregnancyDate';
import { getWeekHabits, readDayHabits, subscribeHabits } from './habitStore';
import { storageGetJson, storageSetJson } from './storage/appStorage';

export const JASMANI_TARGETS = {
  /** Target jalan per hari (menit). */
  jalanDailyMin: 15,
  /** Target senam per hari (menit). */
  senamDailyMin: 10,
  /** Target tidur per hari (jam). */
  sleepHours: 8,
};

export type JasmaniPeriod = 'daily' | 'weekly' | 'monthly';

export interface JasmaniSummary {
  period: JasmaniPeriod;
  key: string;
  days: number;
  jalanMin: number;
  senamMin: number;
  tidurAvg: number;
  pct: { jalan: number; senam: number; tidur: number };
  conclusion: string;
  updatedAt: string;
}

const clampPct = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

function buildSummary(
  period: JasmaniPeriod,
  key: string,
  rows: Array<{ jalan: number; senam: number; tidur: number }>
): JasmaniSummary {
  const days = rows.filter((r) => r.jalan > 0 || r.senam > 0 || r.tidur > 0).length;
  const jalanMin = rows.reduce((acc, r) => acc + Math.max(0, Number(r.jalan) || 0), 0);
  const senamMin = rows.reduce((acc, r) => acc + Math.max(0, Number(r.senam) || 0), 0);
  const sleepVals = rows.map((r) => Number(r.tidur) || 0).filter((v) => v > 0);
  const tidurAvg = sleepVals.length ? sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length : 0;

  const divisor = Math.max(1, rows.length);
  const targetJalan = JASMANI_TARGETS.jalanDailyMin * divisor;
  const targetSenam = JASMANI_TARGETS.senamDailyMin * divisor;
  const pct = {
    jalan: clampPct((jalanMin / targetJalan) * 100),
    senam: clampPct((senamMin / targetSenam) * 100),
    tidur: clampPct((tidurAvg / JASMANI_TARGETS.sleepHours) * 100),
  };

  const conclusion =
    `Jalan ${jalanMin} mnt (target ${targetJalan}) · senam ${senamMin} mnt (target ${targetSenam})` +
    ` · tidur ${tidurAvg ? tidurAvg.toFixed(1) : '—'} jam/hari (target ${JASMANI_TARGETS.sleepHours}).`;

  return {
    period,
    key,
    days,
    jalanMin,
    senamMin,
    tidurAvg,
    pct,
    conclusion,
    updatedAt: new Date().toISOString(),
  };
}

export function getDailyJasmani(week: number, dayIndex: number): JasmaniSummary {
  const activity = readDayHabits(week, dayIndex).activity;
  return buildSummary('daily', `w${week}d${dayIndex}`, [activity]);
}

export function getWeeklyJasmani(week: number): JasmaniSummary {
  const habits = getWeekHabits(week);
  const rows = habits.map((h) => ({
    jalan: h.walkMinutes,
    senam: h.workoutMinutes,
    tidur: h.sleepHours,
  }));
  return buildSummary('weekly', `w${week}`, rows);
}

/** Ringkasan bulanan dari seluruh hari yang tanggalnya jatuh di bulan tsb. */
export function getMonthlyJasmani(year: number, month: number): JasmaniSummary {
  const rows: Array<{ jalan: number; senam: number; tidur: number }> = [];
  for (let week = 1; week <= 40; week += 1) {
    const dates = getWeekDatesMonday(week);
    for (let day = 0; day < 7; day += 1) {
      const date = dates[day];
      if (!date) continue;
      if (date.getFullYear() !== year || date.getMonth() !== month) continue;
      rows.push(readDayHabits(week, day).activity);
    }
  }
  return buildSummary('monthly', `${year}-${String(month + 1).padStart(2, '0')}`, rows);
}

export function loadJasmaniSummary(period: JasmaniPeriod, key: string): JasmaniSummary | null {
  return storageGetJson<JasmaniSummary | null>(`bunda_jasmani_${period}_${key}`, null);
}

function save(summary: JasmaniSummary) {
  storageSetJson(`bunda_jasmani_${summary.period}_${summary.key}`, summary);
}

/**
 * Hitung & simpan kesimpulan harian, mingguan, dan bulanan untuk satu minggu.
 * Dipanggil saat halaman minggu dibuka dan setiap kali kebiasaan berubah.
 */
export function saveJasmaniForWeek(week: number): JasmaniSummary {
  for (let day = 0; day < 7; day += 1) {
    save(getDailyJasmani(week, day));
  }

  const weekly = getWeeklyJasmani(week);
  save(weekly);

  const monday = getWeekDatesMonday(week)[0];
  if (monday) {
    save(getMonthlyJasmani(monday.getFullYear(), monday.getMonth()));
  }

  return weekly;
}

/** Simpan otomatis saat tab buku terbuka & saat data jasmani berubah. */
export function subscribeJasmaniSummary(week: number, onChange?: (s: JasmaniSummary) => void): () => void {
  const run = () => {
    try {
      const summary = saveJasmaniForWeek(week);
      onChange?.(summary);
    } catch {}
  };
  run();
  return subscribeHabits(run);
}
