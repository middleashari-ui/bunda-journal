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

    // Mengetik lebih dari 160 karakter harus dipotong (emoji dihitung 1).
    await note.fill('a'.repeat(200));
    await expect(note).toHaveValue('a'.repeat(160));
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
