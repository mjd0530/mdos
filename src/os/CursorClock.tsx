import { useEffect, useRef, useState } from 'react';
import styles from './CursorClock.module.css';
import { useSettings } from './settings';

/**
 * A tiny clock that trails the mouse pointer. Decorative: hidden from screen readers,
 * never intercepts clicks, and only appears for a real mouse (not touch or keyboard).
 */
export function CursorClock() {
  const enabled = useSettings((s) => s.cursorClock);
  const clock24h = useSettings((s) => s.clock24h);
  const ref = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    const onMove = (event: PointerEvent) => {
      if (!el) return;
      if (event.pointerType !== 'mouse') {
        el.style.visibility = 'hidden';
        return;
      }
      // Keep it on screen near the right and bottom edges.
      const x = Math.min(
        event.clientX + 14,
        window.innerWidth - el.offsetWidth - 2,
      );
      const y = Math.min(
        event.clientY + 18,
        window.innerHeight - el.offsetHeight - 2,
      );
      el.style.transform = `translate(${x}px, ${y}px)`;
      el.style.visibility = 'visible';
    };
    const hide = () => {
      if (el) el.style.visibility = 'hidden';
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('keydown', hide);
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', hide);
      window.removeEventListener('keydown', hide);
      window.clearInterval(timer);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div
      ref={ref}
      className={styles.clock}
      aria-hidden="true"
      data-testid="cursor-clock"
    >
      {new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: !clock24h,
      }).format(now)}
    </div>
  );
}
