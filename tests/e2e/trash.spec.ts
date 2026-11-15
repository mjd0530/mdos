import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { isPhone, unzoom } from './device.ts';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const desktopIcons = (page: Page) =>
  page.getByRole('listbox', { name: 'Desktop' });
const icon = (page: Page, name: string) =>
  desktopIcons(page).getByRole('option', { name, exact: true });
const trashWindow = (page: Page) => page.getByRole('dialog', { name: 'Trash' });

/** Press on one point, move in steps, release on another. */
async function drag(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= 5; i++) {
    await page.mouse.move(
      from.x + ((to.x - from.x) * i) / 5,
      from.y + ((to.y - from.y) * i) / 5,
    );
  }
  await page.mouse.up();
}

const centre = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error('not on screen');
  return { x: box.x + box.width / 2, y: box.y + 16 };
};

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('the Trash is on the desktop and starts empty', async ({ page }) => {
  await expect(icon(page, 'Trash')).toBeVisible();
  await icon(page, 'Trash').focus();
  await page.keyboard.press('Enter');
  await expect(
    trashWindow(page).getByText('The Trash is empty.'),
  ).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations,
  ).toEqual([]);
});

test('Delete moves an icon to the Trash; Put Away brings it back', async ({
  page,
}) => {
  await icon(page, 'Weather').focus();
  await page.keyboard.press('Delete');
  await expect(icon(page, 'Weather')).toHaveCount(0);
  await expect(page.getByText('Weather moved to Trash')).toBeAttached();
  // Focus lands on a neighbouring icon, so the arrow keys keep working.
  await expect(
    desktopIcons(page).getByRole('option', { selected: true }),
  ).toBeFocused();

  await icon(page, 'Trash').focus();
  await page.keyboard.press('Enter');
  const trash = trashWindow(page);
  const item = trash.getByRole('option', { name: 'Weather' });
  await expect(item).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations,
  ).toEqual([]);

  // Keyboard: the context menu has Put Away.
  await item.focus();
  await page.keyboard.press('Shift+F10');
  await page
    .getByRole('menu', { name: 'Weather' })
    .getByRole('menuitem', { name: 'Put Away' })
    .click();
  await expect(icon(page, 'Weather')).toBeAttached();
  await expect(trash.getByText('The Trash is empty.')).toBeFocused();
});

test('Put Away moves focus to the next item in the Trash', async ({ page }) => {
  for (const name of ['Weather', 'Read Me']) {
    await icon(page, name).focus();
    await page.keyboard.press('Delete');
    await expect(icon(page, name)).toHaveCount(0);
  }
  await icon(page, 'Trash').focus();
  await page.keyboard.press('Enter');
  const trash = trashWindow(page);
  await trash.getByRole('option', { name: 'Weather' }).focus();
  await page.keyboard.press('Shift+F10');
  await page
    .getByRole('menu', { name: 'Weather' })
    .getByRole('menuitem', { name: 'Put Away' })
    .click();
  await expect(trash.getByRole('option', { name: 'Read Me' })).toBeFocused();
});

test('the Trash is remembered after a reload, and Reset Desktop empties it', async ({
  page,
}) => {
  await icon(page, 'Weather').focus();
  await page.keyboard.press('Delete');
  await page.reload();
  await expect(icon(page, 'Trash')).toBeVisible();
  await expect(icon(page, 'Weather')).toHaveCount(0);

  await page
    .getByRole('menubar')
    .getByRole('menuitem', { name: 'Special', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Reset Desktop…' }).click();
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(icon(page, 'Weather')).toBeAttached();
});

test('Empty Trash refuses, and nothing is lost', async ({ page }, testInfo) => {
  test.skip(isPhone(testInfo), 'phones use the launcher, not the menu bar');
  await icon(page, 'Weather').focus();
  await page.keyboard.press('Delete');
  await page
    .getByRole('menubar')
    .getByRole('menuitem', { name: 'Special', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Empty Trash…' }).click();
  const alert = page.getByRole('dialog', { name: /whaddaya think/ });
  await expect(alert).toBeVisible();
  await alert.getByRole('button', { name: 'Sorry!' }).click();
  await icon(page, 'Trash').focus();
  await page.keyboard.press('Enter');
  await expect(
    trashWindow(page).getByRole('option', { name: 'Weather' }),
  ).toBeVisible();
});

test.describe('mouse', () => {
  test.skip(({ isMobile }) => isMobile, 'mouse drags on desktop only');

  test('dragging onto the Trash throws an icon away; dragging out puts it back', async ({
    page,
  }) => {
    await drag(
      page,
      await centre(icon(page, 'Weather')),
      await centre(icon(page, 'Trash')),
    );
    await expect(icon(page, 'Weather')).toHaveCount(0);

    await icon(page, 'Trash').dblclick();
    const trash = trashWindow(page);
    await unzoom(trash);
    const desk = await page.getByRole('main').boundingBox();
    const win = await trash.boundingBox();
    if (!desk || !win) throw new Error('no boxes');
    // Somewhere on the desktop clear of the window and the icon column.
    const drop = {
      x: desk.x + desk.width / 2,
      y: Math.min(win.y + win.height + 60, desk.y + desk.height - 40),
    };
    await drag(
      page,
      await centre(trash.getByRole('option', { name: 'Weather' })),
      drop,
    );
    const back = await icon(page, 'Weather').boundingBox();
    expect(Math.abs((back?.x ?? 0) + 44 - drop.x)).toBeLessThan(4);
    await expect(trash.getByText('The Trash is empty.')).toBeVisible();
  });
});

test('phones: long-press → Move to Trash; Empty scolds; Put Away from the menu', async ({
  page,
}, testInfo) => {
  test.skip(!isPhone(testInfo), 'phone behaviour');
  await icon(page, 'Weather').dispatchEvent('contextmenu');
  await page
    .getByRole('menu', { name: 'Weather' })
    .getByRole('menuitem', { name: 'Move to Trash' })
    .tap();
  await expect(icon(page, 'Weather')).toHaveCount(0);
  await icon(page, 'Trash').tap();
  const trash = trashWindow(page);
  // Empty only scolds; long-press → Put Away brings it back.
  await trash.getByRole('button', { name: 'Empty' }).tap();
  const alert = page.getByRole('dialog', { name: /whaddaya think/ });
  await alert.getByRole('button', { name: 'Sorry!' }).tap();
  const item = trash.getByRole('option', { name: 'Weather' });
  await item.dispatchEvent('contextmenu');
  await page
    .getByRole('menu', { name: 'Weather' })
    .getByRole('menuitem', { name: 'Put Away' })
    .tap();
  await expect(trash.getByText('The Trash is empty.')).toBeVisible();
});

test('the Trash window’s Empty button shows the error alert and keeps everything', async ({
  page,
}) => {
  await icon(page, 'Weather').focus();
  await page.keyboard.press('Delete');
  await icon(page, 'Trash').focus();
  await page.keyboard.press('Enter');
  const trash = trashWindow(page);
  await trash.getByRole('button', { name: 'Empty' }).click();
  const alert = page.getByRole('dialog', { name: /whaddaya think/ });
  await expect(alert).toBeVisible();
  await expect(alert.getByText("That's Mike's stuff!")).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations,
  ).toEqual([]);
  await page.keyboard.press('Enter');
  await expect(alert).toBeHidden();
  await expect(trash.getByRole('option', { name: 'Weather' })).toBeVisible();
});
