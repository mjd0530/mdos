// Desktop patterns: original 8x8 1-bit tiles in the System 7 tradition. Same character key
// as icons (src/ui/pixels.ts). Visitors pick one in Control Panel (step 12).

export interface DesktopPattern {
  name: string;
  rows: readonly string[];
}

export const PATTERNS = {
  grey: {
    name: 'Grey',
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
} as const satisfies Record<string, DesktopPattern>;

export type PatternName = keyof typeof PATTERNS;
