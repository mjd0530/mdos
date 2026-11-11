import { useEffect, useState } from 'react';
import { loadDoc, type Doc } from '../../vfs';
import type { AppProps } from '../types';
import type { NotesPayload } from './index';
import styles from './NotesApp.module.css';

// Minimal reader (step 7). Step 9 adds the case-study layout, contents menu and image viewer.
export default function NotesApp({
  payload,
  setTitle,
}: AppProps<NotesPayload>) {
  const docId = payload?.docId;
  const [doc, setDoc] = useState<Doc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) return;
    let cancelled = false;
    loadDoc(docId).then(
      (loaded) => {
        if (cancelled) return;
        setDoc(loaded);
        setTitle(loaded.title);
      },
      (reason: unknown) => {
        if (!cancelled) setError(String(reason));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [docId, setTitle]);

  if (error) {
    return (
      <p className={styles.page} role="alert">
        This document couldn't be opened. {error}
      </p>
    );
  }
  if (!doc) {
    return (
      <p className={styles.page} role="status">
        Opening…
      </p>
    );
  }

  const study = doc.caseStudy;
  return (
    <article className={styles.page}>
      {study && (
        <header className={styles.study}>
          <p className={styles.summary}>{study.summary}</p>
          <dl className={styles.meta}>
            <dt>Role</dt>
            <dd>{study.role}</dd>
            <dt>Client</dt>
            <dd>{study.client}</dd>
            <dt>Years</dt>
            <dd>{study.years}</dd>
            <dt>Scope</dt>
            <dd>{study.scope.join(', ')}</dd>
          </dl>
        </header>
      )}
      {/* Mike's own Markdown, rendered at build time (D-019). */}
      <div
        className={styles.body}
        dangerouslySetInnerHTML={{ __html: doc.html }}
      />
    </article>
  );
}
