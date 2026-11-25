import { useCallback, useMemo, useState } from 'react';
import { ContextMenu, type ContextMenuItem } from '../ui/ContextMenu';
import { desktop, type VNode } from '../vfs';
import {
  clampPosition,
  defaultPosition,
  trashPosition,
  TRASH_ID,
  useDesktop,
  type Point,
} from './desktopStore';
import { IconView } from './IconView';
import { openNode } from './open';
import { emptyTrash, moveToTrash, TRASH, TRASH_FULL } from './trash';
import { useDeviceMode } from './device';
import styles from './DesktopIcons.module.css';
import { useWindows } from './windows/store';

/** Where each content item sits in content/fs.yaml, so icons keep their slots. */
const ORDER = new Map(desktop.children.map((node, index) => [node.id, index]));

/** The icons on the desktop, from content/fs.yaml, plus the Trash. */
export function DesktopIcons() {
  const bounds = useWindows((s) => s.bounds);
  const phone = useDeviceMode() === 'phone';
  const { positions, selectedId, select, place, cleanUp, trashed } =
    useDesktop();
  const [menu, setMenu] = useState<{ node: VNode | null; at: Point } | null>(
    null,
  );
  const closeMenu = useCallback(() => setMenu(null), []);

  const nodes = useMemo(
    () => [
      ...desktop.children.filter((node) => !trashed.includes(node.id)),
      trashed.length > 0 ? TRASH_FULL : TRASH,
    ],
    [trashed],
  );

  const positionOf = (node: VNode) => {
    const saved = positions[node.id];
    if (saved) return clampPosition(saved, bounds);
    return node.id === TRASH_ID
      ? trashPosition(bounds)
      : defaultPosition(ORDER.get(node.id) ?? 0, bounds);
  };

  const menuItems = (node: VNode | null): ContextMenuItem[] => {
    if (!node) {
      return [{ id: 'clean-up', label: 'Clean Up Desktop', onSelect: cleanUp }];
    }
    const open = { id: 'open', label: 'Open', onSelect: () => openNode(node) };
    if (node.id === TRASH_ID) {
      return [
        open,
        { id: 'empty', label: 'Empty Trash…', onSelect: emptyTrash },
      ];
    }
    return [
      open,
      {
        id: 'trash',
        label: 'Move to Trash',
        onSelect: () => moveToTrash(node),
      },
    ];
  };

  return (
    <>
      <IconView
        label="Desktop"
        // Phones get a launcher grid (single tap); larger screens a free System 7 desktop.
        layout={phone ? 'grid' : 'free'}
        openOn={phone ? 'single' : 'double'}
        className={phone ? styles.launcher : undefined}
        nodes={nodes}
        positionOf={phone ? undefined : positionOf}
        onMove={phone ? undefined : place}
        dropTargetId={TRASH_ID}
        onDropOnTarget={(id, origin) => {
          const node = desktop.children.find((n) => n.id === id);
          if (!node) return;
          // Put Away brings it back to where the drag started.
          place(id, origin);
          moveToTrash(node);
        }}
        onDelete={moveToTrash}
        selectedId={selectedId}
        onSelect={select}
        onOpen={openNode}
        onContextMenu={(node, at) => setMenu({ node, at })}
      />
      {menu && (
        <ContextMenu
          x={menu.at.x}
          y={menu.at.y}
          label={menu.node ? menu.node.name : 'Desktop'}
          onClose={closeMenu}
          items={menuItems(menu.node)}
        />
      )}
    </>
  );
}
