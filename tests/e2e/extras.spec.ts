import { expect, test, type Page } from '@playwright/test';
import { isPhone } from './device.ts';

async function chooseMenu(page: Page, menu: string, item: string) {
  await page
    .getByRole('menubar')
    .getByRole('menuitem', { name: menu, exact: true })
    .click();
  await page.getByRole('menuitem', { name: item }).click();
}

const saveSettings = (page: Page, settings: Record<string, unknown>) =>
  page.addInitScript((state) => {
    localStorage.setItem(
      'mikeos:settings',
      JSON.stringify({ state, version: 1 }),
    );
  }, settings);

test.describe('screensaver', () => {
  test('starts from the Special menu; a key press ends it without acting underneath', async ({
    page,
  }) => {
    await page.goto('./');
    await chooseMenu(page, 'Special', 'Start Screensaver');
    const saver = page.getByTestId('screensaver');
    await expect(saver).toBeVisible();

    // Enter would re-open the focused Special menu if it leaked through.
    await page.keyboard.press('Enter');
    await expect(saver).toHaveCount(0);
    await expect(page.getByRole('menu')).toHaveCount(0);
  });

  test('starts by itself after the idle time, and activity resets the timer', async ({
    page,
  }, testInfo) => {
    test.skip(isPhone(testInfo), 'no idle screensaver on phones');
    await saveSettings(page, { screensaverMinutes: 1 });
    await page.clock.install();
    await page.goto('./');
    const saver = page.getByTestId('screensaver');

    await page.clock.fastForward(50_000);
    await page.keyboard.press('Shift'); // activity
    await page.clock.fastForward(50_000);
    await expect(saver).toHaveCount(0); // 100s since load, but only 50s idle

    await page.clock.fastForward(11_000);
    await expect(saver).toBeVisible();
  });

  test('never starts when turned off', async ({ page }) => {
    await saveSettings(page, { screensaver: false, screensaverMinutes: 1 });
    await page.clock.install();
    await page.goto('./');
    await page.clock.fastForward(5 * 60_000);
    await expect(page.getByTestId('screensaver')).toHaveCount(0);
  });

  test('shows a still scene under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    await chooseMenu(page, 'Special', 'Start Screensaver');
    const canvas = page.getByTestId('screensaver').locator('canvas');
    await expect(canvas).toBeVisible();
    const snapshot = () =>
      canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
    const first = await snapshot();
    await page.waitForTimeout(400);
    expect(await snapshot()).toBe(first);
  });
});

test.describe('cursor clock', () => {
  test.skip(({ hasTouch }) => hasTouch, 'mouse pointers only');

  test('follows the mouse, ignores clicks, and can be turned off', async ({
    page,
  }) => {
    await page.goto('./');
    const clock = page.getByTestId('cursor-clock');
    await expect(clock).toBeHidden();
    await page.mouse.move(300, 300);
    await expect(clock).toBeVisible();
    await expect(clock).toHaveText(/\d:\d\d/);
    const box = await clock.boundingBox();
    expect(box?.x).toBeGreaterThan(300);
    expect(box?.y).toBeGreaterThan(300);
    await expect(clock).toHaveCSS('pointer-events', 'none');
    await expect(clock).toHaveAttribute('aria-hidden', 'true');

    await chooseMenu(page, 'Mike OS', 'Control Panel');
    await page
      .getByRole('dialog', { name: 'Control Panel' })
      .getByText('Clock follows the pointer')
      .click();
    await expect(clock).toHaveCount(0);
  });
});

test.describe('sounds', () => {
  // Count the notes Mike OS asks the browser to play.
  const countNotes = (page: Page) =>
    page.addInitScript(() => {
      const w = window as unknown as { notes: number };
      w.notes = 0;
      const original = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function (this: AudioContext) {
        w.notes++;
        return original.call(this);
      };
    });
  const notes = (page: Page) =>
    page.evaluate(() => (window as unknown as { notes: number }).notes);

  test('are silent by default', async ({ page }) => {
    await countNotes(page);
    await page.goto('./');
    await chooseMenu(page, 'Mike OS', 'Control Panel');
    await expect(
      page.getByRole('dialog', { name: 'Control Panel' }),
    ).toBeVisible();
    expect(await notes(page)).toBe(0);
  });

  test('play once turned on in Control Panel', async ({ page }) => {
    await countNotes(page);
    await page.goto('./');
    await chooseMenu(page, 'Mike OS', 'Control Panel');
    const panel = page.getByRole('dialog', { name: 'Control Panel' });
    await expect(panel.getByRole('slider', { name: 'Volume' })).toBeDisabled();
    await panel.getByText('System sounds').click();
    await expect(panel.getByRole('slider', { name: 'Volume' })).toBeEnabled();
    const afterEnable = await notes(page);
    expect(afterEnable).toBeGreaterThan(0); // the confirmation chime

    await panel.getByRole('button', { name: 'Close Control Panel' }).click();
    expect(await notes(page)).toBeGreaterThan(afterEnable); // the close sound
  });
});
