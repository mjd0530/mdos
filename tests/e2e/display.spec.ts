import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const display = (page: Page) =>
  page.evaluate(() => document.documentElement.dataset.display);

async function openControlPanel(page: Page) {
  await page
    .getByRole('menubar')
    .getByRole('menuitem', { name: 'MDOS', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Control Panel' }).click();
  return page.getByRole('dialog', { name: 'Control Panel' });
}

async function openIcon(page: Page, name: string) {
  await page
    .getByRole('listbox', { name: 'Desktop' })
    .getByRole('option', { name, exact: true })
    .focus();
  await page.keyboard.press('Enter');
  return page.getByRole('dialog', { name });
}

test('the name is MDOS', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('MDOS');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'MDOS desktop',
  );
  await page
    .getByRole('menubar')
    .getByRole('menuitem', { name: 'MDOS', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'About MDOS…' }).click();
  await expect(page.getByRole('dialog', { name: 'MDOS' })).toBeVisible();
});

test('colour is the default', async ({ page }) => {
  await page.goto('./');
  expect(await display(page)).toBe('color');
});

test('Monitors switches to Black & White, remembered and restorable', async ({
  page,
}) => {
  await page.goto('./');
  const panel = await openControlPanel(page);
  await panel.getByText('Black & White', { exact: true }).click();
  expect(await display(page)).toBe('bw');
  // Highlight colours only apply in colour.
  await expect(
    panel.getByRole('group', { name: 'Highlight Color' }),
  ).toHaveCount(0);

  await page.reload();
  expect(await display(page)).toBe('bw');

  const again = await openControlPanel(page);
  await again.getByRole('button', { name: 'Restore Defaults' }).click();
  expect(await display(page)).toBe('color');
});

test('the highlight colour drives menu highlights', async ({ page }) => {
  await page.goto('./');
  const panel = await openControlPanel(page);
  await panel
    .getByRole('group', { name: 'Highlight Color' })
    .getByRole('radio', { name: 'Gold' })
    .check({ force: true });
  await panel.getByRole('button', { name: 'Close Control Panel' }).click();

  await page
    .getByRole('menubar')
    .getByRole('menuitem', { name: 'Special', exact: true })
    .click();
  const title = page
    .getByRole('menubar')
    .getByRole('menuitem', { name: 'Special', exact: true });
  await expect(title).toHaveCSS('background-color', 'rgb(255, 221, 119)');
});

for (const mode of ['color', 'bw'] as const) {
  test(`no axe violations in ${mode === 'color' ? 'colour' : 'black and white'}`, async ({
    page,
  }) => {
    await page.addInitScript((display) => {
      localStorage.setItem(
        'mikeos:settings',
        JSON.stringify({ state: { display }, version: 1 }),
      );
    }, mode);
    await page.goto('./');
    expect(await display(page)).toBe(mode);

    await openIcon(page, 'Portfolio');
    await openIcon(page, 'Read Me');
    await openControlPanel(page);
    let results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(results.violations).toEqual([]);

    await page
      .getByRole('menubar')
      .getByRole('menuitem', { name: 'Special', exact: true })
      .click();
    results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(results.violations).toEqual([]);

    await page.getByRole('menuitem', { name: 'Restart…' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Restart MDOS?' }),
    ).toBeVisible();
    results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(results.violations).toEqual([]);
  });
}
