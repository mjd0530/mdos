import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Open the Hello test fixture (not in any menu) through the ?e2e hook. */
async function newWindow(page: Page) {
  await page.waitForFunction(() => 'mikeos' in window);
  await page.evaluate(() =>
    (
      window as unknown as { mikeos: { launch: (id: string) => void } }
    ).mikeos.launch('hello'),
  );
}

const win = (page: Page, title: string) =>
  page.getByRole('dialog', { name: title });

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error('element has no box');
  return b;
}

/** Drag with a real mouse from the centre of `from` by (dx, dy). */
async function drag(page: Page, from: Locator, dx: number, dy: number) {
  const b = await box(from);
  const x = b.x + b.width / 2;
  const y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy / 2);
  await page.mouse.move(x + dx, y + dy);
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto('./?e2e');
});

test('launching an app opens an active, focused, announced window', async ({
  page,
}) => {
  await newWindow(page);
  const w = win(page, 'Hello 1');
  await expect(w).toBeVisible();
  await expect(w).toHaveAttribute('data-active', 'true');
  await expect(w).toBeFocused();
  await expect(page.locator('[aria-live]')).toHaveText('Hello 1 window opened');
});

test('clicking a back window brings it to the front', async ({ page }) => {
  await newWindow(page);
  await newWindow(page);
  const first = win(page, 'Hello 1');
  await expect(first).not.toHaveAttribute('data-active');
  await first.getByRole('heading').click({ position: { x: 4, y: 4 } });
  await expect(first).toHaveAttribute('data-active', 'true');
  await expect(win(page, 'Hello 2')).not.toHaveAttribute('data-active');
});

test.describe('mouse', () => {
  test.skip(({ isMobile }) => isMobile, 'mouse drags on desktop only');

  test('dragging the title bar moves the window', async ({ page }) => {
    await newWindow(page);
    const w = win(page, 'Hello 1');
    const before = await box(w);
    await drag(page, w.getByRole('heading'), 120, 80);
    const after = await box(w);
    expect(Math.round(after.x - before.x)).toBe(120);
    expect(Math.round(after.y - before.y)).toBe(80);
  });

  test('a window cannot be dragged off the top of the desktop', async ({
    page,
  }) => {
    await newWindow(page);
    const w = win(page, 'Hello 1');
    await drag(page, w.getByRole('heading'), 0, -500);
    const menubar = await box(page.locator('header'));
    expect((await box(w)).y).toBeGreaterThanOrEqual(menubar.y + menubar.height);
  });

  test('dragging the grow box resizes the window', async ({ page }) => {
    await newWindow(page);
    const w = win(page, 'Hello 1');
    const before = await box(w);
    await drag(page, w.getByTestId('grow-box'), 60, 40);
    const after = await box(w);
    expect(Math.round(after.width - before.width)).toBe(60);
    expect(Math.round(after.height - before.height)).toBe(40);
  });

  test('scroll arrows scroll the content', async ({ page }) => {
    await newWindow(page);
    const w = win(page, 'Hello 1');
    const viewport = w.locator('[tabindex="0"]:not(h2)');
    await expect(w.getByText('Line 20.')).toBeAttached(); // app loaded (lazily)
    await w.getByTestId('scroll-down').click();
    await expect
      .poll(() => viewport.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0);
  });
});

test('zoom fills the desktop and zooming again restores it', async ({
  page,
}) => {
  await newWindow(page);
  const w = win(page, 'Hello 1');
  const before = await box(w);
  await w.getByRole('button', { name: 'Zoom Hello 1' }).click();
  const desktop = await box(page.getByRole('main'));
  const zoomed = await box(w);
  expect(zoomed.width).toBeGreaterThan(desktop.width - 8);
  await w.getByRole('button', { name: 'Restore Hello 1' }).click();
  expect(await box(w)).toEqual(before);
});

test('collapse shows only the title bar; double-clicking the title expands', async ({
  page,
}) => {
  await newWindow(page);
  const w = win(page, 'Hello 1');
  await w.getByRole('button', { name: 'Collapse Hello 1' }).click();
  await expect(w).toHaveAttribute('data-collapsed', 'true');
  expect((await box(w)).height).toBeLessThan(30);
  await w.getByRole('heading').dblclick();
  await expect(w).not.toHaveAttribute('data-collapsed');
});

test('closing the front window activates the one behind it', async ({
  page,
}) => {
  await newWindow(page);
  await newWindow(page);
  await win(page, 'Hello 2')
    .getByRole('button', { name: 'Close Hello 2' })
    .click();
  await expect(win(page, 'Hello 2')).toHaveCount(0);
  await expect(win(page, 'Hello 1')).toHaveAttribute('data-active', 'true');
  await expect(win(page, 'Hello 1')).toBeFocused();
});

test('File → Close Window closes the active window', async ({ page }) => {
  await newWindow(page);
  await page
    .getByRole('menubar')
    .getByRole('menuitem', { name: 'File', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Close Window' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test.describe('keyboard', () => {
  test('arrows on the title move; Shift+arrows resize', async ({ page }) => {
    await newWindow(page);
    const w = win(page, 'Hello 1');
    const title = w.getByRole('heading');
    await title.focus();
    const start = await box(w);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    const moved = await box(w);
    expect(Math.round(moved.x - start.x)).toBe(16);
    expect(Math.round(moved.y - start.y)).toBe(16);

    // Shrink rather than grow: on a phone the window is already as wide as the desktop.
    await page.keyboard.press('Shift+ArrowLeft');
    expect(Math.round(moved.width - (await box(w)).width)).toBe(16);
  });

  test('Ctrl+` cycles windows and moves focus', async ({ page }) => {
    await newWindow(page);
    await newWindow(page);
    await page.keyboard.press('Control+Backquote');
    await expect(win(page, 'Hello 1')).toHaveAttribute('data-active', 'true');
    await expect(win(page, 'Hello 1')).toBeFocused();
    await page.keyboard.press('Control+Backquote');
    await expect(win(page, 'Hello 2')).toHaveAttribute('data-active', 'true');
  });

  test('window controls are reachable with Tab in a sensible order', async ({
    page,
  }) => {
    await newWindow(page);
    const w = win(page, 'Hello 1');
    await page.keyboard.press('Tab');
    await expect(
      w.getByRole('button', { name: 'Close Hello 1' }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(w.getByRole('heading')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(w.getByRole('button', { name: 'Zoom Hello 1' })).toBeFocused();
  });
});

test('no axe violations with windows open', async ({ page }) => {
  await newWindow(page);
  await newWindow(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);
});
