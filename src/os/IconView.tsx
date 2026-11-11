import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { useEffect, useRef } from 'react';
import { PixelIcon } from '../ui/PixelIcon';
import type { VNode } from '../vfs';
import { iconFor } from './iconFor';
import type { Point } from './desktopStore';
import styles from './IconView.module.css';

export type IconLayout = 'free' | 'grid' | 'list';

interface IconViewProps {
  /** Accessible name of the list, e.g. "Desktop" or "Portfolio". */
  label: string;
  nodes: VNode[];
  layout: IconLayout;
  /** Free layout only: where each icon sits. */
  positionOf?: (node: VNode, index: number) => Point;
  /** Free layout only: an icon was dragged to a new spot. */
  onMove?: (id: string, point: Point) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpen: (node: VNode) => void;
  /** Right-click or Shift+F10. `node` is null for the empty background. */
  onContextMenu?: (node: VNode | null, at: Point) => void;
  className?: string;
}

const DRAG_THRESHOLD = 4;

const KIND_LABEL: Record<VNode['kind'], string> = {
  folder: 'Folder',
  doc: 'Document',
  app: 'Application',
  link: 'Web link',
  image: 'Picture',
};

/**
 * Icons as a single-select listbox. Click selects, double-click / Enter opens, arrows move
 * to the nearest icon in that direction, Shift+F10 opens the context menu. In the free
 * layout (the desktop) icons can be dragged.
 */
export function IconView({
  label,
  nodes,
  layout,
  positionOf,
  onMove,
  selectedId,
  onSelect,
  onOpen,
  onContextMenu,
  className,
}: IconViewProps) {
  const optionRefs = useRef(new Map<string, HTMLDivElement>());
  const drag = useRef<{
    id: string;
    startX: number;
    startY: number;
    origin: Point;
    moving: boolean;
  } | null>(null);

  // Keep the roving tab stop on the selected icon, or the first one.
  const tabStopId =
    selectedId && nodes.some((n) => n.id === selectedId)
      ? selectedId
      : nodes[0]?.id;

  // Keyboard selection moves focus with it.
  useEffect(() => {
    if (!selectedId) return;
    const el = optionRefs.current.get(selectedId);
    if (el && el.parentElement?.contains(document.activeElement)) el.focus();
  }, [selectedId]);

  const nearest = (fromId: string, key: string): string | undefined => {
    const from = optionRefs.current.get(fromId)?.getBoundingClientRect();
    if (!from) return undefined;
    const cx = from.left + from.width / 2;
    const cy = from.top + from.height / 2;
    let best: { id: string; score: number } | undefined;
    for (const node of nodes) {
      if (node.id === fromId) continue;
      const r = optionRefs.current.get(node.id)?.getBoundingClientRect();
      if (!r) continue;
      const dx = r.left + r.width / 2 - cx;
      const dy = r.top + r.height / 2 - cy;
      const [along, across] =
        key === 'ArrowRight'
          ? [dx, dy]
          : key === 'ArrowLeft'
            ? [-dx, dy]
            : key === 'ArrowDown'
              ? [dy, dx]
              : [-dy, dx];
      if (along <= 1) continue;
      const score = along + Math.abs(across) * 2;
      if (!best || score < best.score) best = { id: node.id, score };
    }
    return best?.id;
  };

  const onKeyDown = (event: KeyboardEvent, node: VNode) => {
    const { key } = event;
    if (key === 'Enter') {
      onOpen(node);
    } else if (key.startsWith('Arrow')) {
      const next = nearest(node.id, key);
      if (next) onSelect(next);
    } else if (key === 'Home' && nodes[0]) {
      onSelect(nodes[0].id);
    } else if (key === 'End' && nodes.at(-1)) {
      onSelect(nodes.at(-1)!.id);
    } else if (key === 'Escape') {
      onSelect(null);
    } else if ((key === 'F10' && event.shiftKey) || key === 'ContextMenu') {
      const r = event.currentTarget.getBoundingClientRect();
      onContextMenu?.(node, { x: r.left + r.width / 2, y: r.bottom });
    } else {
      return;
    }
    event.preventDefault();
  };

  const onPointerDown = (event: PointerEvent, node: VNode, index: number) => {
    if (event.button !== 0) return;
    onSelect(node.id);
    if (layout === 'free' && positionOf && onMove) {
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = {
        id: node.id,
        startX: event.clientX,
        startY: event.clientY,
        origin: positionOf(node, index),
        moving: false,
      };
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    const d = drag.current;
    if (!d || !onMove) return;
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;
    if (!d.moving && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.moving = true;
    onMove(d.id, {
      x: Math.max(0, d.origin.x + dx),
      y: Math.max(0, d.origin.y + dy),
    });
  };

  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div
      role="listbox"
      aria-label={label}
      aria-orientation={layout === 'list' ? 'vertical' : undefined}
      className={`${styles.view} ${styles[layout]} ${className ?? ''}`}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onSelect(null);
      }}
      onContextMenu={(event) => {
        if (!onContextMenu) return;
        event.preventDefault();
        const option = (event.target as Element).closest('[role="option"]');
        const node = nodes.find(
          (n) => n.id === option?.getAttribute('data-id'),
        );
        if (node) onSelect(node.id);
        onContextMenu(node ?? null, { x: event.clientX, y: event.clientY });
      }}
    >
      {nodes.map((node, index) => {
        const selected = node.id === selectedId;
        const position: CSSProperties | undefined =
          layout === 'free' && positionOf
            ? {
                left: positionOf(node, index).x,
                top: positionOf(node, index).y,
              }
            : undefined;
        return (
          <div
            key={node.id}
            ref={(el) => {
              if (el) optionRefs.current.set(node.id, el);
              else optionRefs.current.delete(node.id);
            }}
            role="option"
            aria-selected={selected}
            aria-description={KIND_LABEL[node.kind]}
            data-id={node.id}
            tabIndex={node.id === tabStopId ? 0 : -1}
            className={styles.item}
            style={position}
            onPointerDown={(event) => onPointerDown(event, node, index)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onDoubleClick={() => onOpen(node)}
            onKeyDown={(event) => onKeyDown(event, node)}
            onFocus={() => {
              if (!selected) onSelect(node.id);
            }}
          >
            {node.kind === 'image' ? (
              // Drawings show themselves; the label carries the name.
              <img
                src={node.thumb}
                alt=""
                className={`${styles.icon} ${styles.thumb}`}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            ) : (
              <PixelIcon
                name={iconFor(node)}
                selected={selected}
                className={styles.icon}
              />
            )}
            <span className={styles.label}>{node.name}</span>
            {layout === 'list' && (
              <span className={styles.kind}>{KIND_LABEL[node.kind]}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
