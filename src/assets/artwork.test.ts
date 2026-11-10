import { describe, expect, it } from 'vitest';
import { parsePixels } from '../ui/pixels';
import { ICONS } from './icons/icons';
import { PATTERNS } from './patterns';

describe('icons', () => {
  it.each(Object.entries(ICONS))('%s is 32x32 and parses', (_name, rows) => {
    const art = parsePixels(rows);
    expect(art.width).toBe(32);
    expect(art.height).toBe(32);
    expect(art.runs.length).toBeGreaterThan(0);
  });
});

describe('patterns', () => {
  it.each(Object.entries(PATTERNS))('%s is 8x8 and parses', (_key, pattern) => {
    const art = parsePixels(pattern.rows);
    expect(art.width).toBe(8);
    expect(art.height).toBe(8);
  });
});
