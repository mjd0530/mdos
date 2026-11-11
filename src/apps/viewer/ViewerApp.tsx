import { useEffect, useState } from 'react';
import { announce } from '../../os/announce';
import type { AppProps } from '../types';
import type { ViewerPayload } from './index';
import styles from './ViewerApp.module.css';

/**
 * Shows pictures one at a time: fitted to the window or at actual size, with Previous /
 * Next (buttons, or ← → while the window is active) through the rest of the set.
 */
export default function ViewerApp({
  payload,
  isActive,
  setTitle,
}: AppProps<ViewerPayload>) {
  const items = payload?.items ?? [];
  const [index, setIndex] = useState(payload?.index ?? 0);
  const [actualSize, setActualSize] = useState(false);

  // Opening another picture from the same set hands this window a new payload: jump to its
  // index (adjusting state during render, as React recommends, instead of in an effect).
  const [seenPayload, setSeenPayload] = useState(payload);
  if (payload !== seenPayload) {
    setSeenPayload(payload);
    setIndex(payload?.index ?? 0);
  }

  const item = items[index];

  useEffect(() => {
    if (item) setTitle(item.title || 'Picture');
  }, [item, setTitle]);

  const go = (delta: -1 | 1) => {
    const next = index + delta;
    const target = items[next];
    if (!target) return;
    setIndex(next);
    announce(`${target.title || target.alt}, ${next + 1} of ${items.length}`);
  };

  // ← / → step through pictures while this window is active (not while the title has focus:
  // there the arrows move the window).
  useEffect(() => {
    if (!isActive || items.length < 2) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return;
      const target = event.target as HTMLElement;
      if (target.closest('h2, input, textarea, select, [role="listbox"]'))
        return;
      if (event.key === 'ArrowLeft') go(-1);
      else if (event.key === 'ArrowRight') go(1);
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!item) return null;
  const many = items.length > 1;

  return (
    <figure className={styles.viewer}>
      <div className={styles.toolbar}>
        {many && (
          <>
            <button
              type="button"
              className={styles.tool}
              onClick={() => go(-1)}
              disabled={index === 0}
            >
              ◀ Previous
            </button>
            <button
              type="button"
              className={styles.tool}
              onClick={() => go(1)}
              disabled={index === items.length - 1}
            >
              Next ▶
            </button>
            <span className={styles.count}>
              {index + 1} of {items.length}
            </span>
          </>
        )}
        <button
          type="button"
          className={styles.tool}
          aria-pressed={actualSize}
          onClick={() => setActualSize((v) => !v)}
        >
          Actual Size
        </button>
      </div>
      <img
        key={item.src}
        src={item.src}
        alt={item.alt}
        className={actualSize ? styles.actual : styles.fit}
      />
      {(item.title || item.date || item.description) && (
        <figcaption className={styles.caption}>
          {item.title && (
            <span className={styles.captionTitle}>{item.title}</span>
          )}
          {item.date && <span className={styles.date}>{item.date}</span>}
          {item.description && <span>{item.description}</span>}
        </figcaption>
      )}
    </figure>
  );
}
