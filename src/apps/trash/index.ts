import { defineApp } from '../types';

// The Trash (D-036): what visitors have thrown away from the desktop. Nothing is ever
// deleted; Put Away (or dragging an icon out) brings it back.
export default defineApp({
  id: 'trash',
  name: 'Trash',
  icon: 'trash',
  instances: 'single',
  window: { size: { w: 360, h: 240 }, minSize: { w: 240, h: 160 } },
  load: () => import('./TrashApp'),
});
