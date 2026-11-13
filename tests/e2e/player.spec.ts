import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// The music player (D-034, D-035). Uses the fixture album "Test Tones"
// (tests/fixtures/music, added by MDOS_TEST_MUSIC in playwright.config.ts): three
// short tones, the first with lyrics and the second without. Real albums may be listed
// before it, so tests pick it by name.

async function openPlayer(page: Page) {
  await page
    .getByRole('listbox', { name: 'Desktop' })
    .getByRole('option', { name: 'Music', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  return page.getByRole('dialog', { name: 'Music' });
}

/** Deck: show the Test Tones playlist (album buttons appear only with 2+ albums). */
async function showTestTones(player: Locator) {
  // Wait for the player to load before asking whether it has an album list.
  await expect(player.getByRole('list', { name: /songs$/ })).toBeVisible();
  const albums = player.getByRole('list', { name: 'Albums' });
  if (await albums.count()) {
    await albums.getByRole('button', { name: 'Test Tones' }).click();
  }
  return player.getByRole('list', { name: 'Test Tones songs' });
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
  const songs = await showTestTones(player);
  await expect(songs.getByRole('button')).toHaveCount(3);
  await axe(page);

  await songs.getByRole('button', { name: /Low Tone/ }).click();
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
  await expect(player.getByRole('tabpanel')).toContainText(
    'Placeholder lyrics',
  );
  await axe(page);
});

test('it has no window frame and moves by its own grip', async ({
  page,
}, info) => {
  await page.goto('./');
  const player = await openPlayer(page);
  // Free-standing (D-035): no System 7 title bar boxes, just the player's own controls.
  await expect(player.getByRole('button', { name: /^Zoom / })).toHaveCount(0);
  await expect(
    player.getByRole('button', { name: 'Close Music' }),
  ).toBeVisible();
  test.skip(
    info.project.name === 'mobile',
    'Phones centre it; nothing to move',
  );
  const before = await player.boundingBox();
  await player.getByRole('button', { name: 'Move Music' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  const after = await player.boundingBox();
  expect(after?.x).toBeGreaterThan(before?.x ?? 0);
  expect(after?.y).toBeGreaterThan(before?.y ?? 0);
});

test('music keeps playing behind other windows and stops when closed', async ({
  page,
}) => {
  await page.goto('./');
  const player = await openPlayer(page);
  await player.getByRole('button', { name: 'Play' }).click();
  await expect(nowPlaying(page)).toBeVisible();

  // Open another window over it (on phones it hides the player completely).
  await page
    .getByRole('listbox', { name: 'Desktop' })
    .getByRole('option', { name: 'Read Me', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Read Me' })).toBeVisible();
  await page.waitForTimeout(500);
  await expect(nowPlaying(page)).toBeVisible();

  // The menu-bar note brings the player back to the front.
  await nowPlaying(page).click();
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

  // One album opens straight to its songs; several go through Albums.
  const albumsItem = screen.getByRole('button', { name: /^Albums/ });
  if (await albumsItem.count()) {
    await albumsItem.click();
    await screen.getByRole('button', { name: /^Test Tones/ }).click();
  } else {
    await screen.getByRole('button', { name: /^Songs/ }).click();
  }
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
  while (!(await screen.getByRole('heading', { name: 'Music' }).count())) {
    await player.getByRole('button', { name: 'Back' }).click();
  }

  await player.getByRole('button', { name: 'Close Music' }).click();
  player = await openPlayer(page);
  await expect(player.getByRole('region', { name: 'Screen' })).toBeVisible();
});

test('the plain music page has a player for every song', async ({ page }) => {
  await page.goto('./plain/');
  await page.getByRole('link', { name: 'Music', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Music');
  const album = page.locator('section', {
    has: page.getByRole('heading', { name: 'Test Tones' }),
  });
  await expect(album.locator('audio')).toHaveCount(3);
  const src = await album.locator('audio').first().getAttribute('src');
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
