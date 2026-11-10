import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home page loads with a heading', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Mike OS');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('home page has no axe violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
