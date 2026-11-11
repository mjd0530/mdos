import { docLoaders, tree } from 'virtual:vfs';
import type { Doc, FolderNode, VNode } from './types';

export type { Doc, FolderNode, VNode } from './types';
export { DEFAULT_ICONS } from './types';

/** The desktop folder: the root of everything in content/fs.yaml. */
export const desktop: FolderNode = tree;

const byId = new Map<string, VNode>();
const parentOf = new Map<string, string>();
(function index(folder: FolderNode) {
  byId.set(folder.id, folder);
  for (const child of folder.children) {
    byId.set(child.id, child);
    parentOf.set(child.id, folder.id);
    if (child.kind === 'folder') index(child);
  }
})(desktop);

export function findNode(id: string): VNode | undefined {
  return byId.get(id);
}

/** Folders from the desktop down to (and including) this node: for Files' path menu. */
export function pathTo(id: string): VNode[] {
  const path: VNode[] = [];
  let current: string | undefined = id;
  while (current) {
    const node = byId.get(current);
    if (!node) break;
    path.unshift(node);
    current = parentOf.get(current);
  }
  return path;
}

/** Load a document's content (a separate, cached chunk per document). */
export async function loadDoc(docId: string): Promise<Doc> {
  const loader = docLoaders[docId];
  if (!loader) throw new Error(`No document "${docId}"`);
  return (await loader()).default;
}
