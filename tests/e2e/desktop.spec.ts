import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const desktopIcons = (page: Page) =>
  page.getByRole('listbox', { name: 'Desktop' });
const icon = (page: Page, name: string) =>
  desktopIcons(page).getByRole('option', { name, exact: true });

/** Open with the keyboard: works even when a window covers the icon (phones). */
async function openWithKeyboard(page: Page, name: string) {
  await icon(page, name).focus();
  await page.keyboard.press('Enter');
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('the desktop shows the items from content/fs.yaml', async ({ page }) => {
  for (const name of ['Read Me', 'Portfolio', 'About Mike', 'Contact']) {
    await expect(icon(page, name)).toBeVisible();
  }
});

test('clicking selects an icon; clicking the desktop clears it', async ({
  page,
}) => {
  await icon(page, 'Portfolio').click();
  await expect(icon(page, 'Portfolio')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.mouse.click(200, 400);
  await expect(icon(page, 'Portfolio')).toHaveAttribute(
    'aria-selected',
    'false',
  );
});

test('folder → Files → document → Notes', async ({ page }) => {
  await icon(page, 'Portfolio').dblclick();
  const files = page.getByRole('dialog', { name: 'Portfolio' });
  await expect(files).toBeVisible();
  await expect(files.getByText('3 items')).toBeVisible();

  // Opening the same folder again focuses the existing window.
  await openWithKeyboard(page, 'Portfolio');
  await expect(page.getByRole('dialog', { name: 'Portfolio' })).toHaveCount(1);

  await files
    .getByRole('option', { name: 'Smart Share / Magic Move' })
    .dblclick();
  const notes = page.getByRole('dialog', { name: 'Smart Share / Magic Move' });
  await expect(notes.getByText('Lead UX Designer')).toBeVisible();
  const image = notes.getByRole('img', {
    name: /Smart Share open on a Lenovo/,
  });
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
});

test('Files navigates with the path, Back and Forward, and switches to list view', async ({
  page,
}) => {
  await icon(page, 'Portfolio').dblclick();
  const files = page.getByRole('dialog', { name: 'Portfolio' });
  await files
    .getByRole('navigation', { name: 'Folder path' })
    .getByRole('button', { name: 'Desktop' })
    .click();
  const desktopWindow = page.getByRole('dialog', { name: 'Desktop' });
  await expect(
    desktopWindow.getByRole('option', { name: 'About Mike' }),
  ).toBeVisible();

  await desktopWindow.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('dialog', { name: 'Portfolio' })).toBeVisible();
  await page
    .getByRole('dialog', { name: 'Portfolio' })
    .getByRole('button', { name: 'Forward' })
    .click();
  await expect(page.getByRole('dialog', { name: 'Desktop' })).toBeVisible();

  const list = page.getByRole('dialog', { name: 'Desktop' });
  await list.getByRole('button', { name: 'List' }).click();
  await expect(list.getByRole('button', { name: 'List' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(list.getByText('Folder').first()).toBeVisible();
});

test.describe('keyboard', () => {
  test('arrows move through icons and Enter opens; focus goes into the window', async ({
    page,
  }) => {
    await icon(page, 'Read Me').focus();
    await page.keyboard.press('ArrowDown');
    await expect(icon(page, 'Portfolio')).toBeFocused();
    await expect(icon(page, 'Portfolio')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Portfolio' })).toBeFocused();
  });

  test('Shift+F10 opens the context menu; Open opens the item', async ({
    page,
  }) => {
    await icon(page, 'Read Me').focus();
    await page.keyboard.press('Shift+F10');
    const menu = page.getByRole('menu', { name: 'Read Me' });
    await expect(menu.getByRole('menuitem', { name: 'Open' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Read Me' })).toBeVisible();
  });
});

test.describe('mouse', () => {
  test.skip(({ isMobile }) => isMobile, 'mouse drags on desktop only');

  test('icons can be dragged; Clean Up puts them back', async ({ page }) => {
    const target = icon(page, 'Contact');
    const start = await target.boundingBox();
    if (!start) throw new Error('no box');
    await page.mouse.move(start.x + 40, start.y + 20);
    await page.mouse.down();
    await page.mouse.move(start.x - 100, start.y + 50);
    await page.mouse.move(start.x - 200, start.y + 100);
    await page.mouse.up();
    const moved = await target.boundingBox();
    expect(Math.round((moved?.x ?? 0) - start.x)).toBe(-240);

    await page
      .getByRole('menubar')
      .getByRole('menuitem', { name: 'Special', exact: true })
      .click();
    await page.getByRole('menuitem', { name: 'Clean Up Desktop' }).click();
    expect((await target.boundingBox())?.x).toBe(start.x);
  });

  test('right-clicking the desktop offers Clean Up', async ({ page }) => {
    await page.mouse.click(200, 400, { button: 'right' });
    await expect(
      page
        .getByRole('menu', { name: 'Desktop' })
        .getByRole('menuitem', { name: 'Clean Up Desktop' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: 'Desktop' })).toHaveCount(0);
  });
});

test('links open in a new tab', async ({ page, context }) => {
  await icon(page, 'Contact').dblclick();
  const contact = page.getByRole('dialog', { name: 'Contact' });
  const popup = context.waitForEvent('page');
  await contact.getByRole('option', { name: 'LinkedIn' }).dblclick();
  expect((await popup).url()).toContain('linkedin.com');
});

test('no axe violations with Files and Notes open', async ({ page }) => {
  await icon(page, 'Portfolio').dblclick();
  await openWithKeyboard(page, 'Read Me');
  await expect(page.getByRole('dialog', { name: 'Read Me' })).toContainText(
    'Getting around',
  );
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);
});

test('the Sketchbook opens, empty until drawings are added', async ({
  page,
}) => {
  await icon(page, 'Sketchbook').focus();
  await page.keyboard.press('Enter');
  const sketchbook = page.getByRole('dialog', { name: 'Sketchbook' });
  await expect(sketchbook.getByText('0 items')).toBeVisible();
  await expect(sketchbook.getByText('This folder is empty.')).toBeVisible();
});
