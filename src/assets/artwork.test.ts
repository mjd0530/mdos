import { describe, expect, it } from 'vitest';
import { parsePixels } from '../ui/pixels';
import { ICONS, ICONS_COLOR } from './icons/icons';
import { PATTERNS } from './patterns';

describe('icons', () => {
  it.each(Object.entries(ICONS))('%s is 32x32 and parses', (_name, rows) => {
    const art = parsePixels(rows);
    expect(art.width).toBe(32);
    expect(art.height).toBe(32);
    expect(art.runs.length).toBeGreaterThan(0);
  });
});

describe('colour icons', () => {
  it.each(Object.keys(ICONS))('%s has a 32x32 colour version', (name) => {
    const art = parsePixels(ICONS_COLOR[name as keyof typeof ICONS]);
    expect([art.width, art.height]).toEqual([32, 32]);
  });
});

describe('patterns', () => {
  it.each(Object.entries(PATTERNS))('%s is 8x8 and parses', (_key, pattern) => {
    for (const rows of [
      pattern.rows,
      'colorRows' in pattern ? pattern.colorRows : pattern.rows,
    ]) {
      const art = parsePixels(rows);
      expect(art.width).toBe(8);
      expect(art.height).toBe(8);
    }
  });
});
