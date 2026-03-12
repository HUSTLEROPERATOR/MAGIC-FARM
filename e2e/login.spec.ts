import { test, expect } from '@playwright/test';

test.describe('Pagina di login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('mostra il titolo "Accedi"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Accedi/i })).toBeVisible();
  });

  test('mostra il campo email', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('il pulsante "Invia Magic Link" è disabilitato se email vuota', async ({ page }) => {
    const button = page.getByRole('button', { name: /Invia Magic Link/i });
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('il pulsante si abilita dopo aver inserito un\'email', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    const button = page.getByRole('button', { name: /Invia Magic Link/i });

    await emailInput.fill('test@example.com');
    await expect(button).toBeEnabled();
  });

  test('cliccando sul link "Torna alla home" si ritorna alla homepage', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Torna alla home/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL('/');
  });

  test('mostra il messaggio informativo sul Magic Link', async ({ page }) => {
    await expect(
      page.getByText(/Ti invieremo un link magico alla tua email/i),
    ).toBeVisible();
  });

  test('placeholder del campo email è corretto', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toHaveAttribute('placeholder', 'il-tuo-nome@email.com');
  });

  test('campo email ha autocomplete impostato', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toHaveAttribute('autocomplete', 'email');
  });

  test('mostra errore di autenticazione dalla query string (?error=Verification)', async ({
    page,
  }) => {
    await page.goto('/login?error=Verification');
    await expect(
      page.getByText(/Il link è scaduto o non valido/i),
    ).toBeVisible();
  });

  test('mostra errore SessionRequired dalla query string', async ({ page }) => {
    await page.goto('/login?error=SessionRequired');
    await expect(
      page.getByText(/Devi effettuare l'accesso/i),
    ).toBeVisible();
  });
});
