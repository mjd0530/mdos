import { defineApp } from '../types';

export interface ViewerItem {
  src: string;
  alt: string;
  title?: string;
  date?: string;
  description?: string;
}

export interface ViewerPayload {
  /** Everything Previous / Next can step through (a gallery, or a document's pictures). */
  items: ViewerItem[];
  index: number;
  /** One Viewer window per set: "gallery:<folder>" or "doc:<docId>". */
  set: string;
}

export default defineApp<ViewerPayload>({
  id: 'viewer',
  name: 'Viewer',
  icon: 'image',
  // One window per set of pictures: opening another picture from the same set switches
  // that window to it.
  instances: 'per-document',
  documentKey: (payload) => payload.set,
  title: (payload) => payload?.items[payload.index]?.title || 'Picture',
  window: { size: { w: 640, h: 460 }, minSize: { w: 240, h: 180 } },
  load: () => import('./ViewerApp'),
});
