import { expect, test, type Page } from '@playwright/test';

const icon = (page: Page, name: string) =>
  page
    .getByRole('listbox', { name: 'Desktop' })
    .getByRole('option', { name, exact: true });

async function openWithKeyboard(page: Page, name: string) {
  await icon(page, name).focus();
  await page.keyboard.press('Enter');
}

async function boxOf(page: Page, name: string) {
  const box = await page.getByRole('dialog', { name }).boundingBox();
  if (!box) throw new Error(`no window ${name}`);
  return box;
}

async function chooseSpecial(page: Page, item: string) {
  await page
    .getByRole('menubar')
    .getByRole('menuitem', { name: 'Special', exact: true })
    .click();
  await page.getByRole('menuitem', { name: item }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('a document window reopens where it was, even after a reload', async ({
  page,
}) => {
  await openWithKeyboard(page, 'Read Me');
  const title = page
    .getByRole('dialog', { name: 'Read Me' })
    .getByRole('heading', { name: 'Read Me' });
  await title.focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Shift+ArrowLeft');
  const placed = await boxOf(page, 'Read Me');

  await page
    .getByRole('dialog', { name: 'Read Me' })
    .getByRole('button', { name: 'Close Read Me' })
    .click();
  await openWithKeyboard(page, 'Read Me');
  expect(await boxOf(page, 'Read Me')).toEqual(placed);

  await page.reload();
  await openWithKeyboard(page, 'Read Me');
  expect(await boxOf(page, 'Read Me')).toEqual(placed);
});

test('windows are not reopened automatically after a reload', async ({
  page,
}) => {
  await openWithKeyboard(page, 'Read Me');
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test.describe('mouse', () => {
  test.skip(({ isMobile }) => isMobile, 'mouse drags on desktop only');

  test('dragged icons stay put after a reload', async ({ page }) => {
    const before = await icon(page, 'Contact').boundingBox();
    if (!before) throw new Error('no icon');
    await page.mouse.move(before.x + 40, before.y + 20);
    await page.mouse.down();
    await page.mouse.move(before.x - 100, before.y + 60);
    await page.mouse.move(before.x - 200, before.y + 120);
    await page.mouse.up();
    const moved = await icon(page, 'Contact').boundingBox();

    await page.reload();
    expect(await icon(page, 'Contact').boundingBox()).toEqual(moved);
  });

  test('Reset Desktop restores icons, closes windows and forgets everything', async ({
    page,
  }) => {
    const start = await icon(page, 'Contact').boundingBox();
    if (!start) throw new Error('no icon');
    await page.mouse.move(start.x + 40, start.y + 20);
    await page.mouse.down();
    await page.mouse.move(start.x - 200, start.y + 120);
    await page.mouse.up();
    await openWithKeyboard(page, 'Read Me');

    await chooseSpecial(page, 'Reset Desktop…');
    const dialog = page.getByRole('dialog', { name: 'Reset the desktop?' });
    await expect(dialog.getByRole('button', { name: 'Reset' })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await icon(page, 'Contact').boundingBox()).toEqual(start);
    await expect(page.locator('[aria-live]')).toHaveText('Desktop reset');

    await page.reload();
    expect(await icon(page, 'Contact').boundingBox()).toEqual(start);
  });
});

test('Cancel in Reset Desktop changes nothing', async ({ page }) => {
  await openWithKeyboard(page, 'Read Me');
  await chooseSpecial(page, 'Reset Desktop…');
  await page
    .getByRole('dialog', { name: 'Reset the desktop?' })
    .getByRole('button', { name: 'Cancel' })
    .click();
  await expect(page.getByRole('dialog', { name: 'Read Me' })).toBeVisible();
});

test('corrupt saved data is ignored, not fatal', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mikeos:desktop', '{not json');
    localStorage.setItem(
      'mikeos:windows',
      JSON.stringify({
        state: { remembered: { 'notes:readme': { x: 'a', y: null } } },
        version: 1,
      }),
    );
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.reload();
  await expect(icon(page, 'Read Me')).toBeVisible();
  await openWithKeyboard(page, 'Read Me');
  await expect(page.getByRole('dialog', { name: 'Read Me' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('works when the browser blocks storage', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.reload();
  await openWithKeyboard(page, 'Read Me');
  await expect(page.getByRole('dialog', { name: 'Read Me' })).toBeVisible();
  expect(errors).toEqual([]);
});
