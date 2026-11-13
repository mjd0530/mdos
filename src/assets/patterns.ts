import { patternDataUri } from '../ui/pixels';

// Desktop patterns: original 8x8 1-bit tiles in the System 7 tradition. Same character key
// as icons (src/ui/pixels.ts). Visitors pick one in Control Panel (step 12).

export interface DesktopPattern {
  name: string;
  /** The 1-bit drawing ('#' and 'o'), used in Black & White. */
  rows: readonly string[];
  /** Colour display: recolour the 1-bit drawing ('#' → fg, 'o' → bg)… */
  colors?: { fg: string; bg: string };
  /** …or a drawing of its own in palette colours (src/ui/pixels.ts). */
  colorRows?: readonly string[];
}

export const PATTERNS = {
  grey: {
    name: 'Grey',
    colors: { fg: '#6f6fb8', bg: '#9a9ad6' },
    rows: [
      '#o#o#o#o',
      'o#o#o#o#',
      '#o#o#o#o',
      'o#o#o#o#',
      '#o#o#o#o',
      'o#o#o#o#',
      '#o#o#o#o',
      'o#o#o#o#',
    ],
  },
  light: {
    name: 'Light',
    colors: { fg: '#55aa88', bg: '#ccf2e4' },
    rows: [
      '#ooo#ooo',
      'oooooooo',
      'oo#ooo#o',
      'oooooooo',
      '#ooo#ooo',
      'oooooooo',
      'oo#ooo#o',
      'oooooooo',
    ],
  },
  diagonal: {
    name: 'Diagonal',
    colors: { fg: '#cc6699', bg: '#ffd6ea' },
    rows: [
      '#ooo#ooo',
      'o#ooo#oo',
      'oo#ooo#o',
      'ooo#ooo#',
      '#ooo#ooo',
      'o#ooo#oo',
      'oo#ooo#o',
      'ooo#ooo#',
    ],
  },
  bricks: {
    name: 'Bricks',
    colors: { fg: '#9a4a2e', bg: '#d98a66' },
    rows: [
      '########',
      '#ooooooo',
      '#ooooooo',
      '#ooooooo',
      '########',
      'oooo#ooo',
      'oooo#ooo',
      'oooo#ooo',
    ],
  },
  weave: {
    name: 'Weave',
    colors: { fg: '#2e5d8f', bg: '#6f9fd1' },
    rows: [
      '###oooo#',
      '##oooo##',
      '#oooo###',
      'oooo####',
      'ooo#oooo',
      'oo###ooo',
      'o#####oo',
      '#######o',
    ],
  },
  pixels: {
    name: 'Pixels',
    colors: { fg: '#777777', bg: '#dddddd' },
    rows: [
      'oooooooo',
      'o##ooooo',
      'o##ooooo',
      'oooooooo',
      'oooooooo',
      'ooooo##o',
      'ooooo##o',
      'oooooooo',
    ],
  },
  // Colour-first patterns (D-031): their own palette drawing, plus a 1-bit stand-in.
  tweed: {
    name: 'Tweed',
    colorRows: [
      'BbBbbBbB',
      'bBbBBbBb',
      'BBbbBbbB',
      'bBBbbBBb',
      'BbBbbBbB',
      'bbBBbbBB',
      'BbbBBbbB',
      'bBbBBbBb',
    ],
    rows: [
      '#o#oo#o#',
      'o#o##o#o',
      '##oo#oo#',
      'o##oo##o',
      '#o#oo#o#',
      'oo##oo##',
      '#oo##oo#',
      'o#o##o#o',
    ],
  },
  stars: {
    name: 'Stars',
    colorRows: [
      'BBBBBBBB',
      'BBBBBYBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
      'BYBBBBBB',
      'BBBBBBBB',
      'BBBBBBBB',
    ],
    rows: [
      '########',
      '#####o##',
      '########',
      '########',
      '########',
      '#o######',
      '########',
      '########',
    ],
  },
  gingham: {
    name: 'Gingham',
    colorRows: [
      'PPPPoooo',
      'PPPPoooo',
      'PPPPoooo',
      'PPPPoooo',
      'RRRRPPPP',
      'RRRRPPPP',
      'RRRRPPPP',
      'RRRRPPPP',
    ],
    rows: [
      '#o#ooooo',
      'o#o#oooo',
      '#o#ooooo',
      'o#o#oooo',
      '####o#o#',
      '#####o#o',
      '####o#o#',
      '#####o#o',
    ],
  },
  sand: {
    name: 'Sand',
    colorRows: [
      'TyTTyTTT',
      'TTTyTTyT',
      'yTTTTyTT',
      'TTyTTTTy',
      'TyTTyTTT',
      'TTTTTyTT',
      'yTTyTTTy',
      'TTTTyTTT',
    ],
    rows: [
      'ooo#oooo',
      'oooooo#o',
      '#ooooooo',
      'ooooo#oo',
      'oo#ooooo',
      'oooooooo',
      'oooo#ooo',
      '#ooooooo',
    ],
  },
} as const satisfies Record<string, DesktopPattern>;

export type PatternName = keyof typeof PATTERNS;

/** The CSS background for a pattern in the current display mode. */
export function patternImage(
  name: PatternName,
  display: 'color' | 'bw',
): string {
  const pattern: DesktopPattern = PATTERNS[name];
  if (display === 'color') {
    if (pattern.colorRows) return patternDataUri(pattern.colorRows);
    if (pattern.colors) {
      return patternDataUri(pattern.rows, {
        '#': pattern.colors.fg,
        o: pattern.colors.bg,
      });
    }
  }
  return patternDataUri(pattern.rows);
}
