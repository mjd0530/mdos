import { useState } from 'react';
import type { AppProps } from '../types';
import type { ViewerPayload } from './index';
import styles from './ViewerApp.module.css';

/** Shows one picture: fitted to the window, or at actual size (scroll to pan). */
export default function ViewerApp({ payload }: AppProps<ViewerPayload>) {
  const [actualSize, setActualSize] = useState(false);
  if (!payload) return null;

  return (
    <figure className={styles.viewer}>
      <div className={styles.toolbar}>
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
        src={payload.src}
        alt={payload.alt}
        className={actualSize ? styles.actual : styles.fit}
      />
      {payload.title && (
        <figcaption className={styles.caption}>{payload.title}</figcaption>
      )}
    </figure>
  );
}
