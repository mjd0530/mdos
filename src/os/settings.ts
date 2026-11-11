import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PATTERNS, type PatternName } from '../assets/patterns';
import { storage } from './persist';

/** Visitor preferences, changed in Control Panel and remembered between visits (D-025). */
export interface Settings {
  pattern: PatternName;
  clock24h: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  pattern: 'grey',
  clock24h: false,
};

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
      partialize: ({ pattern, clock24h }) => ({ pattern, clock24h }),
      merge: (saved, current) => ({ ...current, ...sanitizeSettings(saved) }),
    },
  ),
);
