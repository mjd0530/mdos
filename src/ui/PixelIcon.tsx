import { useMemo } from 'react';
import type { IconName } from '../assets/icons/icons';
import { ICONS, ICONS_COLOR } from '../assets/icons/icons';
import { useDisplay } from '../os/display';
import { darken, invert, parsePixels } from './pixels';

interface PixelIconProps {
  name: IconName;
  /** Whole-number scale so pixels stay square and crisp. 1 = 32px. */
  scale?: 1 | 2 | 3;
  /** Selected icons are inverted in 1-bit and darkened in colour, as in System 7. */
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
  const color = useDisplay() === 'color';
  const art = useMemo(
    () => parsePixels(color ? ICONS_COLOR[name] : ICONS[name]),
    [name, color],
  );
  const select = color ? darken : invert;

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
          fill={selected ? select(run.color) : run.color}
        />
      ))}
    </svg>
  );
}
