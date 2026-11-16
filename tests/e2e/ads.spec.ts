import { expect, test } from '@playwright/test';

test.describe('Ruang Iklan', () => {
  test.use({ viewport: { width: 1440, height: 950 } });

  test('dashboard demo tampil dengan keputusan dan chart', async ({ page }) => {
    await page.goto('/ads');
    await expect(page.getByTestId('pulse-page')).toBeVisible();
    await expect(page.getByTestId('decision-card')).toContainText('Keputusan hari ini');
    await expect(page.getByTestId('decision-card')).toContainText(/Tahan|Naikkan|Hentikan/);
    await expect(page.getByText('Mode demo').first()).toBeVisible();
    await expect(page.getByTestId('performance-chart')).toBeVisible();
    await expect(page.getByText('Uang vs Meta')).toBeVisible();  });

  test('navigasi tab dan kalkulator menghitung', async ({ page }) => {
    await page.goto('/ads');
    await page.locator('.ads-nav').getByRole('button', { name: 'Iklan' }).click();
    await expect(page.getByTestId('ads-page')).toBeVisible();
    await expect(page.getByText('VIP-Interest-01').first()).toBeVisible();

    await page.locator('.ads-nav').getByRole('button', { name: 'Rencana' }).click();
    await expect(page.getByTestId('plan-page')).toBeVisible();
    await page.getByTestId('calc-breakeven').click();
    await expect(page.getByTestId('calculator-modal')).toBeVisible();
    await expect(page.getByTestId('calculator-output')).toContainText('BE ROAS');
    await expect(page.getByTestId('calculator-output')).toContainText('BE CPA');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('calculator-modal')).toHaveCount(0);
  });

  test('validasi token menolak input salah dan menerima format benar', async ({ page }) => {
    await page.goto('/ads/pengaturan');
    await expect(page.getByTestId('settings-page')).toBeVisible();
    await page.getByRole('button', { name: 'Hubungkan Meta' }).last().click();
    await expect(page.getByTestId('connect-modal')).toBeVisible();

    await page.getByTestId('token-input').fill('bukan-token-yang-cukup-panjang');
    await page.getByRole('button', { name: 'Validasi token' }).click();
    await expect(page.getByTestId('token-error')).toContainText('diawali EAA');

    await page.getByTestId('token-input').fill('EAABdemo_token_123456789012345');
    await page.getByRole('button', { name: 'Validasi token' }).click();
    await expect(page.getByTestId('token-success')).toContainText('Format token valid');
    await expect(page.getByTestId('token-success')).toContainText('tidak disimpan');
  });

  test('approval pause tidak mengeksekusi tanpa persetujuan', async ({ page }) => {
    await page.goto('/ads');
    await page.locator('.ads-nav').getByRole('button', { name: 'Iklan' }).click();
    await expect(page.getByTestId('ads-page')).toBeVisible();

    await page.locator('.ads-table tbody tr').first().click();
    await expect(page.getByTestId('campaign-drawer')).toBeVisible();
    await page.getByRole('button', { name: /Usul hentikan/ }).click();
    await expect(page.getByTestId('approval-modal')).toBeVisible();
    await expect(page.getByTestId('approval-modal')).toContainText('tidak dikirim ke Meta');

    const approve = page.getByRole('button', { name: /Setujui & hentikan/ });
    await expect(approve).toBeDisabled();
    await page.getByLabel('Saya paham risiko dan ingin melanjutkan.').check();
    await expect(approve).toBeEnabled();
    await approve.click();
    await expect(page.getByTestId('approval-modal')).toHaveCount(0);
    await expect(page.getByText(/Demo: campaign dijeda/)).toBeVisible();
  });

  test('mode gelap bisa diaktifkan dan disimpan', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/ads');
    const root = page.locator('.ads-root');
    await expect(root).toHaveAttribute('data-theme', 'light');
    await page.getByTestId('theme-toggle').click();
    await expect(root).toHaveAttribute('data-theme', 'dark');
    const background = await root.evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(background).toBe('rgb(27, 26, 23)');
    await page.reload();
    await expect(page.locator('.ads-root')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByTestId('performance-chart')).toBeVisible();
  });

  test('mobile 390px tidak overflow horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ads');
    await expect(page.getByTestId('pulse-page')).toBeVisible();
    await expect(page.locator('.ads-bottomnav')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
