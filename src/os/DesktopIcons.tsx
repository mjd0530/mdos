import { useCallback, useState } from 'react';
import { ContextMenu } from '../ui/ContextMenu';
import { desktop, type VNode } from '../vfs';
import { defaultPosition, useDesktop, type Point } from './desktopStore';
import { IconView } from './IconView';
import { openNode } from './open';
import { useWindows } from './windows/store';

/** The icons on the desktop, from content/fs.yaml. */
export function DesktopIcons() {
  const bounds = useWindows((s) => s.bounds);
  const { positions, selectedId, select, place, cleanUp } = useDesktop();
  const [menu, setMenu] = useState<{ node: VNode | null; at: Point } | null>(
    null,
  );
  const closeMenu = useCallback(() => setMenu(null), []);

  const positionOf = (node: VNode, index: number) =>
    positions[node.id] ?? defaultPosition(index, bounds);

  return (
    <>
      <IconView
        label="Desktop"
        layout="free"
        nodes={desktop.children}
        positionOf={positionOf}
        onMove={place}
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
          items={
            menu.node
              ? [
                  {
                    id: 'open',
                    label: 'Open',
                    onSelect: () => openNode(menu.node as VNode),
                  },
                ]
              : [
                  {
                    id: 'clean-up',
                    label: 'Clean Up Desktop',
                    onSelect: cleanUp,
                  },
                ]
          }
        />
      )}
    </>
  );
}
