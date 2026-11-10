import { describe, expect, it } from 'vitest';
import { invert, parsePixels, patternDataUri } from './pixels';

describe('parsePixels', () => {
  it('merges same-colour pixels into runs and skips transparent ones', () => {
    const art = parsePixels(['##o ', ' +##']);
    expect(art.width).toBe(4);
    expect(art.height).toBe(2);
    expect(art.runs).toEqual([
      { x: 0, y: 0, width: 2, color: 'black' },
      { x: 2, y: 0, width: 1, color: 'white' },
      { x: 1, y: 1, width: 1, color: 'grey' },
      { x: 2, y: 1, width: 2, color: 'black' },
    ]);
  });

  it('rejects rows of different widths', () => {
    expect(() => parsePixels(['##', '###'])).toThrow(/row 1/);
  });

  it('rejects unknown characters', () => {
    expect(() => parsePixels(['#x'])).toThrow(/Unknown pixel character "x"/);
  });
});

describe('invert', () => {
  it('swaps black and white and leaves grey alone', () => {
    expect(invert('black')).toBe('white');
    expect(invert('white')).toBe('black');
    expect(invert('grey')).toBe('grey');
  });
});

describe('patternDataUri', () => {
  it('produces a CSS url() with an SVG of the right size', () => {
    const uri = patternDataUri(['#o', 'o#']);
    expect(uri.startsWith('url("data:image/svg+xml,')).toBe(true);
    const svg = decodeURIComponent(uri.slice(24, -2));
    expect(svg).toContain('width="2" height="2"');
    expect(svg).toContain('fill="#000"');
  });
});
