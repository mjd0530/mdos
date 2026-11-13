import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// The music player (D-034). Runs against the placeholder "Test Tones" album until the
// real albums arrive; the tests only rely on there being one album of 3+ songs.

async function openPlayer(page: Page) {
  await page
    .getByRole('listbox', { name: 'Desktop' })
    .getByRole('option', { name: 'Music', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  return page.getByRole('dialog', { name: 'Music' });
}

const nowPlaying = (page: Page) =>
  page.getByRole('button', { name: /^Now playing:/ });

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);
}

test('Deck plays, skips, pauses and shows lyrics', async ({ page }) => {
  await page.goto('./');
  const player = await openPlayer(page);
  const songs = player.getByRole('list', { name: /songs$/ });
  await expect(songs.getByRole('button')).toHaveCount(3);
  await axe(page);

  await player.getByRole('button', { name: 'Play' }).click();
  await expect(player.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(nowPlaying(page)).toBeVisible();
  // Time moves.
  await expect(
    player.getByRole('slider', { name: 'Position' }),
  ).not.toHaveAttribute('aria-valuetext', /^0:00 /, { timeout: 5000 });

  await player.getByRole('button', { name: 'Next' }).click();
  await expect(songs.locator('[aria-current]')).toContainText('Middle Tone');

  // Space pauses from anywhere in the player (not on a button).
  await player.getByRole('tab', { name: 'Lyrics' }).click();
  await expect(player.getByRole('tabpanel')).toContainText(
    'No lyrics for this song.',
  );
  await player.getByRole('tabpanel').click();
  await page.keyboard.press('Space');
  await expect(player.getByRole('button', { name: 'Play' })).toBeVisible();
  await expect(nowPlaying(page)).toHaveCount(0);

  // Skipping while paused moves without starting playback.
  await player.getByRole('tab', { name: 'Playlist' }).click();
  await player.getByRole('button', { name: 'Next' }).click();
  await expect(songs.locator('[aria-current]')).toContainText('High Tone');
  await expect(player.getByRole('button', { name: 'Play' })).toBeVisible();
  await expect(nowPlaying(page)).toHaveCount(0);

  await player.getByRole('button', { name: 'Previous' }).click();
  await player.getByRole('button', { name: 'Previous' }).click();
  await expect(songs.locator('[aria-current]')).toContainText('Low Tone');
  await player.getByRole('button', { name: 'Play' }).click();
  await player.getByRole('tab', { name: 'Lyrics' }).click();
  await expect(player.getByRole('tabpanel')).toContainText('TODO(mike)');
  await axe(page);
});

test('music keeps playing when collapsed and stops when closed', async ({
  page,
}, info) => {
  test.skip(info.project.name === 'mobile', 'Phones have no collapse box');
  await page.goto('./');
  const player = await openPlayer(page);
  await player.getByRole('button', { name: 'Play' }).click();
  await expect(nowPlaying(page)).toBeVisible();

  await player.getByRole('button', { name: 'Collapse Music' }).click();
  await page.waitForTimeout(500);
  await expect(nowPlaying(page)).toBeVisible();

  // The indicator brings the player back to the front.
  await player.getByRole('button', { name: 'Close Music' }).click();
  await expect(nowPlaying(page)).toHaveCount(0);
});

test('Pocket: menus, keyboard and the remembered look', async ({ page }) => {
  await page.goto('./');
  let player = await openPlayer(page);
  await player.getByRole('button', { name: 'Switch to Pocket' }).click();
  const screen = player.getByRole('region', { name: 'Screen' });
  await expect(screen.getByRole('heading', { name: 'Music' })).toBeVisible();
  await axe(page);

  await screen.getByRole('button', { name: /^Songs/ }).click();
  await expect(
    screen.getByRole('heading', { name: 'Test Tones' }),
  ).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(
    screen.getByRole('heading', { name: 'Now Playing' }),
  ).toBeVisible();
  await expect(screen).toContainText('3 of 3');
  await expect(screen).toContainText('High Tone');
  await expect(nowPlaying(page)).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(
    screen.getByRole('heading', { name: 'Test Tones' }),
  ).toBeVisible();
  await player.getByRole('button', { name: 'Back' }).click();
  await expect(screen.getByRole('heading', { name: 'Music' })).toBeVisible();

  await player.getByRole('button', { name: 'Close Music' }).click();
  player = await openPlayer(page);
  await expect(player.getByRole('region', { name: 'Screen' })).toBeVisible();
});

test('the plain music page has a player for every song', async ({ page }) => {
  await page.goto('./plain/');
  await page.getByRole('link', { name: 'Music', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Music');
  await expect(page.locator('audio')).toHaveCount(3);
  const src = await page.locator('audio').first().getAttribute('src');
  const response = await page.request.get(src ?? '');
  expect(response.ok()).toBe(true);
  await axe(page);
});

test('both looks pass axe on the Black & White display', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'mikeos:settings',
      JSON.stringify({ state: { display: 'bw' }, version: 1 }),
    ),
  );
  await page.goto('./');
  const player = await openPlayer(page);
  await player.getByRole('button', { name: 'Play' }).click();
  await axe(page);
  await player.getByRole('button', { name: 'Switch to Pocket' }).click();
  await axe(page);
});
