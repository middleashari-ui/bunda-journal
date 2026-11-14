import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { installBrowserGlobals, MemoryStorage } from './helpers';

let habits: typeof import('../../src/lib/habitStore');
let jasmani: typeof import('../../src/lib/jasmaniStore');
let storage: MemoryStorage;

beforeAll(async () => {
  storage = installBrowserGlobals();
  habits = await import('../../src/lib/habitStore');
  jasmani = await import('../../src/lib/jasmaniStore');
});

beforeEach(() => {
  storage.clear();
  storage.setItem('bunda_profile', JSON.stringify({ hplDate: '2027-01-20' }));
});

describe('jasmaniStore — ringkasan harian, mingguan, bulanan', () => {
  it('minggu penuh mencapai 100% untuk jalan, senam, dan tidur', () => {
    for (let d = 0; d < 7; d += 1) {
      habits.writeActivity(5, d, { jalan: 15, senam: 10, tidur: 8 });
    }
    const week = jasmani.getWeeklyJasmani(5);
    expect(week.jalanMin).toBe(105);
    expect(week.senamMin).toBe(70);
    expect(week.tidurAvg).toBe(8);
    expect(week.pct).toEqual({ jalan: 100, senam: 100, tidur: 100 });
  });

  it('menghitung persentase dari target harian jurnal', () => {
    habits.writeActivity(6, 0, { jalan: 30, senam: 5, tidur: 6 });
    const day = jasmani.getDailyJasmani(6, 0);
    expect(day.jalanMin).toBe(30);
    expect(day.pct.jalan).toBe(100); // 30 / 15 → dijepit 100
    expect(day.pct.senam).toBe(50); // 5 / 10
    expect(day.pct.tidur).toBe(75); // 6 / 8
  });

  it('hari tanpa data tidak menghasilkan persentase palsu', () => {
    const day = jasmani.getDailyJasmani(7, 2);
    expect(day.days).toBe(0);
    expect(day.jalanMin).toBe(0);
    expect(day.pct).toEqual({ jalan: 0, senam: 0, tidur: 0 });
  });

  it('saveJasmaniForWeek menyimpan kesimpulan harian & mingguan', () => {
    for (let d = 0; d < 7; d += 1) {
      habits.writeActivity(8, d, { jalan: 20, senam: 10, tidur: 7 });
    }
    const weekly = jasmani.saveJasmaniForWeek(8);
    expect(weekly.period).toBe('weekly');
    expect(weekly.key).toBe('w8');

    const storedWeekly = jasmani.loadJasmaniSummary('weekly', 'w8');
    expect(storedWeekly?.jalanMin).toBe(140);
    const storedDaily = jasmani.loadJasmaniSummary('daily', 'w8d0');
    expect(storedDaily?.jalanMin).toBe(20);
  });

  it('ringkasan bulanan menjumlahkan hari pada bulan tersebut', () => {
    for (let d = 0; d < 7; d += 1) {
      habits.writeActivity(9, d, { jalan: 15, senam: 10, tidur: 8 });
    }
    const monthly = jasmani.getMonthlyJasmani(2026, 5); // Juni 2026 (minggu 9)
    expect(monthly.period).toBe('monthly');
    expect(monthly.days).toBe(7);
    expect(monthly.jalanMin).toBe(105);
  });
});
