import { PATTERNS, type PatternName } from '../assets/patterns';
import { STORAGE_PREFIX } from './persist';
import { useSettings } from './settings';

const PATTERN_NAMES = Object.keys(PATTERNS) as PatternName[];

/** The pattern shown last visit, so Random never repeats it (D-033). */
const LAST_PATTERN_KEY = `${STORAGE_PREFIX}lastPattern`;

/** Pick any pattern except `last`. `random` returns [0, 1), like Math.random. */
export function pickPattern(
  last: string | null,
  random: () => number = Math.random,
): PatternName {
  const choices = PATTERN_NAMES.filter((name) => name !== last);
  return choices[Math.floor(random() * choices.length)] ?? 'grey';
}

let picked: PatternName | null = null;

/** This visit's random pattern: chosen once per page load and remembered as the last one
 *  shown. Blocked storage still works; repeats just become possible. */
export function visitPattern(): PatternName {
  if (picked) return picked;
  let last: string | null = null;
  try {
    last = window.localStorage.getItem(LAST_PATTERN_KEY);
  } catch {
    /* blocked storage: any pattern will do */
  }
  picked = pickPattern(last);
  try {
    window.localStorage.setItem(LAST_PATTERN_KEY, picked);
  } catch {
    /* ignore */
  }
  return picked;
}

/** The pattern on the desktop now: the visitor's choice, or this visit's random one. */
export function useDesktopPattern(): PatternName {
  const pattern = useSettings((s) => s.pattern);
  return pattern === 'random' ? visitPattern() : pattern;
}
