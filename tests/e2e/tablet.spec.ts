import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'tablet behaviour only');
  await page.goto('./');
});

/** Hold a finger on a point: Playwright only has quick taps, so drive touch via CDP. */
async function longPress(page: Page, x: number, y: number, ms = 750) {
  const cdp = await page.context().newCDPSession(page);
  const point = { x, y, id: 1 };
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [point],
  });
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
}

test('windows open zoomed, and Restore shrinks them', async ({ page }) => {
  const icons = page.getByRole('listbox', { name: 'Desktop' });
  await icons
    .getByRole('option', { name: 'Portfolio', exact: true })
    .dblclick();
  const files = page.getByRole('dialog', { name: 'Portfolio' });
  const desktop = await page.getByRole('main').boundingBox();
  expect((await files.boundingBox())?.width).toBeGreaterThan(
    (desktop?.width ?? 0) - 8,
  );
  await files.getByRole('button', { name: 'Restore Portfolio' }).tap();
  expect((await files.boundingBox())?.width).toBeLessThan(
    (desktop?.width ?? 0) - 100,
  );
});

test('long-pressing an icon opens its context menu', async ({ page }) => {
  const readMe = page
    .getByRole('listbox', { name: 'Desktop' })
    .getByRole('option', { name: 'Read Me', exact: true });
  const box = await readMe.boundingBox();
  if (!box) throw new Error('no icon');
  await longPress(page, box.x + box.width / 2, box.y + 16);

  const menu = page.getByRole('menu', { name: 'Read Me' });
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitem', { name: 'Open' }).tap();
  await expect(page.getByRole('dialog', { name: 'Read Me' })).toBeVisible();
});
