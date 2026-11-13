import { test, expect } from '@playwright/test';
import { openApp } from '../helpers/app';

// Visual baseline dijalankan lokal (font & OS sama). Di CI dilewati karena
// rendering font antar-OS berbeda dan akan menghasilkan false positive.
test.skip(!!process.env.CI, 'visual baseline hanya untuk lokal');

const PAGES = [0, 19, 43, 45, 48];

test.describe('Buku jurnal — visual baseline', () => {
  test('halaman kunci tetap stabil', async ({ page }) => {
    await openApp(page, '/#/print');
    await page.waitForSelector('.print-book-spread');

    for (const idx of PAGES) {
      const pageEl = page.locator('.print-book-spread').nth(idx).locator('.b5-page').first();
      await pageEl.scrollIntoViewIfNeeded();
      await expect(pageEl).toHaveScreenshot(`book-page-${idx}.png`, {
        maxDiffPixelRatio: 0.01,
        animations: 'disabled',
      });
    }
  });
});
