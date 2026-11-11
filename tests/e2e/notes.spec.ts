import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const STUDY = 'Smart Share / Magic Move';

async function openMagicMove(page: Page) {
  const desktop = page.getByRole('listbox', { name: 'Desktop' });
  await desktop.getByRole('option', { name: 'Portfolio', exact: true }).focus();
  await page.keyboard.press('Enter');
  const files = page.getByRole('dialog', { name: 'Portfolio' });
  await files.getByRole('option', { name: STUDY }).focus();
  await page.keyboard.press('Enter');
  const notes = page.getByRole('dialog', { name: STUDY });
  await expect(notes.getByText('Lead UX Designer')).toBeVisible();
  return notes;
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('a case study shows its subtitle, details and award', async ({ page }) => {
  const notes = await openMagicMove(page);
  await expect(
    notes.getByText('Designing Lenovo’s cross-device interaction model'),
  ).toBeVisible();
  for (const term of ['Role', 'Client', 'Years', 'Scope', 'Award']) {
    await expect(
      notes.getByRole('term').filter({ hasText: term }),
    ).toBeVisible();
  }
  await expect(notes.getByRole('heading', { name: 'Impact' })).toBeAttached();
});

test('Contents jumps to a section and moves focus there', async ({ page }) => {
  const notes = await openMagicMove(page);
  await notes.getByText('Contents', { exact: true }).click();
  const nav = notes.getByRole('navigation', { name: `Contents of ${STUDY}` });
  await nav.getByRole('link', { name: 'Delivery' }).click();
  const heading = notes.getByRole('heading', { name: 'Delivery' });
  await expect(heading).toBeFocused();
  await expect(heading).toBeInViewport();
  await expect(nav).toBeHidden();
});

test('a picture opens larger in Viewer, with its caption', async ({ page }) => {
  const notes = await openMagicMove(page);
  await notes
    .getByRole('button', { name: /View larger: Planning board/ })
    .click();
  const viewer = page.getByRole('dialog', {
    name: 'Journey and competitive mapping board',
  });
  await expect(viewer).toBeVisible();
  const img = viewer.getByRole('img', { name: /Planning board/ });
  await expect
    .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);

  const actual = viewer.getByRole('button', { name: 'Actual Size' });
  await actual.click();
  await expect(actual).toHaveAttribute('aria-pressed', 'true');

  // Opening the same picture again brings its window forward instead of a second one.
  await notes
    .getByRole('button', { name: /View larger: Planning board/ })
    .focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('dialog', { name: 'Journey and competitive mapping board' }),
  ).toHaveCount(1);
});

test('no axe violations in a case study and the viewer', async ({ page }) => {
  const notes = await openMagicMove(page);
  await notes.getByText('Contents', { exact: true }).click();
  let results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);

  await notes
    .getByRole('button', { name: /View larger: Planning board/ })
    .focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('dialog', { name: /mapping board/ }),
  ).toBeVisible();
  results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);
});
