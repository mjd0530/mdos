import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PATTERNS, type PatternName } from '../assets/patterns';
import { storage } from './persist';

/** Visitor preferences, changed in Control Panel and remembered between visits (D-025). */
export interface SavedPlace {
  name: string;
  region?: string;
  latitude: number;
  longitude: number;
}

export interface Settings {
  pattern: PatternName;
  clock24h: boolean;
  weatherUnit: 'fahrenheit' | 'celsius';
  /** A city the visitor searched for. Never a "Use my location" position (D-026). */
  weatherPlace: SavedPlace | null;
}

export const DEFAULT_SETTINGS: Settings = {
  pattern: 'grey',
  clock24h: false,
  weatherUnit: 'fahrenheit',
  weatherPlace: null,
};

function sanitizePlace(value: unknown): SavedPlace | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as Record<string, unknown>;
  const ok =
    typeof p.name === 'string' &&
    typeof p.latitude === 'number' &&
    Number.isFinite(p.latitude) &&
    Math.abs(p.latitude) <= 90 &&
    typeof p.longitude === 'number' &&
    Number.isFinite(p.longitude) &&
    Math.abs(p.longitude) <= 180;
  if (!ok) return null;
  return {
    name: p.name as string,
    region: typeof p.region === 'string' ? p.region : undefined,
    latitude: p.latitude as number,
    longitude: p.longitude as number,
  };
}

interface SettingsState extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  restoreDefaults: () => void;
}

/** Keep only valid saved values; anything unknown falls back to the default. */
export function sanitizeSettings(saved: unknown): Settings {
  const value = (saved && typeof saved === 'object' ? saved : {}) as Record<
    string,
    unknown
  >;
  return {
    pattern:
      typeof value.pattern === 'string' && value.pattern in PATTERNS
        ? (value.pattern as PatternName)
        : DEFAULT_SETTINGS.pattern,
    clock24h:
      typeof value.clock24h === 'boolean'
        ? value.clock24h
        : DEFAULT_SETTINGS.clock24h,
    weatherUnit:
      value.weatherUnit === 'celsius' || value.weatherUnit === 'fahrenheit'
        ? value.weatherUnit
        : DEFAULT_SETTINGS.weatherUnit,
    weatherPlace: sanitizePlace(value.weatherPlace),
  };
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (key, value) => set({ [key]: value } as Partial<Settings>),
      restoreDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'mikeos:settings',
      version: 1,
      storage,
      partialize: ({ pattern, clock24h, weatherUnit, weatherPlace }) => ({
        pattern,
        clock24h,
        weatherUnit,
        weatherPlace,
      }),
      merge: (saved, current) => ({ ...current, ...sanitizeSettings(saved) }),
    },
  ),
);
