// Pixel art as text. Every icon and pattern in MDOS is drawn as rows of characters,
// so artwork is easy to read, review in a diff and edit by hand. One character per pixel:
//
//   1-bit:   '#' black   'o' white   '+' grey   ' ' transparent
//   Colour (D-031, System 7 on the Color Classic):
//            'g' light grey (platinum)   's' silver   'D' dark grey
//            'L' lavender   'l' light lavender   'B' blue   'b' light blue
//            'Y' yellow   'y' cream   'O' orange   'R' red   'G' green
//            'T' tan   'P' pink
//
// All rows of one drawing must have the same length.

export const PALETTE = {
  '#': '#000000',
  o: '#ffffff',
  '+': '#888888',
  g: '#dddddd',
  s: '#bbbbbb',
  D: '#555555',
  L: '#9999ff',
  l: '#ccccff',
  B: '#3366cc',
  b: '#99ccff',
  Y: '#ffcc00',
  y: '#ffffcc',
  O: '#ff8800',
  R: '#dd2222',
  G: '#33aa33',
  T: '#ddcc99',
  P: '#ff99cc',
} as const;

export type PaletteChar = keyof typeof PALETTE;
/** A pixel's colour, as a hex string from the palette (or a pattern's own colours). */
export type PixelColor = string;

export const BLACK = PALETTE['#'];
export const WHITE = PALETTE.o;

export interface PixelRun {
  x: number;
  y: number;
  width: number;
  color: PixelColor;
  /** The character it was drawn with (patterns remap characters to their own colours). */
  char: string;
}

export interface PixelArt {
  width: number;
  height: number;
  runs: PixelRun[];
}

/** Parse rows into horizontal runs of one colour (far fewer SVG rects than one per pixel). */
export function parsePixels(rows: readonly string[]): PixelArt {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const runs: PixelRun[] = [];

  rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(
        `Pixel row ${y} is ${row.length} wide, expected ${width}: "${row}"`,
      );
    }
    let x = 0;
    while (x < width) {
      const char = row.charAt(x);
      const color = PALETTE[char as PaletteChar] as string | undefined;
      if (color === undefined && char !== ' ') {
        throw new Error(`Unknown pixel character "${char}" at ${x},${y}`);
      }
      let end = x + 1;
      while (end < width && row.charAt(end) === char) end++;
      if (color) runs.push({ x, y, width: end - x, color, char });
      x = end;
    }
  });

  return { width, height, runs };
}

/** Swap black and white: how 1-bit System 7 shows a selected icon. Other colours stay. */
export function invert(color: PixelColor): PixelColor {
  if (color === BLACK) return WHITE;
  if (color === WHITE) return BLACK;
  return color;
}

/** Darken a colour: how colour System 7 shows a selected icon. Black stays black. */
export function darken(color: PixelColor, amount = 0.5): PixelColor {
  const value = Number.parseInt(color.slice(1), 16);
  const channel = (shift: number) =>
    Math.round(((value >> shift) & 0xff) * (1 - amount))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

/** WCAG relative-luminance contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string) => {
    const value = Number.parseInt(hex.slice(1), 16);
    const [r, g, bl] = [16, 8, 0].map((shift) => {
      const c = ((value >> shift) & 0xff) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

/** A tiling image as an SVG data URI, for CSS `background-image`. `remap` swaps a
 *  character's colour (e.g. a pattern's own foreground and background). Literal colours,
 *  because CSS variables don't resolve inside data URIs. */
export function patternDataUri(
  rows: readonly string[],
  remap: Partial<Record<string, string>> = {},
): string {
  const art = parsePixels(rows);
  const rects = art.runs
    .map(
      (r) =>
        `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="1" fill="${remap[r.char] ?? r.color}"/>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${art.width}" height="${art.height}" shape-rendering="crispEdges">${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
