import { expect, test, type Page } from '@playwright/test';

async function openHello(page: Page) {
  await page.waitForFunction(() => 'mikeos' in window);
  await page.evaluate(() =>
    (
      window as unknown as { mikeos: { launch: (id: string) => void } }
    ).mikeos.launch('hello'),
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto('./?e2e');
});

test('the Hello test fixture is not shown to visitors', async ({ page }) => {
  await page
    .getByRole('menubar')
    .getByRole('menuitem', { name: 'MDOS', exact: true })
    .click();
  await expect(page.getByRole('menuitem', { name: 'Hello' })).toHaveCount(0);
});

test('apps open in their own windows', async ({ page }) => {
  await openHello(page);
  const w = page.getByRole('dialog', { name: 'Hello 1' });
  await expect(w.getByText('is a test app running in window')).toBeVisible();
});

test('a crashing app shows a message in its window and can relaunch', async ({
  page,
}) => {
  page.on('console', () => {}); // the crash is logged on purpose
  await openHello(page);
  await openHello(page);
  const crashed = page.getByRole('dialog', { name: 'Hello 2' });
  await crashed.getByRole('button', { name: 'Simulate a crash' }).click();

  const alert = crashed.getByRole('alert');
  await expect(alert).toContainText('“Hello” has unexpectedly quit');
  // The other window is unaffected (on phones it's simply behind, so check it exists).
  await expect(
    page
      .getByRole('dialog', { name: 'Hello 1', includeHidden: true })
      .getByRole('button', { name: 'Simulate a crash', includeHidden: true }),
  ).toBeAttached();

  await crashed.getByRole('button', { name: 'Relaunch' }).click();
  await expect(alert).toHaveCount(0);
  await expect(
    crashed.getByRole('button', { name: 'Simulate a crash' }),
  ).toBeVisible();
});

test('Close in the crash message closes the window', async ({ page }) => {
  await openHello(page);
  const w = page.getByRole('dialog', { name: 'Hello 1' });
  await w.getByRole('button', { name: 'Simulate a crash' }).click();
  await w.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(w).toHaveCount(0);
});
