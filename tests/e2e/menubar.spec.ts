import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

const title = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('menubar').getByRole('menuitem', { name, exact: true });

test.describe('mouse', () => {
  test('clicking a title opens its menu; clicking outside closes it', async ({
    page,
  }) => {
    await title(page, 'Special').click();
    const menu = page.getByRole('menu', { name: 'Special' });
    await expect(menu).toBeVisible();
    await expect(title(page, 'Special')).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await page.mouse.click(400, 300);
    await expect(menu).toBeHidden();
  });

  test('moving across titles while a menu is open switches menus', async ({
    page,
  }) => {
    await title(page, 'File').click();
    await title(page, 'Help').hover();
    await expect(page.getByRole('menu', { name: 'Help' })).toBeVisible();
    await expect(page.getByRole('menu', { name: 'File' })).toHaveCount(0);
  });

  test('disabled items do nothing', async ({ page }) => {
    await title(page, 'File').click();
    const item = page.getByRole('menuitem', { name: 'Close Window' });
    await expect(item).toHaveAttribute('aria-disabled', 'true');
    await item.click({ force: true }); // Playwright refuses aria-disabled targets otherwise
    await expect(page.getByRole('menu', { name: 'File' })).toBeVisible();
  });

  test('Restart… asks first; Cancel keeps the page', async ({ page }) => {
    await page.evaluate(() => {
      (window as unknown as { marker: boolean }).marker = true;
    });
    await title(page, 'Special').click();
    await page.getByRole('menuitem', { name: 'Restart…' }).click();

    const dialog = page.getByRole('dialog', { name: 'Restart MDOS?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Restart' })).toBeFocused();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    expect(
      await page.evaluate(
        () => (window as unknown as { marker?: boolean }).marker,
      ),
    ).toBe(true);
  });
});

test.describe('keyboard', () => {
  test('the menu bar is one Tab stop and arrows move between titles', async ({
    page,
  }) => {
    await page.keyboard.press('Tab');
    await expect(title(page, 'MDOS')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(title(page, 'File')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(title(page, 'Help')).toBeFocused();

    // Tab leaves the menu bar (to the clock), not to the next title.
    await page.keyboard.press('Tab');
    await expect(page.locator('header time')).toBeVisible();
    await expect(title(page, 'Help')).not.toBeFocused();
  });

  test('open, choose and close with the keyboard; focus comes back', async ({
    page,
  }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowLeft'); // Help
    await page.keyboard.press('ArrowDown');
    await expect(
      page.getByRole('menuitem', { name: 'Keyboard Shortcuts…' }),
    ).toBeFocused();

    await page.keyboard.press('End');
    await expect(
      page.getByRole('menuitem', { name: 'About MDOS…' }),
    ).toBeFocused();

    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'MDOS' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'OK' })).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(title(page, 'Help')).toBeFocused();
  });

  test('Escape closes a menu and returns focus to its title', async ({
    page,
  }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menu', { name: 'MDOS' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(title(page, 'MDOS')).toBeFocused();
  });

  test('Escape closes an alert', async ({ page }) => {
    await title(page, 'Help').click();
    await page.getByRole('menuitem', { name: 'Keyboard Shortcuts…' }).click();
    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});

test('no axe violations with a menu open or an alert showing', async ({
  page,
}) => {
  await title(page, 'Special').click();
  let results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);

  await page.getByRole('menuitem', { name: 'Restart…' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);
});

test.describe('touch', () => {
  test('tapping a title opens its menu and tapping an item chooses it', async ({
    page,
  }, testInfo) => {
    test.skip(!testInfo.project.use.hasTouch, 'touch devices only');
    await title(page, 'Help').tap();
    await expect(page.getByRole('menu', { name: 'Help' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'About MDOS…' }).tap();
    await expect(page.getByRole('dialog', { name: 'MDOS' })).toBeVisible();
  });
});
