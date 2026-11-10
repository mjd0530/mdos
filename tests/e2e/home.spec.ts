import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test('desktop loads with a menu bar, clock and page heading', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Mike OS');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Mike OS desktop',
  );
  const menubar = page.getByRole('menubar', { name: 'Menu bar' });
  for (const name of ['Mike OS', 'File', 'Edit', 'View', 'Special', 'Help']) {
    await expect(
      menubar.getByRole('menuitem', { name, exact: true }),
    ).toBeVisible();
  }
  await expect(page.locator('header time')).toHaveText(/\d:\d\d/);
});

test('desktop has no axe violations', async ({ page }) => {
  await page.goto('./');
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);
});

test('page never scrolls sideways', async ({ page }) => {
  await page.goto('./');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
