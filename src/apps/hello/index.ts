import { defineApp } from '../types';

// Throwaway app proving the framework (step 5). Removed once real apps exist.
export default defineApp({
  id: 'hello',
  name: 'Hello',
  icon: 'computer',
  instances: 'multiple',
  inMarkMenu: true,
  window: { size: { w: 420, h: 300 } },
  load: () => import('./HelloApp'),
});
