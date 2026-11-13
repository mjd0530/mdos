import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  darken,
  invert,
  PALETTE,
  parsePixels,
  patternDataUri,
} from './pixels';

describe('parsePixels', () => {
  it('merges same-colour pixels into runs and skips transparent ones', () => {
    const art = parsePixels(['##o ', ' +##']);
    expect(art.width).toBe(4);
    expect(art.height).toBe(2);
    expect(art.runs).toEqual([
      { x: 0, y: 0, width: 2, color: '#000000', char: '#' },
      { x: 2, y: 0, width: 1, color: '#ffffff', char: 'o' },
      { x: 1, y: 1, width: 1, color: '#888888', char: '+' },
      { x: 2, y: 1, width: 2, color: '#000000', char: '#' },
    ]);
  });

  it('knows every colour in the palette', () => {
    const row = Object.keys(PALETTE).join('');
    const art = parsePixels([row]);
    expect(art.runs.map((r) => r.color)).toEqual(Object.values(PALETTE));
  });

  it('rejects rows of different widths', () => {
    expect(() => parsePixels(['##', '###'])).toThrow(/row 1/);
  });

  it('rejects unknown characters', () => {
    expect(() => parsePixels(['#x'])).toThrow(/Unknown pixel character "x"/);
  });
});

describe('selected icons', () => {
  it('invert swaps black and white and leaves other colours alone', () => {
    expect(invert(PALETTE['#'])).toBe(PALETTE.o);
    expect(invert(PALETTE.o)).toBe(PALETTE['#']);
    expect(invert(PALETTE.L)).toBe(PALETTE.L);
  });

  it('darken halves each channel and keeps black black', () => {
    expect(darken('#ccccff')).toBe('#666680');
    expect(darken('#000000')).toBe('#000000');
  });
});

describe('contrastRatio', () => {
  it('matches the WCAG extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
  });
});

describe('patternDataUri', () => {
  it('produces a CSS url() with an SVG of the right size', () => {
    const uri = patternDataUri(['#o', 'o#']);
    expect(uri.startsWith('url("data:image/svg+xml,')).toBe(true);
    const svg = decodeURIComponent(uri.slice(24, -2));
    expect(svg).toContain('width="2" height="2"');
    expect(svg).toContain('fill="#000000"');
  });

  it('remaps characters to a pattern’s own colours', () => {
    const svg = decodeURIComponent(
      patternDataUri(['#o'], { '#': '#123456', o: '#abcdef' }).slice(24, -2),
    );
    expect(svg).toContain('fill="#123456"');
    expect(svg).toContain('fill="#abcdef"');
  });
});
