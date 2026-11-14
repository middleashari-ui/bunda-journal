import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { installBrowserGlobals, MemoryStorage } from './helpers';

// Modul habitStore membaca localStorage saat fungsi dipanggil, jadi global
// dipasang dulu, baru modul diimpor secara dinamis.
let habitStore: typeof import('../../src/lib/habitStore');
let storage: MemoryStorage;

beforeAll(async () => {
  storage = installBrowserGlobals();
  habitStore = await import('../../src/lib/habitStore');
});

beforeEach(() => {
  storage.clear();
});

describe('habitStore — index hari Sen=0 … Min=6', () => {
  it('menyimpan & membaca suplemen, hidrasi, jasmani per hari', () => {
    habitStore.writeSupplements(19, 0, { vitamin: true, asamFolat: true });
    habitStore.writeWater(19, 0, 1500);
    habitStore.writeActivity(19, 0, { jalan: 20, tidur: 7 });

    const day = habitStore.readDayHabits(19, 0);
    expect(day.supplements.count).toBe(2);
    expect(day.water.current).toBe(1500);
    expect(day.water.target).toBe(habitStore.WATER_TARGET_ML);
    expect(day.activity.jalan).toBe(20);
    expect(day.activity.tidur).toBe(7);
  });

  it('menulis ke key bunda_{week}_{day}_* apa adanya', () => {
    habitStore.writeWater(20, 3, 900);
    expect(JSON.parse(storage.getItem('bunda_20_3_hidrasi') as string).current).toBe(900);
  });

  it('getWeekHabits mengembalikan 7 hari berurutan Senin–Minggu', () => {
    const days = habitStore.getWeekHabits(21);
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.dayName)).toEqual(['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']);
    expect(days.map((d) => d.dayIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('toggle ceklis air mengisi target dan mengosongkan saat dimatikan', () => {
    habitStore.toggleHabitDone(22, 1, 'water', true);
    expect(habitStore.readDayHabits(22, 1).water.current).toBe(habitStore.WATER_TARGET_ML);
    expect(habitStore.isHabitDone(habitStore.readDayHabits(22, 1), 'water')).toBe(true);

    habitStore.toggleHabitDone(22, 1, 'water', false);
    expect(habitStore.readDayHabits(22, 1).water.current).toBe(0);
  });

  it('toggle aktivitas tidak menghapus menit nyata di atas target', () => {
    habitStore.writeActivity(23, 2, { jalan: 40 });
    habitStore.toggleHabitDone(23, 2, 'activity', false);
    expect(habitStore.readDayHabits(23, 2).activity.jalan).toBe(40);
  });

  it('toggle vitamin mempertahankan suplemen lain', () => {
    habitStore.writeSupplements(24, 0, { asamFolat: true });
    habitStore.toggleHabitDone(24, 0, 'vitamin', true);
    const supp = habitStore.readDayHabits(24, 0).supplements;
    expect(supp.asamFolat).toBe(true);
    expect(supp.vitamin).toBe(true);
  });

  it('hidrasi negatif dijepit ke 0', () => {
    habitStore.writeWater(25, 0, -500);
    expect(habitStore.readDayHabits(25, 0).water.current).toBe(0);
  });
});
