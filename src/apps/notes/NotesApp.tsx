import type { MouseEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { announce } from '../../os/announce';
import { loadDoc, type Doc } from '../../vfs';
import { launch } from '../launch';
import type { AppProps } from '../types';
import type { NotesPayload } from './index';
import styles from './NotesApp.module.css';

/** Reads a document: case-study header, a Contents menu, and pictures that open in Viewer. */
export default function NotesApp({
  payload,
  setTitle,
}: AppProps<NotesPayload>) {
  const docId = payload?.docId;
  const [doc, setDoc] = useState<Doc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const contentsRef = useRef<HTMLDetailsElement>(null);
  const contentsId = useId();

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

  // Pictures are <button class="doc-image"> from the build; open the clicked one in Viewer.
  const onBodyClick = (event: MouseEvent) => {
    const button = (event.target as Element).closest('button.doc-image');
    const img = button?.querySelector('img');
    if (!button || !img) return;
    launch('viewer', {
      src: img.currentSrc || img.src,
      alt: img.alt,
      title: button.getAttribute('data-view-title') || img.alt,
    });
  };

  const jumpTo = (id: string, text: string) => {
    const heading = bodyRef.current?.querySelector<HTMLElement>(
      `#${CSS.escape(id)}`,
    );
    if (!heading) return;
    heading.tabIndex = -1;
    heading.scrollIntoView({ block: 'start' });
    heading.focus({ preventScroll: true });
    if (contentsRef.current) contentsRef.current.open = false;
    announce(text);
  };

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
  const sections = doc.headings.filter((h) => h.level === 3);

  return (
    <div className={styles.notes}>
      {sections.length > 1 && (
        <div className={styles.toolbar}>
          <details ref={contentsRef} className={styles.contents}>
            <summary className={styles.tool}>Contents</summary>
            <nav aria-labelledby={contentsId} className={styles.contentsMenu}>
              <span id={contentsId} className="visually-hidden">
                Contents of {doc.title}
              </span>
              <ol>
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        jumpTo(section.id, section.text);
                      }}
                    >
                      {section.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </details>
        </div>
      )}

      <article className={styles.page}>
        {study && (
          <header className={styles.study}>
            {study.subtitle && (
              <p className={styles.subtitle}>{study.subtitle}</p>
            )}
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
              {study.awards && (
                <>
                  <dt>Award</dt>
                  <dd>{study.awards}</dd>
                </>
              )}
            </dl>
          </header>
        )}
        {/* Mike's own Markdown, rendered at build time (D-019). */}
        <div
          ref={bodyRef}
          className={styles.body}
          onClick={onBodyClick}
          dangerouslySetInnerHTML={{ __html: doc.html }}
        />
      </article>
    </div>
  );
}
