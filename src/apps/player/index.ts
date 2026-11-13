import { defineApp } from '../types';

/** Window size for each look (D-034). */
export const SKIN_SIZES = {
  deck: { w: 440, h: 520 },
  pocket: { w: 280, h: 470 },
} as const;

export default defineApp({
  id: 'player',
  // TODO(mike): the player's name.
  name: 'Music',
  icon: 'player',
  instances: 'single',
  inMarkMenu: true,
  window: { size: SKIN_SIZES.deck, minSize: { w: 260, h: 320 }, fill: true },
  load: () => import('./PlayerApp'),
});
