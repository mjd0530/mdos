import { useMemo } from 'react';
import type {
  IconName,
  ImageIconName,
  PixelIconName,
} from '../assets/icons/icons';
import { ICONS, ICONS_COLOR } from '../assets/icons/icons';
import mdLogo from '../assets/icons/md-logo.png';
import { useDisplay } from '../os/display';
import styles from './PixelIcon.module.css';
import { darken, invert, parsePixels } from './pixels';

/** Picture icons (see IMAGE_ICON_NAMES): the same in both looks. */
const IMAGE_ICONS: Record<ImageIconName, string> = { mdLogo };

const isImageIcon = (name: IconName): name is ImageIconName =>
  name in IMAGE_ICONS;

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
  if (isImageIcon(name)) {
    return (
      <img
        src={IMAGE_ICONS[name]}
        alt=""
        width={32 * scale}
        height={32 * scale}
        draggable={false}
        className={`${styles.image} ${className ?? ''}`}
        data-selected={selected || undefined}
      />
    );
  }
  return (
    <PixelArtIcon
      name={name}
      scale={scale}
      selected={selected}
      className={className}
    />
  );
}

function PixelArtIcon({
  name,
  scale,
  selected,
  className,
}: Required<Omit<PixelIconProps, 'className' | 'name'>> & {
  name: PixelIconName;
  className?: string;
}) {
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
