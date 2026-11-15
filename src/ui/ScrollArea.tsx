import type { PointerEvent, ReactNode, RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ScrollArea.module.css';

interface ScrollAreaProps {
  children: ReactNode;
  /** Inactive windows show empty white scroll bars, as in System 7. */
  active?: boolean;
  /** Goes in the square where the two bars meet (a window's resize box). */
  corner?: ReactNode;
  className?: string;
}

interface Metrics {
  top: number;
  left: number;
  maxTop: number;
  maxLeft: number;
}

const LINE = 20; // one line of 16px text at 1.25 line height
const THUMB = 16;
const REPEAT_DELAY = 300;
const REPEAT_EVERY = 50;

/**
 * A scrolling region with System 7 scroll bars: arrow buttons at both ends, a grey track
 * and a fixed square thumb. The bars are pointer-only decoration (aria-hidden); keyboard
 * and screen-reader users scroll the focusable viewport natively.
 */
export function ScrollArea({
  children,
  active = true,
  corner,
  className,
}: ScrollAreaProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    top: 0,
    left: 0,
    maxTop: 0,
    maxLeft: 0,
  });

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const next: Metrics = {
      top: el.scrollTop,
      left: el.scrollLeft,
      maxTop: Math.max(0, el.scrollHeight - el.clientHeight),
      maxLeft: Math.max(0, el.scrollWidth - el.clientWidth),
    };
    setMetrics((prev) =>
      prev.top === next.top &&
      prev.left === next.left &&
      prev.maxTop === next.maxTop &&
      prev.maxLeft === next.maxLeft
        ? prev
        : next,
    );
  }, []);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (viewportRef.current) observer.observe(viewportRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div className={[styles.area, className].filter(Boolean).join(' ')}>
      <div
        ref={viewportRef}
        className={styles.viewport}
        tabIndex={0}
        onScroll={measure}
      >
        <div ref={contentRef} className={styles.content}>
          {children}
        </div>
      </div>
      <ScrollBar
        axis="vertical"
        viewportRef={viewportRef}
        position={metrics.top}
        max={metrics.maxTop}
        active={active}
      />
      <ScrollBar
        axis="horizontal"
        viewportRef={viewportRef}
        position={metrics.left}
        max={metrics.maxLeft}
        active={active}
      />
      <div className={styles.corner}>{corner}</div>
    </div>
  );
}

interface ScrollBarProps {
  axis: 'vertical' | 'horizontal';
  viewportRef: RefObject<HTMLDivElement | null>;
  position: number;
  max: number;
  active: boolean;
}

function ScrollBar({
  axis,
  viewportRef,
  position,
  max,
  active,
}: ScrollBarProps) {
  const vertical = axis === 'vertical';
  const enabled = active && max > 0;
  const trackRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const dragging = useRef(false);

  const scrollBy = (amount: number) => {
    viewportRef.current?.scrollBy(
      vertical ? { top: amount } : { left: amount },
    );
  };

  const stopRepeat = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  };

  /** Run now, then keep running while the pointer is held. */
  const startRepeat = (action: () => void) => {
    stopRepeat();
    action();
    const tick = () => {
      action();
      timer.current = window.setTimeout(tick, REPEAT_EVERY);
    };
    timer.current = window.setTimeout(tick, REPEAT_DELAY);
  };

  useEffect(() => stopRepeat, []);

  const along = (event: PointerEvent) =>
    vertical ? event.clientY : event.clientX;

  const pageSize = () => {
    const el = viewportRef.current;
    if (!el) return 0;
    return Math.max(LINE, (vertical ? el.clientHeight : el.clientWidth) - LINE);
  };

  const scrollToPointer = (event: PointerEvent) => {
    const track = trackRef.current?.getBoundingClientRect();
    const el = viewportRef.current;
    if (!track || !el) return;
    const start = vertical ? track.top : track.left;
    const length = (vertical ? track.height : track.width) - THUMB;
    const fraction = Math.min(
      1,
      Math.max(0, (along(event) - start - THUMB / 2) / Math.max(1, length)),
    );
    if (vertical) el.scrollTop = fraction * max;
    else el.scrollLeft = fraction * max;
  };

  const arrow = (direction: -1 | 1) => ({
    onPointerDown: (event: PointerEvent) => {
      if (!enabled || event.button !== 0) return;
      event.preventDefault();
      startRepeat(() => scrollBy(direction * LINE));
    },
    onPointerUp: stopRepeat,
    onPointerLeave: stopRepeat,
    onPointerCancel: stopRepeat,
  });

  const fraction = max > 0 ? position / max : 0;
  const thumbOffset = `calc((100% - ${THUMB}px) * ${fraction})`;

  return (
    <div
      className={`${styles.bar} ${vertical ? styles.vertical : styles.horizontal} ${enabled ? styles.enabled : ''}`}
      aria-hidden="true"
    >
      <div
        className={`${styles.arrow} ${styles.arrowStart}`}
        data-testid={`scroll-${vertical ? 'up' : 'left'}`}
        {...arrow(-1)}
      />
      <div
        ref={trackRef}
        className={styles.track}
        onPointerDown={(event) => {
          if (!enabled || event.button !== 0) return;
          event.preventDefault();
          // Clicking the grey track pages towards the click.
          const thumb = event.currentTarget.firstElementChild;
          const edge = thumb?.getBoundingClientRect();
          if (!edge) return;
          const before = along(event) < (vertical ? edge.top : edge.left);
          startRepeat(() => scrollBy((before ? -1 : 1) * pageSize()));
        }}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        onPointerCancel={stopRepeat}
      >
        {enabled && (
          <div
            className={styles.thumb}
            data-testid={`scroll-thumb-${axis}`}
            style={vertical ? { top: thumbOffset } : { left: thumbOffset }}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.preventDefault();
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              dragging.current = true;
            }}
            onPointerMove={(event) => {
              if (dragging.current) scrollToPointer(event);
            }}
            onPointerUp={() => {
              dragging.current = false;
            }}
            onPointerCancel={() => {
              dragging.current = false;
            }}
          />
        )}
      </div>
      <div
        className={`${styles.arrow} ${styles.arrowEnd}`}
        data-testid={`scroll-${vertical ? 'down' : 'right'}`}
        {...arrow(1)}
      />
    </div>
  );
}
