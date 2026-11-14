import { test, expect } from '@playwright/test';
import { openApp } from '../helpers/app';

test.describe('Buku jurnal /print', () => {
  test('menampilkan 100 halaman A4 dengan nama file benar', async ({ page }) => {
    await openApp(page, '/#/print');
    await page.waitForSelector('.print-book-spread');

    const pages = page.locator('.b5-page');
    await expect(pages).toHaveCount(100);

    const spreads = page.locator('.print-book-spread');
    await expect(spreads).toHaveCount(50);

    // ukuran halaman harus A4 (210 x 297 mm) pada 96 dpi
    const box = await pages.first().boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box!.width)).toBeGreaterThanOrEqual(790);
    expect(Math.round(box!.width)).toBeLessThanOrEqual(797);
    expect(Math.round(box!.height)).toBeGreaterThanOrEqual(1119);
    expect(Math.round(box!.height)).toBeLessThanOrEqual(1126);

    // nama file diambil dari judul dokumen (dipakai dialog print)
    await expect(page).toHaveTitle(/Bunda Journal - Bunda Una - Ash - \d{4}-\d{2}-\d{2}/);
  });

  test('halaman mingguan memuat catatan, kurva, dan ceklis', async ({ page }) => {
    await openApp(page, '/#/print');
    await page.waitForSelector('.print-book-spread');

    // spread ke-19 = Week 19
    const spread = page.locator('.print-book-spread').nth(19);
    await expect(spread).toContainText('Week 19');
    await expect(spread).toContainText('Pemantauan minggu ini');
    await expect(spread).toContainText('Ceklis Kesehatan');
    await expect(spread).toContainText('Tidur');
    await expect(spread).toContainText('Vitamin');
    await expect(spread).toContainText('Asam folat');
    await expect(spread).toContainText('Zat besi');
    await expect(spread).toContainText('Kesimpulan');
    await expect(spread).toContainText('Streak');
    await expect(spread).toContainText('Ayah bikin bubur ayam');

    // activity rings harus tergambar (3 cincin: vitamin, air, gerak)
    const rings = spread.locator('svg circle[stroke-dasharray]');
    await expect(rings).toHaveCount(3);
  });

  test('halaman kanan memuat statistik dan catatan dokter', async ({ page }) => {
    await openApp(page, '/#/print');
    await page.waitForSelector('.print-book-spread');

    const rightPage = page.locator('.print-book-spread').nth(19).locator('.b5-page').nth(1);
    await expect(rightPage.locator('input').nth(0)).toHaveValue(/54\.5/);
    await expect(rightPage.locator('input').nth(2)).toHaveValue(/118\/76/);
    await expect(rightPage).toContainText('Catatan Dokter / Pertanyaan Konsul');
    await expect(rightPage).toContainText('Panjang janin 15.3 cm');
  });
});
