// System 7 chrome drawn as pixel text (key in ./pixels.ts). installChromeArt() turns each
// drawing into a CSS custom property (--art-<name>) used by ui/ and os/ styles, so borders,
// boxes and arrows stay pixel-exact instead of relying on anti-aliased CSS curves.
import { patternDataUri } from './pixels';

const UP = [
  '                ',
  '                ',
  '       ##       ',
  '      #oo#      ',
  '     #oooo#     ',
  '    #oooooo#    ',
  '   #oooooooo#   ',
  '  #oooooooooo#  ',
  '  ####oooo####  ',
  '     #oooo#     ',
  '     #oooo#     ',
  '     #oooo#     ',
  '     ######     ',
  '                ',
  '                ',
  '                ',
] as const;

// Arrows: one drawing, rotated.
const flipV = (rows: readonly string[]) => [...rows].reverse();
const transpose = (rows: readonly string[]) =>
  [...(rows[0] ?? '')].map((_, x) => rows.map((row) => row.charAt(x)).join(''));

export const CHROME_ART = {
  // Push button frame: 9x9, used as a 4px border-image slice.
  button: [
    '  #####  ',
    ' #ooooo# ',
    '#ooooooo#',
    '#ooooooo#',
    '#ooooooo#',
    '#ooooooo#',
    '#ooooooo#',
    ' #ooooo# ',
    '  #####  ',
  ],
  // Pressed button: inverted.
  buttonPressed: [
    '  #####  ',
    ' ####### ',
    '#########',
    '#########',
    '#########',
    '#########',
    '#########',
    ' ####### ',
    '  #####  ',
  ],
  // Default button ring: 3px ring, 1px gap, 1px button edge; 8px slice.
  defaultRing: [
    '    #########    ',
    '  #############  ',
    ' ############### ',
    ' ####ooooooo#### ',
    '####oo#####oo####',
    '###oo#ooooo#oo###',
    '###o#ooooooo#o###',
    '###o#ooooooo#o###',
    '###o#ooooooo#o###',
    '###o#ooooooo#o###',
    '###o#ooooooo#o###',
    '###oo#ooooo#oo###',
    '####oo#####oo####',
    ' ####ooooooo#### ',
    ' ############### ',
    '  #############  ',
    '    #########    ',
  ],
  // Default button, pressed: inside inverted.
  defaultRingPressed: [
    '    #########    ',
    '  #############  ',
    ' ############### ',
    ' ####ooooooo#### ',
    '####oo#####oo####',
    '###oo#######oo###',
    '###o#########o###',
    '###o#########o###',
    '###o#########o###',
    '###o#########o###',
    '###o#########o###',
    '###oo#######oo###',
    '####oo#####oo####',
    ' ####ooooooo#### ',
    ' ############### ',
    '  #############  ',
    '    #########    ',
  ],
  // Checkbox, empty.
  checkbox: [
    '############',
    '#oooooooooo#',
    '#oooooooooo#',
    '#oooooooooo#',
    '#oooooooooo#',
    '#oooooooooo#',
    '#oooooooooo#',
    '#oooooooooo#',
    '#oooooooooo#',
    '#oooooooooo#',
    '#oooooooooo#',
    '############',
  ],
  // Checkbox, checked: System 7 uses an X.
  checkboxOn: [
    '############',
    '##oooooooo##',
    '#o#oooooo#o#',
    '#oo#oooo#oo#',
    '#ooo#oo#ooo#',
    '#oooo##oooo#',
    '#oooo##oooo#',
    '#ooo#oo#ooo#',
    '#oo#oooo#oo#',
    '#o#oooooo#o#',
    '##oooooooo##',
    '############',
  ],
  // Radio button, empty.
  radio: [
    '    ####    ',
    '  ##oooo##  ',
    ' #oooooooo# ',
    ' #oooooooo# ',
    '#oooooooooo#',
    '#oooooooooo#',
    '#oooooooooo#',
    '#oooooooooo#',
    ' #oooooooo# ',
    ' #oooooooo# ',
    '  ##oooo##  ',
    '    ####    ',
  ],
  // Radio button, selected.
  radioOn: [
    '    ####    ',
    '  ##oooo##  ',
    ' #oooooooo# ',
    ' #oo####oo# ',
    '#oo######oo#',
    '#oo######oo#',
    '#oo######oo#',
    '#oo######oo#',
    ' #oo####oo# ',
    ' #oooooooo# ',
    '  ##oooo##  ',
    '    ####    ',
  ],
  // Title bar close box (left).
  closeBox: [
    '###########',
    '#ooooooooo#',
    '#ooooooooo#',
    '#ooooooooo#',
    '#ooooooooo#',
    '#ooooooooo#',
    '#ooooooooo#',
    '#ooooooooo#',
    '#ooooooooo#',
    '#ooooooooo#',
    '###########',
  ],
  // Title bar zoom box (right).
  zoomBox: [
    '###########',
    '#oooooo#oo#',
    '#oooooo#oo#',
    '#oooooo#oo#',
    '#oooooo#oo#',
    '#oooooo#oo#',
    '#oooooo#oo#',
    '########oo#',
    '#ooooooooo#',
    '#ooooooooo#',
    '###########',
  ],
  // Title bar collapse box (right, "window shade").
  collapseBox: [
    '###########',
    '#ooooooooo#',
    '#ooooooooo#',
    '#ooooooooo#',
    '###########',
    '#ooooooooo#',
    '###########',
    '#ooooooooo#',
    '#ooooooooo#',
    '#ooooooooo#',
    '###########',
  ],
  // Resize box, bottom-right corner of a window.
  growBox: [
    'oooooooooooooooo',
    'o#########oooooo',
    'o#ooooooo#oooooo',
    'o#ooooooo#oooooo',
    'o#ooo#######oooo',
    'o#ooo#ooooo#oooo',
    'o#ooo#ooooo#oooo',
    'o#ooo#ooooo#oooo',
    'o#####ooooo#oooo',
    'ooooo#ooooo#oooo',
    'ooooo#######oooo',
    'oooooooooooooooo',
    'oooooooooooooooo',
    'oooooooooooooooo',
    'oooooooooooooooo',
    'oooooooooooooooo',
  ],
  // Scroll bar track: 50% grey, drawn with pixels so it stays a true checkerboard.
  scrollTrack: ['#o', 'o#'],
  // Menu-bar mark: an 'M' tile (placeholder until Mike designs his own).
  mark: [
    '                ',
    '  ############  ',
    ' #oooooooooooo# ',
    ' #o##oooooo##o# ',
    ' #o###oooo###o# ',
    ' #o##o#oo#o##o# ',
    ' #o##oo##oo##o# ',
    ' #o##oooooo##o# ',
    ' #o##oooooo##o# ',
    ' #o##oooooo##o# ',
    ' #o##oooooo##o# ',
    ' #o##oooooo##o# ',
    ' #oooooooooooo# ',
    '  ############  ',
    '                ',
    '                ',
  ],
  // Command key glyph for menu shortcuts (Pixel Operator has no ⌘).
  command: [
    ' ##   ## ',
    '#  # #  #',
    '#  # #  #',
    ' ####### ',
    '   # #   ',
    ' ####### ',
    '#  # #  #',
    '#  # #  #',
    ' ##   ## ',
  ],
  arrowUp: UP,
  arrowDown: flipV(UP),
  arrowLeft: transpose(UP),
  arrowRight: transpose(UP).map((row) => [...row].reverse().join('')),
} satisfies Record<string, readonly string[]>;

export type ChromeArtName = keyof typeof CHROME_ART;

const toKebab = (name: string) =>
  name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Expose every drawing as `--art-<kebab-name>` on :root. Call once at boot. */
// ---------- Colour variants (D-031) ----------

/** A System 7 colour box: black frame, light top-left bevel, dark bottom-right, grey face. */
function bevelBox(size: number): string[] {
  const inner = size - 2;
  return Array.from({ length: size }, (_, y) => {
    if (y === 0 || y === size - 1) return '#'.repeat(size);
    if (y === 1) return `#${'o'.repeat(inner - 1)}+#`;
    if (y === size - 2) return `#o${'+'.repeat(inner - 1)}#`;
    return `#o${'g'.repeat(inner - 2)}+#`;
  });
}

/** Paint black pixels onto a drawing. */
function draw(rows: string[], pixels: [number, number][]): string[] {
  const grid = rows.map((row) => [...row]);
  for (const [x, y] of pixels) {
    const line = grid[y];
    if (line && x < line.length) line[x] = '#';
  }
  return grid.map((line) => line.join(''));
}

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const CHROME_ART_COLOR: Partial<Record<ChromeArtName, readonly string[]>> = {
  closeBox: bevelBox(11),
  // A small box in the top-left corner, like the 1-bit zoom box.
  zoomBox: draw(bevelBox(11), [
    ...range(1, 6).map((y): [number, number] => [6, y]),
    ...range(1, 6).map((x): [number, number] => [x, 6]),
  ]),
  // Two lines across: the window-shade box.
  collapseBox: draw(bevelBox(11), [
    ...range(1, 9).map((x): [number, number] => [x, 4]),
    ...range(1, 9).map((x): [number, number] => [x, 6]),
  ]),
  growBox: CHROME_ART.growBox.map((row) => row.replace(/o/g, 'g')),
  scrollTrack: ['gs', 'sg'],
  mark: CHROME_ART.mark.map((row) => row.replace(/o/g, 'l')),
};

/** Expose every drawing as `--art-<kebab-name>` on :root, in the colour or 1-bit set.
 *  Call at boot and whenever the display mode changes. */
export function installChromeArt(
  display: 'color' | 'bw' = 'bw',
  root: HTMLElement = document.documentElement,
) {
  for (const [name, rows] of Object.entries(CHROME_ART)) {
    const art =
      display === 'color'
        ? (CHROME_ART_COLOR[name as ChromeArtName] ?? rows)
        : rows;
    root.style.setProperty(`--art-${toKebab(name)}`, patternDataUri(art));
  }
}

/** Every colour variant, for tests and the specimen. */
export const CHROME_ART_COLOR_ENTRIES = Object.entries(CHROME_ART_COLOR);
