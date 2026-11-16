import { test, expect } from '@playwright/test';

test.describe('Checkout — gerbang pembayaran', () => {
  test('meminta email valid sebelum membuka langkah bayar', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Miliki VIP/ }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Pembayaran' });
    await expect(dialog).toBeVisible();

    // Tanpa email: tetap di langkah paket dan tampilkan error.
    await page.getByRole('button', { name: /Lanjut Pembayaran/ }).click();
    await expect(dialog.getByText('Format email belum benar.')).toBeVisible();
    await expect(dialog.getByText('Bayar lewat Midtrans Snap')).toHaveCount(0);

    // Email valid: masuk ke langkah bayar, tanpa QR palsu.
    await page.fill('#checkout-email', 'bunda@example.com');
    await page.getByRole('button', { name: /Lanjut Pembayaran/ }).click();
    await expect(dialog.getByText('Bayar lewat Midtrans Snap')).toBeVisible();
    await expect(dialog).toContainText('bunda@example.com');
    await expect(dialog.getByText(/NMID:/)).toHaveCount(0);
  });

  test('kill switch server tampil sebagai pesan maintenance, bukan bayar', async ({ page }) => {
    await page.route('**/api/midtrans/charge', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Pembayaran sedang dalam perbaikan. Coba lagi nanti.', maintenance: true }),
      })
    );
    await page.goto('/');
    await page.getByRole('button', { name: /Miliki VIP/ }).first().click();
    await page.fill('#checkout-email', 'bunda@example.com');
    await page.getByRole('button', { name: /Lanjut Pembayaran/ }).click();
    await page.getByRole('button', { name: /Tampilkan QRIS Snap/ }).click();
    await expect(page.getByText('Pembayaran sedang dalam perbaikan. Coba lagi nanti.')).toBeVisible();
  });
});
