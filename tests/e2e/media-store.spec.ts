import { test, expect } from '@playwright/test';
import { preparePage } from '../helpers/app';
import { readIdb } from '../helpers/idb';

/**
 * Foto & isi bab buku pindah dari localStorage (~5 MB) ke IndexedDB.
 * Key lama harus dimigrasikan otomatis saat boot, tanpa kehilangan data.
 */
test.describe('Media store — foto ke IndexedDB', () => {
  test('key media lama dipindah ke IndexedDB dan hilang dari localStorage', async ({ page }) => {
    await preparePage(page);

    // Semai SEBELUM app boot (bukan di tengah sesi) supaya tidak ada tulisan IDB
    // dari sesi sebelumnya yang ikut berlomba.
    await page.addInitScript(() => {
      if (sessionStorage.getItem('__media_seeded__')) return;
      sessionStorage.setItem('__media_seeded__', '1');
      localStorage.setItem(
        'bunda_photos',
        JSON.stringify([{ week: 20, src: 'data:image/png;base64,AAA', caption: 'USG minggu 20' }])
      );
      localStorage.setItem('bunda_bab1', JSON.stringify({ testPackDate: '2026-11-01' }));
      localStorage.removeItem('bunda_media_index');
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => localStorage.getItem('bunda_photos') === null, null, { timeout: 20_000 });

    const after = await page.evaluate(() => ({
      photos: localStorage.getItem('bunda_photos'),
      bab1: localStorage.getItem('bunda_bab1'),
      index: JSON.parse(localStorage.getItem('bunda_media_index') || '[]') as string[],
    }));

    expect(after.photos).toBeNull();
    expect(after.bab1).toBeNull();
    expect(after.index).toEqual(expect.arrayContaining(['bunda_photos', 'bunda_bab1']));

    const photosInIdb = await readIdb(page, 'bunda_photos');
    expect(photosInIdb).toContain('USG minggu 20');

    // Reload lagi: data harus tetap ada (dibaca dari IDB, bukan localStorage).
    await page.reload({ waitUntil: 'domcontentloaded' });
    const photosAfterReload = await readIdb(page, 'bunda_photos');
    expect(photosAfterReload).toContain('USG minggu 20');
    expect(await page.evaluate(() => localStorage.getItem('bunda_photos'))).toBeNull();
  });
});
