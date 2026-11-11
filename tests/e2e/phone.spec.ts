import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { isPhone } from './device.ts';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(!isPhone(testInfo), 'phone behaviour only');
  await page.goto('./');
});

test('the desktop is a launcher grid, and one tap opens an item full screen', async ({
  page,
}) => {
  const icons = page.getByRole('listbox', { name: 'Desktop' });
  await icons.getByRole('option', { name: 'Portfolio', exact: true }).tap();
  const files = page.getByRole('dialog', { name: 'Portfolio' });
  await expect(files).toBeVisible();

  const desktop = await page.getByRole('main').boundingBox();
  const window = await files.boundingBox();
  expect(window?.width).toBeGreaterThan((desktop?.width ?? 0) - 8);
  expect(window?.height).toBeGreaterThan((desktop?.height ?? 0) - 8);

  // No zoom, collapse or resize on phones.
  await expect(
    files.getByRole('button', { name: /^Zoom|^Restore/ }),
  ).toHaveCount(0);
  await expect(files.getByRole('button', { name: /^Collapse/ })).toHaveCount(0);
  await expect(files.getByTestId('grow-box')).toHaveCount(0);
});

test('one window at a time; closing goes back to the one behind', async ({
  page,
}) => {
  const icons = page.getByRole('listbox', { name: 'Desktop' });
  await icons.getByRole('option', { name: 'Portfolio', exact: true }).tap();
  const files = page.getByRole('dialog', { name: 'Portfolio' });
  await files.getByRole('option', { name: 'Smart Share / Magic Move' }).tap();

  const notes = page.getByRole('dialog', { name: 'Smart Share / Magic Move' });
  await expect(notes).toBeVisible();
  await expect(files).toBeHidden(); // still open, just behind

  await notes
    .getByRole('button', { name: 'Close Smart Share / Magic Move' })
    .tap();
  await expect(files).toBeVisible();
  // Focus returns to the item that opened the document.
  await expect(
    files.getByRole('option', { name: 'Smart Share / Magic Move' }),
  ).toBeFocused();

  await files.getByRole('button', { name: 'Close Portfolio' }).tap();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(icons).toBeVisible();
});

test('a picture opens in Viewer on top; closing returns to the document', async ({
  page,
}) => {
  const icons = page.getByRole('listbox', { name: 'Desktop' });
  await icons.getByRole('option', { name: 'Portfolio', exact: true }).tap();
  await page
    .getByRole('dialog', { name: 'Portfolio' })
    .getByRole('option', { name: 'Smart Share / Magic Move' })
    .tap();
  const notes = page.getByRole('dialog', { name: 'Smart Share / Magic Move' });
  await notes
    .getByRole('button', { name: /View larger: Planning board/ })
    .tap();

  const viewer = page.getByRole('dialog', {
    name: 'Journey and competitive mapping board',
  });
  await expect(viewer).toBeVisible();
  await expect(notes).toBeHidden();

  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);

  await viewer
    .getByRole('button', {
      name: 'Close Journey and competitive mapping board',
    })
    .tap();
  await expect(notes).toBeVisible();
});
