// Pixel art as text. Every icon and pattern in Mike OS is drawn as rows of characters,
// so artwork is easy to read, review in a diff and edit by hand:
//   '#'  black
//   'o'  white
//   '+'  grey (System 7 shading; use sparingly)
//   ' '  transparent
// All rows of one drawing must have the same length.

export type PixelColor = 'black' | 'white' | 'grey';

const CHAR_TO_COLOR: Record<string, PixelColor | undefined> = {
  '#': 'black',
  o: 'white',
  '+': 'grey',
};

export interface PixelRun {
  x: number;
  y: number;
  width: number;
  color: PixelColor;
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
      const color = CHAR_TO_COLOR[char];
      if (color === undefined && char !== ' ') {
        throw new Error(`Unknown pixel character "${char}" at ${x},${y}`);
      }
      let end = x + 1;
      while (end < width && row.charAt(end) === char) end++;
      if (color) runs.push({ x, y, width: end - x, color });
      x = end;
    }
  });

  return { width, height, runs };
}

/** Swap black and white: how System 7 shows a selected icon. Grey and transparent stay. */
export function invert(color: PixelColor): PixelColor {
  if (color === 'black') return 'white';
  if (color === 'white') return 'black';
  return color;
}

export const PIXEL_FILL: Record<PixelColor, string> = {
  black: 'var(--color-black)',
  white: 'var(--color-white)',
  grey: 'var(--color-grey-3)',
};

/** A tiling pattern as an SVG data URI, for CSS `background-image`. Uses literal colours
 *  because CSS variables don't resolve inside data URIs. */
export function patternDataUri(
  rows: readonly string[],
  colors: Record<PixelColor, string> = {
    black: '#000',
    white: '#fff',
    grey: '#888',
  },
): string {
  const art = parsePixels(rows);
  const rects = art.runs
    .map(
      (r) =>
        `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="1" fill="${colors[r.color]}"/>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${art.width}" height="${art.height}" shape-rendering="crispEdges">${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
