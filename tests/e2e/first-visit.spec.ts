import { expect, test, type Page } from '@playwright/test';
import { isPhone } from './device.ts';

// Start with nothing saved: a brand-new visitor.
test.use({ storageState: { cookies: [], origins: [] } });

const about = (page: Page) => page.getByRole('dialog', { name: 'About Mike' });

test('About Mike opens on the first visit only', async ({ page }, testInfo) => {
  await page.goto('./');
  if (isPhone(testInfo)) {
    // Phones start at the launcher.
    await expect(
      page.getByRole('listbox', { name: 'Desktop' }).getByRole('option', {
        name: 'About Mike',
        exact: true,
      }),
    ).toBeVisible();
    await expect(about(page)).toHaveCount(0);
    return;
  }
  await expect(about(page)).toBeVisible();
  await expect(about(page)).toContainText('Cary NC');

  await page.reload();
  await expect(page.getByRole('listbox', { name: 'Desktop' })).toBeVisible();
  await expect(about(page)).toHaveCount(0);
});

test('the About Mike note starts with the portrait', async ({ page }) => {
  await page.goto('./');
  const icon = page
    .getByRole('listbox', { name: 'Desktop' })
    .getByRole('option', { name: 'About Mike', exact: true });
  await expect(icon).toBeVisible();
  // Phones skip the first-visit window; open it the same way everywhere.
  if (!(await about(page).count())) {
    await icon.focus();
    await page.keyboard.press('Enter');
  }
  const image = about(page).getByRole('img', { name: /Mike DeMar smiling/ });
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  const box = await image.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(240);
});
