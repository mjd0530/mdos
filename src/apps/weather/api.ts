// Open-Meteo: free, no key, CORS-enabled; data under CC BY 4.0 with visible attribution
// (D-026). Everything here is pure or a thin fetch so it can be unit-tested.

import type { IconName } from '../../assets/icons/icons';

export interface Place {
  name: string;
  /** e.g. "North Carolina, United States" */
  region?: string;
  latitude: number;
  longitude: number;
}

export type Unit = 'fahrenheit' | 'celsius';

export interface Forecast {
  current: {
    temperature: number;
    feelsLike: number;
    windSpeed: number;
    code: number;
    isDay: boolean;
  };
  days: { date: string; code: number; high: number; low: number }[];
}

/** Mike's home town: the default until a visitor chooses otherwise. */
export const DEFAULT_PLACE: Place = {
  name: 'Cary',
  region: 'North Carolina, United States',
  latitude: 35.79,
  longitude: -78.78,
};

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const TIMEOUT_MS = 8000;

/** Two decimals ≈ 1 km: plenty for weather, and no more precise than it needs to be. */
export const roundCoordinate = (value: number) => Math.round(value * 100) / 100;

export function forecastUrl(place: Place, unit: Unit): string {
  const params = new URLSearchParams({
    latitude: String(roundCoordinate(place.latitude)),
    longitude: String(roundCoordinate(place.longitude)),
    current:
      'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '5',
    temperature_unit: unit,
    wind_speed_unit: unit === 'fahrenheit' ? 'mph' : 'kmh',
  });
  return `${FORECAST_URL}?${params}`;
}

export function searchUrl(query: string): string {
  const params = new URLSearchParams({
    name: query.trim(),
    count: '5',
    language: 'en',
    format: 'json',
  });
  return `${GEOCODE_URL}?${params}`;
}

const num = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Unexpected weather data');
  }
  return value;
};

/** Validate and reshape the forecast response; throws on anything unexpected. */
export function parseForecast(data: unknown): Forecast {
  const d = data as {
    current?: Record<string, unknown>;
    daily?: Record<string, unknown[]>;
  };
  const current = d.current ?? {};
  const daily = d.daily ?? {};
  const dates = Array.isArray(daily.time) ? daily.time : [];
  return {
    current: {
      temperature: num(current.temperature_2m),
      feelsLike: num(current.apparent_temperature),
      windSpeed: num(current.wind_speed_10m),
      code: num(current.weather_code),
      isDay: current.is_day === 1,
    },
    days: dates.map((date, i) => ({
      date: String(date),
      code: num(daily.weather_code?.[i]),
      high: num(daily.temperature_2m_max?.[i]),
      low: num(daily.temperature_2m_min?.[i]),
    })),
  };
}

export function parsePlaces(data: unknown): Place[] {
  const results = (data as { results?: unknown[] }).results;
  if (!Array.isArray(results)) return [];
  return results.flatMap((r) => {
    const place = r as Record<string, unknown>;
    if (
      typeof place.name !== 'string' ||
      typeof place.latitude !== 'number' ||
      typeof place.longitude !== 'number'
    ) {
      return [];
    }
    const region = [place.admin1, place.country]
      .filter((part): part is string => typeof part === 'string')
      .join(', ');
    return [
      {
        name: place.name,
        region: region || undefined,
        latitude: place.latitude,
        longitude: place.longitude,
      },
    ];
  });
}

/** WMO weather codes → words and one of our 1-bit icons. */
export function describeCode(
  code: number,
  isDay = true,
): { label: string; icon: IconName } {
  if (code === 0) {
    return { label: 'Clear', icon: isDay ? 'weatherClear' : 'weatherNight' };
  }
  if (code <= 2) return { label: 'Partly cloudy', icon: 'weather' };
  if (code === 3) return { label: 'Overcast', icon: 'weatherCloudy' };
  if (code === 45 || code === 48)
    return { label: 'Fog', icon: 'weatherCloudy' };
  if (code >= 51 && code <= 57)
    return { label: 'Drizzle', icon: 'weatherRain' };
  if (code >= 61 && code <= 67) return { label: 'Rain', icon: 'weatherRain' };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: 'weatherSnow' };
  if (code >= 80 && code <= 82)
    return { label: 'Showers', icon: 'weatherRain' };
  if (code === 85 || code === 86) {
    return { label: 'Snow showers', icon: 'weatherSnow' };
  }
  if (code >= 95) return { label: 'Thunderstorm', icon: 'weatherStorm' };
  return { label: 'Unknown', icon: 'weather' };
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const response = await fetch(url, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!response.ok) throw new Error(`Weather service error ${response.status}`);
  return response.json();
}

export async function fetchForecast(
  place: Place,
  unit: Unit,
  signal?: AbortSignal,
): Promise<Forecast> {
  return parseForecast(await getJson(forecastUrl(place, unit), signal));
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<Place[]> {
  if (query.trim().length < 2) return [];
  return parsePlaces(await getJson(searchUrl(query), signal));
}
