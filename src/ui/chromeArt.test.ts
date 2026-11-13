import { describe, expect, it } from 'vitest';
import { CHROME_ART, CHROME_ART_COLOR_ENTRIES } from './chromeArt';
import { parsePixels } from './pixels';

describe('chrome art', () => {
  it.each(Object.entries(CHROME_ART))('%s parses', (_name, rows) => {
    expect(() => parsePixels(rows)).not.toThrow();
  });

  it('rotates the scroll arrow correctly', () => {
    const tipRow = (rows: readonly string[]) =>
      rows.findIndex((row) => row.includes('#'));
    const tipCol = (rows: readonly string[]) =>
      Math.min(...rows.map((r) => r.indexOf('#')).filter((i) => i >= 0));
    const lastCol = (rows: readonly string[]) =>
      Math.max(...rows.map((r) => r.lastIndexOf('#')));

    expect(tipRow(CHROME_ART.arrowUp)).toBe(2); // tip near the top
    expect(tipRow([...CHROME_ART.arrowDown].reverse())).toBe(2); // tip near the bottom
    expect(tipCol(CHROME_ART.arrowLeft)).toBe(2); // tip near the left
    expect(lastCol(CHROME_ART.arrowRight)).toBe(13); // tip near the right
  });

  it('uses square, centre-sliceable button frames', () => {
    for (const name of [
      'button',
      'buttonPressed',
      'defaultRing',
      'defaultRingPressed',
    ] as const) {
      const art = parsePixels(CHROME_ART[name]);
      expect(art.width).toBe(art.height);
      expect(art.width % 2).toBe(1);
    }
  });
});

describe('colour chrome art', () => {
  it.each(CHROME_ART_COLOR_ENTRIES)(
    '%s parses and matches its 1-bit size',
    (name, rows) => {
      const colour = parsePixels(rows ?? []);
      const bw = parsePixels(CHROME_ART[name as keyof typeof CHROME_ART]);
      expect([colour.width, colour.height]).toEqual([bw.width, bw.height]);
    },
  );
});
