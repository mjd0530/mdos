// Small 1-bit transport symbols, drawn as text rows like every MDOS icon and filled with
// the text colour, so they follow both displays and inverted highlights.

const GLYPHS = {
  play: [
    '#      ',
    '###    ',
    '#####  ',
    '#######',
    '#####  ',
    '###    ',
    '#      ',
  ],
  pause: ['## ## ', '## ## ', '## ## ', '## ## ', '## ## ', '## ## ', '## ## '],
  prev: ['#    #', '#   ##', '#  ###', '# ####', '#  ###', '#   ##', '#    #'],
  next: ['#    #', '##   #', '###  #', '#### #', '###  #', '##   #', '#    #'],
  shuffle: [
    '     # ',
    '##  ###',
    '  ## # ',
    '   #   ',
    '  ## # ',
    '##  ###',
    '     # ',
  ],
  repeat: [
    '  #    ',
    ' ##### ',
    '  #  # ',
    '#    # ',
    '#  #   ',
    ' ##### ',
    '    #  ',
  ],
  menu: ['#######', '       ', '#######', '       ', '#######'],
  close: [
    '#     #',
    ' #   # ',
    '  # #  ',
    '   #   ',
    '  # #  ',
    ' #   # ',
    '#     #',
  ],
  pocket: [
    ' ##### ',
    ' #   # ',
    ' #   # ',
    ' ##### ',
    ' # # # ',
    ' #   # ',
    ' ##### ',
  ],
  deck: [
    '#######',
    '#     #',
    '#######',
    '#     #',
    '# # # #',
    '#     #',
    '#######',
  ],
} as const;

export type GlyphName = keyof typeof GLYPHS;

export function Glyph({ name, scale = 2 }: { name: GlyphName; scale?: 1 | 2 }) {
  const rows = GLYPHS[name];
  const width = rows[0]?.length ?? 0;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={width * scale}
      height={rows.length * scale}
      viewBox={`0 0 ${width} ${rows.length}`}
      shapeRendering="crispEdges"
      fill="currentColor"
    >
      {rows.flatMap((row, y) =>
        [...row].map((char, x) =>
          char === '#' ? (
            <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} />
          ) : null,
        ),
      )}
    </svg>
  );
}
