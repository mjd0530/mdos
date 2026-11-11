import { defineApp } from '../types';

export interface ViewerPayload {
  src: string;
  alt: string;
  title?: string;
}

export default defineApp<ViewerPayload>({
  id: 'viewer',
  name: 'Viewer',
  icon: 'image',
  // One window per picture: opening the same picture again brings it forward.
  instances: 'per-document',
  documentKey: (payload) => payload.src,
  title: (payload) => payload?.title || 'Picture',
  window: { size: { w: 640, h: 460 }, minSize: { w: 240, h: 180 } },
  load: () => import('./ViewerApp'),
});
