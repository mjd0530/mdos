import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test('the plain index lists the content and links back to MDOS', async ({
  page,
}) => {
  await page.goto('./plain/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Mike DeMar',
  );
  await expect(page.getByRole('link', { name: 'Read Me' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'LinkedIn' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'MDOS', exact: true }),
  ).toBeVisible();
});

test('a plain case study has its details, headings and working pictures', async ({
  page,
}) => {
  await page.goto('./plain/');
  await page.getByRole('link', { name: 'Smart Share / Magic Move' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Smart Share / Magic Move',
  );
  await expect(page.getByText('Lead UX Designer')).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Impact' }),
  ).toBeVisible();
  const images = page.getByRole('img');
  await expect(images).toHaveCount(7);
  const first = images.first();
  await first.scrollIntoViewIfNeeded();
  await expect
    .poll(() => first.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  await page.getByRole('link', { name: '← All pages' }).click();
  await expect(page).toHaveURL(/\/plain\/$/);
});

test('plain pages work without JavaScript and pass axe', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('./plain/portfolio/magic-move/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await context.close();
});

test('plain pages have no axe violations', async ({ page }) => {
  for (const path of ['./plain/', './plain/portfolio/magic-move/']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(results.violations, path).toEqual([]);
  }
});

test('without JavaScript the app points to the plain version', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('./');
  await page.getByRole('link', { name: 'plain pages' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Mike DeMar',
  );
  await context.close();
});

test('Help → Plain Version opens the plain index', async ({ page }) => {
  await page.goto('./');
  await page
    .getByRole('menubar')
    .getByRole('menuitem', { name: 'Help', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Plain Version' }).click();
  await expect(page).toHaveURL(/\/plain\/$/);
});

test('the security policy blocks nothing the app needs', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/Content Security Policy/i.test(message.text())) {
      violations.push(message.text());
    }
  });
  await page.goto('./');
  await expect(
    page.locator('meta[http-equiv="Content-Security-Policy"]'),
  ).toHaveCount(1);
  const icons = page.getByRole('listbox', { name: 'Desktop' });
  await icons.getByRole('option', { name: 'Read Me', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Read Me' })).toContainText(
    'Getting around',
  );
  expect(violations).toEqual([]);
});
