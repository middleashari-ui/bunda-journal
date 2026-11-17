import { test, expect } from '@playwright/test';
import { openApp } from '../helpers/app';

test.describe('Jurnal — struktur baru', () => {
  test('tab bab ringkas dan footer legal sudah hilang', async ({ page }) => {
    await openApp(page, '/#/jurnal');
    await page.waitForSelector('#textarea-catatan-harian');

    const chapterNav = page.getByRole('main').getByRole('button', { name: /Jurnal|Awal|Persiapan|Lahir|Kapsul/ });
    for (const label of ['Jurnal', 'Awal', 'Persiapan', 'Lahir', 'Kapsul']) {
      await expect(chapterNav.filter({ hasText: label }).first()).toBeVisible();
    }

    await expect(page.locator('footer')).toHaveCount(0);
    await expect(page.getByText('Tentang Kami')).toHaveCount(0);
  });

  test('riwayat catatan ringkas dan bisa dibuka', async ({ page }) => {
    await openApp(page, '/#/jurnal');
    await page.waitForSelector('#textarea-catatan-harian');

    const riwayat = page.getByText('Riwayat catatan', { exact: true }).first();
    await riwayat.scrollIntoViewIfNeeded();
    await expect(page.getByText(/\d\/7 hari terisi minggu ini/)).toBeVisible();

    await page.getByRole('button', { name: /^Lihat$/ }).first().click();
    await expect(page.getByText('Belum ada catatan').first()).toBeVisible();
  });

  test('catatan harian dibatasi 160 karakter dan 2 baris', async ({ page }) => {
    await openApp(page, '/#/jurnal');
    const note = page.locator('#textarea-catatan-harian');
    await expect(note).toHaveAttribute('maxLength', '160');
    await expect(note).toHaveAttribute('rows', '2');

    // Mengetik lebih dari 160 karakter harus dipotong dan tetap muat 2 baris.
    await note.fill('a'.repeat(200));
    const value = await note.inputValue();
    expect(value.length).toBeGreaterThan(0);
    expect(value.length).toBeLessThanOrEqual(160);
    const fitsTwoLines = await note.evaluate((el) => {
      const ta = el as HTMLTextAreaElement;
      const style = getComputedStyle(ta);
      const lineHeight = parseFloat(style.lineHeight) || 20;
      const padding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
      const twoLineLimit = Math.max(lineHeight * 2 + padding + 2, ta.clientHeight + 2);
      return ta.scrollHeight <= twoLineLimit;
    });
    expect(fitsTwoLines).toBe(true);
  });

  test('catatan harian terpisah per hari dan hari baru mulai kosong', async ({ page }) => {
    await openApp(page, '/#/jurnal');
    const note = page.locator('#textarea-catatan-harian');
    await expect(note).toBeVisible();

    // Senin punya catatan dari fixture, Kamis kosong.
    await page.click('#btn-day-strip-0');
    await expect(note).toHaveValue(/Ayah bikin bubur/);

    await page.click('#btn-day-strip-3');
    await expect(note).toHaveValue('');

    await note.fill('Catatan baru hari Kamis');
    await page.waitForTimeout(450);

    // Kembali ke Senin: catatan lama tidak tertimpa catatan Kamis.
    await page.click('#btn-day-strip-0');
    await expect(note).toHaveValue(/Ayah bikin bubur/);

    // Kamis tetap menyimpan catatannya sendiri.
    await page.click('#btn-day-strip-3');
    await expect(note).toHaveValue('Catatan baru hari Kamis');
  });

  test('kartu jadwal kontrol menampilkan data dan tombol kirim', async ({ page }) => {
    await openApp(page, '/#/jurnal');
    await page.waitForSelector('#tour-step-jadwal');

    const card = page.locator('#tour-step-jadwal');
    await expect(card).toContainText('Jadwal kontrol');
    await expect(card).toContainText('dr. Ayu Prameswari');
    await expect(card).toContainText('Sudah booking');
    await expect(card.getByRole('button', { name: /Kirim ke Ayah/ })).toBeEnabled();
  });
});
