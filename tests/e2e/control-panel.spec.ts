import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function openControlPanel(page: Page) {
  await page
    .getByRole('menubar')
    .getByRole('menuitem', { name: 'Mike OS', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Control Panel' }).click();
  const panel = page.getByRole('dialog', { name: 'Control Panel' });
  await expect(
    panel.getByRole('group', { name: 'Desktop Pattern' }),
  ).toBeVisible();
  return panel;
}

const desktopPattern = (page: Page) =>
  page.getByRole('main').evaluate((el) => getComputedStyle(el).backgroundImage);

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('choosing a pattern changes the desktop and is remembered', async ({
  page,
}) => {
  const before = await desktopPattern(page);
  const panel = await openControlPanel(page);
  await panel.getByRole('radio', { name: 'Bricks' }).check({ force: true });
  const bricks = await desktopPattern(page);
  expect(bricks).not.toBe(before);

  await page.reload();
  expect(await desktopPattern(page)).toBe(bricks);
});

test('the pattern group works with arrow keys', async ({ page }) => {
  const panel = await openControlPanel(page);
  await panel.getByRole('radio', { name: 'Grey' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(panel.getByRole('radio', { name: 'Light' })).toBeChecked();
});

test('24-hour time changes the menu-bar clock', async ({ page }) => {
  const clock = page.locator('header time');
  await expect(clock).toHaveText(/AM|PM/);
  const panel = await openControlPanel(page);
  await panel.getByText('24-hour time').click();
  await expect(clock).not.toHaveText(/AM|PM/);
});

test('Restore Defaults puts settings back', async ({ page }) => {
  const original = await desktopPattern(page);
  const panel = await openControlPanel(page);
  await panel.getByRole('radio', { name: 'Weave' }).check({ force: true });
  await panel.getByText('24-hour time').click();
  await panel.getByRole('button', { name: 'Restore Defaults' }).click();
  expect(await desktopPattern(page)).toBe(original);
  await expect(
    panel.getByRole('checkbox', { name: '24-hour time' }),
  ).not.toBeChecked();
  await expect(page.locator('[aria-live]')).toHaveText(
    'Settings restored to their defaults',
  );
});

test('Special → Reset Desktop also resets settings', async ({ page }) => {
  const original = await desktopPattern(page);
  const panel = await openControlPanel(page);
  await panel.getByRole('radio', { name: 'Pixels' }).check({ force: true });
  await page
    .getByRole('menubar')
    .getByRole('menuitem', { name: 'Special', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Reset Desktop…' }).click();
  await page
    .getByRole('dialog', { name: 'Reset the desktop?' })
    .getByRole('button', { name: 'Reset' })
    .click();
  expect(await desktopPattern(page)).toBe(original);
  await page.reload();
  expect(await desktopPattern(page)).toBe(original);
});

test('no axe violations in Control Panel', async ({ page }) => {
  await openControlPanel(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);
});
