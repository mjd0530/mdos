import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PLACE,
  describeCode,
  forecastUrl,
  parseForecast,
  parsePlaces,
  roundCoordinate,
  searchUrl,
} from './api';

describe('URLs', () => {
  it('asks for the forecast with rounded coordinates and the chosen unit', () => {
    const url = new URL(
      forecastUrl(
        { name: 'Here', latitude: 35.791234, longitude: -78.781299 },
        'celsius',
      ),
    );
    expect(url.origin).toBe('https://api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('35.79');
    expect(url.searchParams.get('longitude')).toBe('-78.78');
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
    expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
    expect(url.searchParams.get('forecast_days')).toBe('5');
  });

  it('uses mph with Fahrenheit', () => {
    const url = new URL(forecastUrl(DEFAULT_PLACE, 'fahrenheit'));
    expect(url.searchParams.get('wind_speed_unit')).toBe('mph');
  });

  it('builds a trimmed place search', () => {
    expect(new URL(searchUrl('  Paris ')).searchParams.get('name')).toBe(
      'Paris',
    );
  });

  it('rounds coordinates to two decimals', () => {
    expect(roundCoordinate(51.507351)).toBe(51.51);
  });
});

describe('parseForecast', () => {
  const response = {
    current: {
      temperature_2m: 64.9,
      apparent_temperature: 60.9,
      weather_code: 3,
      wind_speed_10m: 5.2,
      is_day: 0,
    },
    daily: {
      time: ['2026-11-11', '2026-11-12'],
      weather_code: [3, 61],
      temperature_2m_max: [73.3, 69.2],
      temperature_2m_min: [42.6, 47.3],
    },
  };

  it('reshapes a real response', () => {
    expect(parseForecast(response)).toEqual({
      current: {
        temperature: 64.9,
        feelsLike: 60.9,
        windSpeed: 5.2,
        code: 3,
        isDay: false,
      },
      days: [
        { date: '2026-11-11', code: 3, high: 73.3, low: 42.6 },
        { date: '2026-11-12', code: 61, high: 69.2, low: 47.3 },
      ],
    });
  });

  it('rejects malformed data instead of showing nonsense', () => {
    expect(() => parseForecast({ current: { temperature_2m: 'hot' } })).toThrow(
      /Unexpected/,
    );
    expect(() => parseForecast({})).toThrow();
  });
});

describe('parsePlaces', () => {
  it('keeps name, region and coordinates', () => {
    expect(
      parsePlaces({
        results: [
          {
            name: 'Cary',
            latitude: 35.79,
            longitude: -78.78,
            admin1: 'North Carolina',
            country: 'United States',
          },
          { name: 'Broken' },
        ],
      }),
    ).toEqual([
      {
        name: 'Cary',
        region: 'North Carolina, United States',
        latitude: 35.79,
        longitude: -78.78,
      },
    ]);
  });

  it('handles no results', () => {
    expect(parsePlaces({})).toEqual([]);
  });
});

describe('describeCode', () => {
  it.each([
    [0, true, 'Clear', 'weatherClear'],
    [0, false, 'Clear', 'weatherNight'],
    [2, true, 'Partly cloudy', 'weather'],
    [45, true, 'Fog', 'weatherCloudy'],
    [63, true, 'Rain', 'weatherRain'],
    [73, true, 'Snow', 'weatherSnow'],
    [95, true, 'Thunderstorm', 'weatherStorm'],
  ])('code %i (day %s) is %s', (code, isDay, label, icon) => {
    expect(describeCode(code, isDay)).toEqual({ label, icon });
  });
});
