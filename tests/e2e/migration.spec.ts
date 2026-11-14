import { test, expect } from '@playwright/test';
import { openApp, preparePage } from '../helpers/app';
import { readIdb } from '../helpers/idb';

/**
 * Regresi bug pemetaan hari:
 * dulu storage memakai 0=Rabu..6=Selasa, sekarang 0=Senin..6=Minggu.
 * Data lama harus digeser +2 mod 7, tanpa menyentuh key berbasis nama hari
 * atau slot foto (`bunda_{week}_foto_{i}`).
 */
test.describe('Migrasi skema hari (Rab=0 -> Sen=0)', () => {
  test('key index-harian digeser, key nama hari dan slot foto tetap', async ({ page }) => {
    await preparePage(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('bunda_12_0_catatan', JSON.stringify({ text: 'Rabu' })); // Rab -> 2
      localStorage.setItem('bunda_12_6_catatan', JSON.stringify({ text: 'Selasa' })); // Sel -> 1
      localStorage.setItem('bunda_12_5_suplemen', JSON.stringify({ vitamin: true })); // Sen -> 0
      localStorage.setItem('bunda_12_1_hidrasi', JSON.stringify({ current: 900 })); // Kam -> 3
      localStorage.setItem('bunda_12_foto_0', JSON.stringify({ url: 'slot-0' })); // slot: tetap
      localStorage.setItem('bunda_daily_moods_w12', JSON.stringify([0, 1, 2, 3, 4, 5, 6]));
      localStorage.setItem('bunda_daily_w12', JSON.stringify({ Sen: 'catatan senin' }));
      localStorage.removeItem('bunda_schema_version');
    });

    await page.reload({ waitUntil: 'domcontentloaded' });

    const state = await page.evaluate(() => ({
      version: localStorage.getItem('bunda_schema_version'),
      rabu: localStorage.getItem('bunda_12_2_catatan'),
      selasa: localStorage.getItem('bunda_12_1_catatan'),
      senin: localStorage.getItem('bunda_12_0_suplemen'),
      kamis: localStorage.getItem('bunda_12_3_hidrasi'),
      slotFotoLama: localStorage.getItem('bunda_12_foto_0'),
      mediaIndex: JSON.parse(localStorage.getItem('bunda_media_index') || '[]') as string[],
      namaHari: localStorage.getItem('bunda_daily_w12'),
      moods: localStorage.getItem('bunda_daily_moods_w12'),
      backupTersisa: localStorage.getItem('bunda_schema_backup_v1'),
    }));

    expect(state.version).toBe('1');
    expect(JSON.parse(state.rabu as string).text).toBe('Rabu');
    expect(JSON.parse(state.selasa as string).text).toBe('Selasa');
    expect(JSON.parse(state.senin as string).vitamin).toBe(true);
    expect(JSON.parse(state.kamis as string).current).toBe(900);
    // Slot foto bukan data harian: key tidak berubah, tapi pindah ke IndexedDB.
    expect(state.slotFotoLama).toBeNull();
    expect(state.mediaIndex).toContain('bunda_12_foto_0');
    expect(await readIdb(page, 'bunda_12_foto_0')).toContain('slot-0');
    expect(JSON.parse(state.namaHari as string).Sen).toBe('catatan senin');
    // mood: index lama o pindah ke (o+2)%7
    expect(JSON.parse(state.moods as string)).toEqual([5, 6, 0, 1, 2, 3, 4]);
    expect(state.backupTersisa).toBeNull();
  });

  test('idempoten: reload kedua tidak menggeser data lagi', async ({ page }) => {
    await preparePage(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('bunda_13_0_catatan', JSON.stringify({ text: 'Rabu' }));
      localStorage.removeItem('bunda_schema_version');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const state = await page.evaluate(() => ({
      baru: localStorage.getItem('bunda_13_2_catatan'),
      lama: localStorage.getItem('bunda_13_0_catatan'),
      version: localStorage.getItem('bunda_schema_version'),
    }));
    expect(state.version).toBe('1');
    expect(JSON.parse(state.baru as string).text).toBe('Rabu');
    expect(state.lama).toBeNull();
  });

  test('strip hari dimulai dari SENIN', async ({ page }) => {
    await openApp(page, '/#/jurnal');
    await page.waitForSelector('#btn-day-strip-0');
    await expect(page.locator('#btn-day-strip-0')).toContainText('SEN');
    await expect(page.locator('#btn-day-strip-6')).toContainText('MIN');
  });
});
