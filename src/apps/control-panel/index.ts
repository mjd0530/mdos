import { defineApp } from '../types';

export default defineApp({
  id: 'control-panel',
  name: 'Control Panel',
  icon: 'controlPanel',
  instances: 'single',
  inMarkMenu: true,
  window: { size: { w: 380, h: 360 }, minSize: { w: 280, h: 220 } },
  load: () => import('./ControlPanelApp'),
});
