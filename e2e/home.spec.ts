import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('mostra il titolo MAGIC FARM', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /MAGIC.*FARM/i })).toBeVisible();
  });

  test('mostra il sottotitolo con la tagline', async ({ page }) => {
    await expect(page.getByText(/Where Magic Meets Competition/i)).toBeVisible();
  });

  test('mostra la descrizione introduttiva', async ({ page }) => {
    await expect(page.getByText(/Entra nel mondo misterioso di Magic Farm/i)).toBeVisible();
  });

  test('ha un link "Entra nel Magic" che porta alla login', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /Entra nel Magic/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('mostra le sezioni caratteristiche (Compete, Collabora, Impara)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Compete/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Collabora/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Impara/i })).toBeVisible();
  });

  test('title della pagina contiene Magic Farm', async ({ page }) => {
    await expect(page).toHaveTitle(/Magic Farm/i);
  });
});
