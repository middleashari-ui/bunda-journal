import { test, expect } from '@playwright/test';
import { openApp } from '../helpers/app';

test.describe('Beranda — widget cerita mingguan', () => {
  test('menampilkan ritme, streak, kata, dan momen minggu ini', async ({ page }) => {
    await openApp(page);
    await page.locator('#dev-toolbar').evaluate((el) => el.remove()).catch(() => {});

    const widget = page.locator('[data-testid="dashboard-story"]');
    await expect(widget).toBeVisible();

    await expect(widget).toContainText('Cerita minggu 19');
    await expect(widget).toContainText('Ritme minggu ini');
    await expect(widget).toContainText('Momen minggu ini');
    await expect(widget).toContainText('Gerak & Tidur Bunda');
    await expect(widget).toContainText('Jalan');
  });

  test('tab Harian menampilkan detail hari dan CTA jurnal', async ({ page }) => {
    await openApp(page);
    const widget = page.locator('[data-testid="dashboard-story"]');
    await expect(widget).toBeVisible();

    await widget.getByRole('button', { name: 'harian', exact: true }).click();
    await expect(widget).toContainText('Lanjut menulis di Jurnal');
    await expect(widget).toContainText('vitamin');
    await expect(widget).toContainText('liter');
  });

  test('data kebiasaan dari store muncul sebagai angka nyata', async ({ page }) => {
    await openApp(page);
    const widget = page.locator('[data-testid="dashboard-story"]');

    // 7 hari terisi, total gerak 140 menit
    await expect(widget).toContainText('7 hari sudah tercatat');
  });
});
