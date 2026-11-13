import { create } from 'zustand';
import { PATTERNS, type PatternName } from '../assets/patterns';
import { STORAGE_PREFIX } from './persist';

const PATTERN_NAMES = Object.keys(PATTERNS) as PatternName[];

/** The pattern shown last visit, so the next visit never repeats it (D-033). */
const LAST_PATTERN_KEY = `${STORAGE_PREFIX}lastPattern`;

/** Pick any pattern except `last`. `random` returns [0, 1), like Math.random. */
export function pickPattern(
  last: string | null,
  random: () => number = Math.random,
): PatternName {
  const choices = PATTERN_NAMES.filter((name) => name !== last);
  return choices[Math.floor(random() * choices.length)] ?? 'grey';
}

function remember(pattern: PatternName) {
  try {
    window.localStorage.setItem(LAST_PATTERN_KEY, pattern);
  } catch {
    /* blocked storage: repeats just become possible */
  }
}

function pickForThisVisit(): PatternName {
  let last: string | null = null;
  try {
    last = window.localStorage.getItem(LAST_PATTERN_KEY);
  } catch {
    /* blocked storage: any pattern will do */
  }
  const picked = pickPattern(last);
  remember(picked);
  return picked;
}

const visitPick = pickForThisVisit();

interface DesktopPatternState {
  pattern: PatternName;
  /** Control Panel: show this pattern for the rest of the visit. */
  choose: (pattern: PatternName) => void;
  /** Back to the pattern this visit started with. */
  reset: () => void;
}

/** The desktop pattern: a random one each visit, not a saved setting (D-033). */
export const useDesktopPattern = create<DesktopPatternState>()((set) => ({
  pattern: visitPick,
  choose: (pattern) => {
    remember(pattern);
    set({ pattern });
  },
  reset: () => {
    remember(visitPick);
    set({ pattern: visitPick });
  },
}));
