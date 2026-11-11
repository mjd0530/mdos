import { launch } from '../apps/launch';
import { parentFolder, type ImageNode, type VNode } from '../vfs';
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
    case 'image': {
      // Viewer steps through every picture in the same folder.
      const folder = parentFolder(node.id);
      const images = (folder?.children ?? [node]).filter(
        (child): child is ImageNode => child.kind === 'image',
      );
      launch('viewer', {
        set: `gallery:${folder?.id ?? node.id}`,
        index: Math.max(0, images.indexOf(node)),
        items: images.map((image) => ({
          src: image.src,
          alt: image.alt,
          title: image.name,
          date: image.date,
          description: image.description,
        })),
      });
      break;
    }
    case 'link':
      window.open(node.href, '_blank', 'noopener,noreferrer');
      announce(`${node.name} opened in a new tab`);
      break;
  }
}
