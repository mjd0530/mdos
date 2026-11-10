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
export function installChromeArt(root: HTMLElement = document.documentElement) {
  for (const [name, rows] of Object.entries(CHROME_ART)) {
    root.style.setProperty(`--art-${toKebab(name)}`, patternDataUri(rows));
  }
}
