import { useCallback, useState } from 'react';
import { TRASH_ID, useDesktop, type Point } from '../../os/desktopStore';
import { useDeviceMode } from '../../os/device';
import { IconView, type IconLayout } from '../../os/IconView';
import { openNode } from '../../os/open';
import { emptyTrash, putAway } from '../../os/trash';
import { ContextMenu } from '../../ui/ContextMenu';
import { desktop, type VNode } from '../../vfs';
import bar from '../../ui/toolbar.module.css';
import styles from './TrashApp.module.css';

/** Viewport point → desktop icon position, centring the icon on the pointer. */
function desktopPoint(client: Point): Point | undefined {
  const target = document.elementFromPoint(client.x, client.y);
  // Dropped onto another window, or back onto the Trash itself: stay in the Trash.
  if (!target || target.closest('[role="dialog"]')) return undefined;
  if (target.closest(`[data-id="${TRASH_ID}"]`)) return undefined;
  const main = target.closest('main');
  if (!main) return undefined;
  const r = main.getBoundingClientRect();
  return {
    x: Math.max(0, client.x - r.left - 44),
    y: Math.max(0, client.y - r.top - 20),
  };
}

/** The Trash window: what's been thrown away, and the way back out. */
export default function TrashApp() {
  const trashed = useDesktop((s) => s.trashed);
  const phone = useDeviceMode() === 'phone';
  const [view, setView] = useState<IconLayout>('grid');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ node: VNode; at: Point } | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);

  const nodes = trashed
    .map((id) => desktop.children.find((node) => node.id === id))
    .filter((node): node is VNode => !!node);
  const count = nodes.length;

  return (
    <div className={styles.trash}>
      <div className={`${bar.toolbar} ${bar.spread}`}>
        <button
          type="button"
          className={bar.tool}
          disabled={count === 0}
          onClick={emptyTrash}
        >
          Empty
        </button>
        <div className={bar.group} role="group" aria-label="View">
          <button
            type="button"
            className={bar.tool}
            aria-pressed={view === 'grid'}
            onClick={() => setView('grid')}
          >
            Icons
          </button>
          <button
            type="button"
            className={bar.tool}
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
        <p className={styles.empty}>
          The Trash is empty. Drag something from the desktop here.
        </p>
      ) : (
        <IconView
          label="Trash"
          layout={view}
          openOn={phone ? 'single' : 'double'}
          nodes={nodes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onOpen={openNode}
          onContextMenu={(node, at) => {
            if (node) setMenu({ node, at });
          }}
          onDragOut={
            phone
              ? undefined
              : (id, client) => {
                  const node = nodes.find((n) => n.id === id);
                  const at = desktopPoint(client);
                  if (node && at) putAway(node, at);
                }
          }
        />
      )}
      {menu && (
        <ContextMenu
          x={menu.at.x}
          y={menu.at.y}
          label={menu.node.name}
          onClose={closeMenu}
          items={[
            {
              id: 'open',
              label: 'Open',
              onSelect: () => openNode(menu.node),
            },
            {
              id: 'put-away',
              label: 'Put Away',
              onSelect: () => putAway(menu.node),
            },
          ]}
        />
      )}
    </div>
  );
}
