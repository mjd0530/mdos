import { useLayoutEffect, useRef } from 'react';
import { AppHost } from '../../apps/AppHost';
import { useWindows } from './store';
import { Window } from './Window';
import styles from './WindowLayer.module.css';

/**
 * Fills the desktop and hosts every open window. Windows render in creation order (so
 * focus never jumps when stacking changes) and stack by z-index from the store's order.
 */
export function WindowLayer() {
  const ref = useRef<HTMLDivElement>(null);
  const windows = useWindows((s) => s.windows);
  const order = useWindows((s) => s.order);
  const setBounds = useWindows((s) => s.setBounds);
  const activeId = order.at(-1);

  // Measure synchronously on mount (ResizeObserver only reports on rendered frames, which a
  // background tab may never produce), then keep watching for changes.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setBounds({ w: Math.floor(width), h: Math.floor(height) });
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setBounds({
        w: Math.floor(entry.contentRect.width),
        h: Math.floor(entry.contentRect.height),
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [setBounds]);

  return (
    <div ref={ref} className={styles.layer}>
      {windows.map((win) => (
        <Window
          key={win.id}
          win={win}
          active={win.id === activeId}
          z={order.indexOf(win.id) + 1}
        >
          <AppHost win={win} isActive={win.id === activeId} />
        </Window>
      ))}
    </div>
  );
}
