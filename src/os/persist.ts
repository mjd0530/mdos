import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/** Every key Mike OS saves starts with this, so Reset can find them all. */
export const STORAGE_PREFIX = 'mikeos:';

// localStorage can be missing or throw (private windows, blocked site data). Saving is a
// convenience, so failures are silent and the app runs on defaults.
const safeLocalStorage: StateStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage full or blocked: keep running */
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const storage = createJSONStorage(() => safeLocalStorage);

/** Forget everything Mike OS has saved in this browser. */
export function clearSaved() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** Keep only well-formed entries whose values pass `check`; anything else is dropped. */
export function sanitizeRecord<T>(
  value: unknown,
  check: (entry: unknown) => entry is T,
): Record<string, T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, T] =>
      check(entry[1]),
    ),
  );
}

export const isPoint = (value: unknown): value is { x: number; y: number } =>
  !!value &&
  typeof value === 'object' &&
  isFiniteNumber((value as { x?: unknown }).x) &&
  isFiniteNumber((value as { y?: unknown }).y);

export function isRect(
  value: unknown,
): value is { x: number; y: number; w: number; h: number } {
  if (!isPoint(value)) return false;
  const { w, h } = value as { w?: unknown; h?: unknown };
  return isFiniteNumber(w) && isFiniteNumber(h) && w > 0 && h > 0;
}
