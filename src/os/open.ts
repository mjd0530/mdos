import { launch } from '../apps/launch';
import type { VNode } from '../vfs';
import { announce } from './announce';

/** The one way anything on the desktop or in Files gets opened. */
export function openNode(node: VNode) {
  switch (node.kind) {
    case 'folder':
      launch('files', { folderId: node.id });
      break;
    case 'doc':
      launch('notes', { docId: node.docId, title: node.name });
      break;
    case 'app':
      launch(node.appId);
      break;
    case 'link':
      window.open(node.href, '_blank', 'noopener,noreferrer');
      announce(`${node.name} opened in a new tab`);
      break;
  }
}
