import { useEffect, useState } from 'react';
import { announce } from '../../os/announce';
import { IconView, type IconLayout } from '../../os/IconView';
import { openNode } from '../../os/open';
import { findNode, pathTo, type VNode } from '../../vfs';
import type { AppProps } from '../types';
import type { FilesPayload } from './index';
import styles from './FilesApp.module.css';

interface History {
  stack: string[];
  index: number;
}

/** Browse folders. Double-clicking a folder navigates in this window; files open their app. */
export default function FilesApp({
  payload,
  setTitle,
}: AppProps<FilesPayload>) {
  const [history, setHistory] = useState<History>({
    stack: [payload?.folderId ?? 'desktop'],
    index: 0,
  });
  const [view, setView] = useState<IconLayout>('grid');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const folderId = history.stack[history.index] ?? 'desktop';
  const folder = findNode(folderId);
  const children = folder?.kind === 'folder' ? folder.children : [];

  useEffect(() => {
    if (folder) setTitle(folder.name);
  }, [folder, setTitle]);

  const go = (id: string) => {
    if (id === folderId) return;
    setHistory(({ stack, index }) => ({
      stack: [...stack.slice(0, index + 1), id],
      index: index + 1,
    }));
    setSelectedId(null);
    announce(`${findNode(id)?.name ?? 'Folder'} folder`);
  };

  const step = (delta: -1 | 1) => {
    const index = history.index + delta;
    const target = history.stack[index];
    if (!target) return;
    setHistory({ ...history, index });
    setSelectedId(null);
    announce(`${findNode(target)?.name ?? 'Folder'} folder`);
  };

  const open = (node: VNode) => {
    if (node.kind === 'folder') go(node.id);
    else openNode(node);
  };

  if (!folder || folder.kind !== 'folder') {
    return (
      <p className={styles.empty} role="alert">
        This folder no longer exists.
      </p>
    );
  }

  const count = children.length;

  return (
    <div className={styles.files}>
      <div className={styles.toolbar}>
        <div className={styles.group}>
          <button
            type="button"
            className={styles.tool}
            onClick={() => step(-1)}
            disabled={history.index === 0}
            aria-label="Back"
          >
            ◀
          </button>
          <button
            type="button"
            className={styles.tool}
            onClick={() => step(1)}
            disabled={history.index >= history.stack.length - 1}
            aria-label="Forward"
          >
            ▶
          </button>
        </div>
        <nav aria-label="Folder path" className={styles.path}>
          <ol>
            {pathTo(folderId).map((node, i, all) => (
              <li key={node.id}>
                {i === all.length - 1 ? (
                  <span aria-current="location">{node.name}</span>
                ) : (
                  <button
                    type="button"
                    className={styles.crumb}
                    onClick={() => go(node.id)}
                  >
                    {node.name}
                  </button>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className={styles.group} role="group" aria-label="View">
          <button
            type="button"
            className={styles.tool}
            aria-pressed={view === 'grid'}
            onClick={() => setView('grid')}
          >
            Icons
          </button>
          <button
            type="button"
            className={styles.tool}
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            List
          </button>
        </div>
      </div>
      <p className={styles.status}>
        {count === 1 ? '1 item' : `${count} items`}
      </p>
      {count === 0 ? (
        <p className={styles.empty}>This folder is empty.</p>
      ) : (
        <IconView
          label={folder.name}
          layout={view}
          nodes={children}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onOpen={open}
        />
      )}
    </div>
  );
}
