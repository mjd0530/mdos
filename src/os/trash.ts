import { create } from 'zustand';
import type { AppNode, VNode } from '../vfs';
import { announce } from './announce';
import { TRASH_ID, useDesktop } from './desktopStore';
import { playSound } from './sounds';

// The Trash (D-036): a desktop icon, not a content item. Opening it launches the trash app.
export const TRASH: AppNode = {
  id: TRASH_ID,
  kind: 'app',
  appId: 'trash',
  name: 'Trash',
};
export const TRASH_FULL: AppNode = { ...TRASH, icon: 'trashFull' };

/** Move a desktop item to the Trash, with the sound and an announcement. */
export function moveToTrash(node: VNode) {
  if (node.id === TRASH_ID) return;
  useDesktop.getState().trash(node.id);
  playSound('trash');
  announce(`${node.name} moved to Trash`);
}

/** Empty Trash never empties: it opens an error alert (shown by the shell, OS.tsx). */
export const useEmptyTrashAlert = create<{ open: boolean }>(() => ({
  open: false,
}));

export function emptyTrash() {
  useEmptyTrashAlert.setState({ open: true });
}

/** Take something out of the Trash, back to its old spot or to `at` on the desktop. */
export function putAway(node: VNode, at?: { x: number; y: number }) {
  useDesktop.getState().putAway(node.id, at);
  useDesktop.getState().select(node.id);
  playSound('putAway');
  announce(`${node.name} put back on the desktop`);
}
