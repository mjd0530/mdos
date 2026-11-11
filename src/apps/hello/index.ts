import { defineApp } from '../types';

// Test fixture, not shown to visitors: e2e tests open it (via ?e2e) to exercise windows
// and to prove a crashing app stays inside its window.
export default defineApp({
  id: 'hello',
  name: 'Hello',
  icon: 'computer',
  instances: 'multiple',
  window: { size: { w: 420, h: 300 } },
  load: () => import('./HelloApp'),
});
