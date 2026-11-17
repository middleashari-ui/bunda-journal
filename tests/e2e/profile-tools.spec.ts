import { test, expect } from '@playwright/test';
import { openApp } from '../helpers/app';

test.describe('Profil — alat bantu & riwayat', () => {
  test('hitungan tendangan menyimpan riwayat otomatis dengan waktu', async ({ page }) => {
    await openApp(page);
    await page.locator('#dev-toolbar').evaluate((el) => el.remove()).catch(() => {});
    await page.getByRole('button', { name: 'Profil', exact: true }).click();

    await page.getByRole('button', { name: /Hitung Tendangan/i }).click();
    const dialog = page.getByRole('dialog', { name: 'Hitung Gerak Janin' });
    await expect(dialog).toBeVisible();

    const heart = dialog.getByRole('button', { name: /Tambah gerakan/ });
    await heart.click();
    await heart.click();
    await expect(dialog.getByText('2', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Selesai' }).click();

    // Buka lagi: riwayat sesi muncul tanpa mengisi jam manual.
    await page.getByRole('button', { name: /Hitung Tendangan/i }).click();
    await expect(page.getByRole('dialog', { name: 'Hitung Gerak Janin' })).toContainText('Sesi 1: 2 gerakan');
    await expect(page.getByText(/Sesi 1/)).toBeVisible();
  });

  test('timer kontraksi menyimpan daftar kontraksi berurutan', async ({ page }) => {
    await openApp(page);
    await page.locator('#dev-toolbar').evaluate((el) => el.remove()).catch(() => {});
    await page.getByRole('button', { name: 'Profil', exact: true }).click();

    await page.getByRole('button', { name: /Timer Kontraksi/i }).click();
    const dialog = page.getByRole('dialog', { name: 'Timer Kontraksi' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Mulai Kontraksi' }).click();
    await page.waitForTimeout(1200);
    await dialog.getByRole('button', { name: 'Hentikan Kontraksi' }).click();
    await expect(dialog).toContainText(/Kontraksi #1/);
    await expect(dialog).toContainText(/[12] detik/);
  });

  test('isi otomatis jurnal menampilkan review sebelum disimpan', async ({ page }) => {
    await openApp(page);
    await page.locator('#dev-toolbar').evaluate((el) => el.remove()).catch(() => {});
    await page.getByRole('button', { name: 'Profil', exact: true }).click();

    await page.getByRole('button', { name: /Isi otomatis hari yang terlewat/i }).click();
    const dialog = page.getByRole('dialog', { name: /Isi otomatis hari yang terlewat/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/contoh kalimat/i);
    await expect(dialog.getByRole('button', { name: /Terapkan/ })).toBeVisible();

    await dialog.getByRole('button', { name: 'Batal' }).click();
    await expect(page.getByRole('dialog', { name: /Isi otomatis/i })).toHaveCount(0);
  });

  test('pengingat muncul sebagai pop-up saat app dibuka dan membuka Jurnal', async ({ page }) => {
    await openApp(page);
    await page.evaluate(() => {
      const raw = localStorage.getItem('bunda_reminder_settings');
      const settings = raw ? JSON.parse(raw) : {};
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      localStorage.setItem(
        'bunda_reminder_settings',
        JSON.stringify({ ...settings, enabled: true, journalTime: hhmm, vitaminTime: '23:59' })
      );
      localStorage.removeItem('bunda_last_journal_date');
    });

    await page.reload();
    const dialog = page.getByRole('dialog', { name: /Isi jurnal/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Pengingat Bunda');

    await dialog.getByRole('button', { name: 'Buka Jurnal' }).click();
    await expect(page.locator('#textarea-catatan-harian')).toBeVisible();
    await expect(page.getByRole('dialog', { name: /Isi jurnal/i })).toHaveCount(0);
  });

  test('tombol contoh menampilkan pop-up pengingat', async ({ page }) => {
    await openApp(page);
    await page.locator('#dev-toolbar').evaluate((el) => el.remove()).catch(() => {});
    await page.getByRole('button', { name: 'Profil', exact: true }).click();

    await page.getByRole('button', { name: 'Tampilkan Contoh Pop-up' }).click();
    const dialog = page.getByRole('dialog', { name: /Contoh pengingat/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('tampilan pengingat di HP Bunda sudah benar');
    await dialog.getByRole('button', { name: 'Nanti' }).click();
    await expect(page.getByRole('dialog', { name: /Contoh pengingat/i })).toHaveCount(0);
  });

  test('notifikasi custom bisa ditambahkan dan disimpan', async ({ page }) => {
    await openApp(page);
    await page.locator('#dev-toolbar').evaluate((el) => el.remove()).catch(() => {});
    await page.getByRole('button', { name: 'Profil', exact: true }).click();

    await page.getByLabel('Judul notifikasi custom').fill('Minum obat');
    await page.getByLabel('Pesan notifikasi custom').fill('Habiskan setelah makan');
    await page.getByRole('button', { name: '+ Tambah' }).click();

    await expect(page.getByText('Minum obat', { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/1 pengingat/)).toBeVisible();

    // Tetap ada setelah reload (tersimpan di pengaturan).
    await page.reload();
    await page.locator('#dev-toolbar').evaluate((el) => el.remove()).catch(() => {});
    await page.getByRole('button', { name: 'Profil', exact: true }).click();
    await expect(page.getByText('Minum obat', { exact: false }).first()).toBeVisible();
  });
});
