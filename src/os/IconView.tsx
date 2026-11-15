import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  /** Phones open on a single tap, like a home screen; elsewhere double-click opens. */
  openOn?: 'single' | 'double';
  /** Free layout only: an icon that others can be dropped onto (the Trash). */
  dropTargetId?: string;
  /** An icon was dropped onto `dropTargetId`; `origin` is where its drag started. */
  onDropOnTarget?: (id: string, origin: Point) => void;
  /** Delete or Backspace on a focused icon (Move to Trash). */
  onDelete?: (node: VNode) => void;
  /**
   * Grid and list layouts: icons can be dragged out of this view's window. Called with
   * the release point (viewport coordinates) when it lands outside the window.
   */
  onDragOut?: (id: string, at: Point) => void;
  className?: string;
}

const DRAG_THRESHOLD = 4;
const LONG_PRESS_MS = 550;

const KIND_LABEL: Record<VNode['kind'], string> = {
  folder: 'Folder',
  doc: 'Document',
  app: 'Application',
  link: 'Web link',
  image: 'Picture',
};

/** Marks a web link: opening it leaves MDOS for a new browser tab. */
function NewTabBadge() {
  return <span aria-hidden="true" className={styles.newTab} />;
}

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
  openOn = 'double',
  dropTargetId,
  onDropOnTarget,
  onDelete,
  onDragOut,
  className,
}: IconViewProps) {
  const viewRef = useRef<HTMLDivElement>(null);
  // While an icon hovers over the drop target, the target shows selected (inverted).
  const [overTarget, setOverTarget] = useState(false);
  // An icon being dragged out of a window follows the pointer as a ghost.
  const [ghost, setGhost] = useState<{
    node: VNode;
    x: number;
    y: number;
  } | null>(null);
  const optionRefs = useRef(new Map<string, HTMLDivElement>());
  // Touch has no right-click: holding a finger on an icon opens its context menu.
  const longPress = useRef<{ timer: number; x: number; y: number } | null>(
    null,
  );
  const longPressFiredAt = useRef(0);
  const cancelLongPress = () => {
    if (longPress.current) window.clearTimeout(longPress.current.timer);
    longPress.current = null;
  };

  const drag = useRef<{
    id: string;
    startX: number;
    startY: number;
    origin: Point;
    moving: boolean;
    /** Lifting out of a window (grid/list) rather than moving on the desktop. */
    out: boolean;
  } | null>(null);

  const isOverTarget = (id: string, x: number, y: number) => {
    if (!dropTargetId || id === dropTargetId) return false;
    const r = optionRefs.current.get(dropTargetId)?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

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
    } else if ((key === 'Delete' || key === 'Backspace') && onDelete) {
      onDelete(node);
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
    if (event.pointerType === 'touch' && onContextMenu) {
      cancelLongPress();
      const { clientX: x, clientY: y } = event;
      longPress.current = {
        x,
        y,
        timer: window.setTimeout(() => {
          longPress.current = null;
          longPressFiredAt.current = Date.now();
          drag.current = null;
          onContextMenu(node, { x, y });
        }, LONG_PRESS_MS),
      };
    }
    const free = layout === 'free' && positionOf && onMove;
    if (free || (layout !== 'free' && onDragOut)) {
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = {
        id: node.id,
        startX: event.clientX,
        startY: event.clientY,
        origin: free ? positionOf(node, index) : { x: 0, y: 0 },
        moving: false,
        out: !free,
      };
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    const press = longPress.current;
    if (
      press &&
      Math.hypot(event.clientX - press.x, event.clientY - press.y) >
        DRAG_THRESHOLD * 2
    ) {
      cancelLongPress();
    }
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;
    if (!d.moving && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.moving = true;
    if (d.out) {
      const node = nodes.find((n) => n.id === d.id);
      if (node) setGhost({ node, x: event.clientX, y: event.clientY });
      return;
    }
    onMove?.(d.id, {
      x: Math.max(0, d.origin.x + dx),
      y: Math.max(0, d.origin.y + dy),
    });
    const over = isOverTarget(d.id, event.clientX, event.clientY);
    if (over !== overTarget) setOverTarget(over);
  };

  const endDrag = (event: PointerEvent, cancelled = false) => {
    const d = drag.current;
    drag.current = null;
    cancelLongPress();
    setOverTarget(false);
    setGhost(null);
    if (!d?.moving || cancelled) return;
    const { clientX: x, clientY: y } = event;
    if (d.out) {
      const frame =
        viewRef.current?.closest('[role="dialog"]') ?? viewRef.current;
      const r = frame?.getBoundingClientRect();
      const inside =
        !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      if (!inside) onDragOut?.(d.id, { x, y });
    } else if (isOverTarget(d.id, x, y)) {
      onDropOnTarget?.(d.id, d.origin);
    }
  };

  useEffect(() => cancelLongPress, []);

  return (
    <>
      <div
        ref={viewRef}
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
          // Android also fires contextmenu on long-press; ours already handled it.
          if (Date.now() - longPressFiredAt.current < 1000) return;
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
          const highlighted =
            selected || (overTarget && node.id === dropTargetId);
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
              aria-description={
                node.kind === 'link'
                  ? 'Web link, opens in a new tab'
                  : KIND_LABEL[node.kind]
              }
              data-id={node.id}
              tabIndex={node.id === tabStopId ? 0 : -1}
              className={styles.item}
              style={position}
              onPointerDown={(event) => onPointerDown(event, node, index)}
              onPointerMove={onPointerMove}
              onPointerUp={(event) => endDrag(event)}
              onPointerCancel={(event) => endDrag(event, true)}
              onDoubleClick={() => {
                if (openOn === 'double') onOpen(node);
              }}
              onClick={() => {
                if (
                  openOn === 'single' &&
                  Date.now() - longPressFiredAt.current > 1000
                ) {
                  onOpen(node);
                }
              }}
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
                <span className={styles.glyph}>
                  <PixelIcon
                    name={iconFor(node)}
                    selected={highlighted}
                    className={styles.icon}
                  />
                  {node.kind === 'link' && <NewTabBadge />}
                </span>
              )}
              <span className={styles.label}>{node.name}</span>
              {layout === 'list' && (
                <span className={styles.kind}>{KIND_LABEL[node.kind]}</span>
              )}
            </div>
          );
        })}
      </div>
      {ghost &&
        createPortal(
          <div
            aria-hidden="true"
            className={styles.ghost}
            style={{ left: ghost.x - 44, top: ghost.y - 20 }}
          >
            {ghost.node.kind === 'image' ? (
              <img
                src={ghost.node.thumb}
                alt=""
                className={`${styles.icon} ${styles.thumb}`}
              />
            ) : (
              <span className={styles.glyph}>
                <PixelIcon name={iconFor(ghost.node)} className={styles.icon} />
                {ghost.node.kind === 'link' && <NewTabBadge />}
              </span>
            )}
            <span className={styles.label}>{ghost.node.name}</span>
          </div>,
          document.body,
        )}
    </>
  );
}
