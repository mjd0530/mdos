import { useMemo } from 'react';
import { invert, parsePixels, PIXEL_FILL } from './pixels';
import type { IconName } from '../assets/icons/icons';
import { ICONS } from '../assets/icons/icons';

interface PixelIconProps {
  name: IconName;
  /** Whole-number scale so pixels stay square and crisp. 1 = 32px. */
  scale?: 1 | 2 | 3;
  /** Selected icons are drawn inverted, as in System 7. */
  selected?: boolean;
  className?: string;
}

/** Decorative by default: the label next to an icon is what screen readers announce. */
export function PixelIcon({
  name,
  scale = 1,
  selected = false,
  className,
}: PixelIconProps) {
  const art = useMemo(() => parsePixels(ICONS[name]), [name]);

  return (
    <svg
      className={className}
      width={art.width * scale}
      height={art.height * scale}
      viewBox={`0 0 ${art.width} ${art.height}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {art.runs.map((run) => (
        <rect
          key={`${run.x},${run.y}`}
          x={run.x}
          y={run.y}
          width={run.width}
          height={1}
          fill={PIXEL_FILL[selected ? invert(run.color) : run.color]}
        />
      ))}
    </svg>
  );
}
