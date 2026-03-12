import { test, expect } from '@playwright/test';

test.describe('Pagina di conferma Magic Link (/verify-request)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/verify-request');
  });

  test('mostra il titolo "Controlla la tua Email"', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Controlla la tua Email/i }),
    ).toBeVisible();
  });

  test('mostra il messaggio sul Magic Link inviato', async ({ page }) => {
    await expect(page.getByText(/Magic Link/)).toBeVisible();
    await expect(page.getByText(/Ti abbiamo inviato/i)).toBeVisible();
  });

  test('mostra la scadenza del link (24 ore)', async ({ page }) => {
    await expect(page.getByText(/24 ore/i)).toBeVisible();
  });

  test('ha un link "Usa un\'altra email" per richiedere un nuovo magic link', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Usa un'altra email/i });
    await expect(backLink).toBeVisible();
  });

  test('il link "Usa un\'altra email" porta alla login', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /Usa un'altra email/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
