import { defineApp } from '../types';

/** Window size for each look (D-034). */
export const SKIN_SIZES = {
  deck: { w: 400, h: 480 },
  pocket: { w: 240, h: 420 },
} as const;

export default defineApp({
  id: 'player',
  // TODO(mike): the player's name.
  name: 'Music',
  icon: 'player',
  instances: 'single',
  inMarkMenu: true,
  // Free-standing (D-035): each look draws its own device, with no window frame.
  window: { size: SKIN_SIZES.deck, frame: 'none' },
  load: () => import('./PlayerApp'),
});
