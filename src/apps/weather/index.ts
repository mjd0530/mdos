import { defineApp } from '../types';

export default defineApp({
  id: 'weather',
  name: 'Weather',
  icon: 'weather',
  instances: 'single',
  inMarkMenu: true,
  window: { size: { w: 360, h: 440 }, minSize: { w: 260, h: 260 } },
  load: () => import('./WeatherApp'),
});
