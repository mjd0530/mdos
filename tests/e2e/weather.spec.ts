import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Open-Meteo is mocked: tests never depend on the real service or today's weather.
async function mockOpenMeteo(page: Page, requests: URL[] = []) {
  await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    const celsius = url.searchParams.get('temperature_unit') === 'celsius';
    return route.fulfill({
      json: {
        current: {
          temperature_2m: celsius ? 18.3 : 64.9,
          apparent_temperature: celsius ? 16.1 : 60.9,
          weather_code: 3,
          wind_speed_10m: 5.2,
          is_day: 1,
        },
        daily: {
          time: [
            '2026-11-11',
            '2026-11-12',
            '2026-11-13',
            '2026-11-14',
            '2026-11-15',
          ],
          weather_code: [3, 61, 0, 71, 95],
          temperature_2m_max: [73, 69, 55, 53, 53],
          temperature_2m_min: [43, 47, 41, 39, 36],
        },
      },
    });
  });
  await page.route(
    'https://geocoding-api.open-meteo.com/v1/search**',
    (route) =>
      route.fulfill({
        json: {
          results: [
            {
              name: 'Paris',
              latitude: 48.85341,
              longitude: 2.3488,
              admin1: 'Île-de-France',
              country: 'France',
            },
          ],
        },
      }),
  );
}

async function openWeather(page: Page) {
  await page
    .getByRole('listbox', { name: 'Desktop' })
    .getByRole('option', { name: 'Weather', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  return page.getByRole('dialog', { name: 'Weather' });
}

test('shows Cary by default: now, a 5-day forecast and the credit', async ({
  page,
}) => {
  const requests: URL[] = [];
  await mockOpenMeteo(page, requests);
  await page.goto('./');
  const weather = await openWeather(page);

  await expect(weather.getByRole('heading', { name: 'Cary' })).toBeVisible();
  await expect(weather.getByText('65°F')).toBeVisible();
  await expect(weather.getByText('Overcast', { exact: true })).toBeVisible();
  await expect(
    weather
      .getByRole('region', { name: 'Five-day forecast' })
      .getByRole('listitem'),
  ).toHaveCount(5);
  await expect(
    weather.getByRole('link', { name: 'Weather data by Open-Meteo.com' }),
  ).toHaveAttribute('href', 'https://open-meteo.com/');
  expect(requests[0]?.searchParams.get('latitude')).toBe('35.79');
});

test('°C is applied and remembered', async ({ page }) => {
  const requests: URL[] = [];
  await mockOpenMeteo(page, requests);
  await page.goto('./');
  const weather = await openWeather(page);
  await weather.getByRole('button', { name: '°C' }).click();
  await expect(weather.getByText('18°C')).toBeVisible();
  expect(requests.at(-1)?.searchParams.get('temperature_unit')).toBe('celsius');

  await page.reload();
  const again = await openWeather(page);
  await expect(again.getByText('18°C')).toBeVisible();
});

test('searching for a city switches to it and remembers it', async ({
  page,
}) => {
  await mockOpenMeteo(page);
  await page.goto('./');
  const weather = await openWeather(page);
  await weather.getByRole('button', { name: 'Change city…' }).click();
  await weather.getByLabel('City').fill('Paris');
  await weather.getByRole('button', { name: 'Search' }).click();
  await weather
    .getByRole('button', { name: /Paris — Île-de-France, France/ })
    .click();
  await expect(weather.getByRole('heading', { name: 'Paris' })).toBeVisible();

  await page.reload();
  const again = await openWeather(page);
  await expect(again.getByRole('heading', { name: 'Paris' })).toBeVisible();
});

test('"Use my location" sends a rounded position and does not save it', async ({
  page,
  context,
}) => {
  const requests: URL[] = [];
  await mockOpenMeteo(page, requests);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 51.507351, longitude: -0.127758 });
  await page.goto('./');
  const weather = await openWeather(page);
  await weather.getByRole('button', { name: 'Use my location' }).click();

  await expect(
    weather.getByRole('heading', { name: 'Your location' }),
  ).toBeVisible();
  const last = requests.at(-1);
  expect(last?.searchParams.get('latitude')).toBe('51.51');
  expect(last?.searchParams.get('longitude')).toBe('-0.13');

  await page.reload();
  const again = await openWeather(page);
  await expect(again.getByRole('heading', { name: 'Cary' })).toBeVisible();
});

test('a failed request offers Try Again', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => route.abort());
  await page.goto('./');
  const weather = await openWeather(page);
  await expect(weather.getByRole('alert')).toContainText('couldn’t be reached');

  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await mockOpenMeteo(page);
  await weather.getByRole('button', { name: 'Try Again' }).click();
  await expect(weather.getByText('65°F')).toBeVisible();
});

test('no axe violations in Weather', async ({ page }) => {
  await mockOpenMeteo(page);
  await page.goto('./');
  const weather = await openWeather(page);
  await weather.getByRole('button', { name: 'Change city…' }).click();
  await expect(weather.getByText('65°F')).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);
});
