// Play-order rules for the music player, kept free of audio and React so they're easy
// to test. A queue is the tracks of one album; `order` is the play order (album order, or
// shuffled) as indices into it, and `pos` is where we are in `order`.

export type Repeat = 'off' | 'all' | 'one';

export interface QueueState {
  order: number[];
  pos: number;
}

/** Play order for `length` tracks. Shuffled orders start with `first` so it keeps playing. */
export function makeOrder(
  length: number,
  shuffle: boolean,
  first = 0,
  random: () => number = Math.random,
): number[] {
  const order = Array.from({ length }, (_, i) => i);
  if (!shuffle) return order;
  const rest = order.filter((i) => i !== first);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j] as number, rest[i] as number];
  }
  return length === 0 ? [] : [first, ...rest];
}

/** Where to go after the current track. `null` means stop (end of the album). */
export function nextPos(
  { order, pos }: QueueState,
  repeat: Repeat,
  /** True when the track ended by itself (Repeat One only repeats then). */
  auto: boolean,
): number | null {
  if (order.length === 0) return null;
  if (auto && repeat === 'one') return pos;
  if (pos + 1 < order.length) return pos + 1;
  return repeat === 'off' ? null : 0;
}

/** Previous: restart the song if more than 3 seconds in, as real players do. */
export function prevPos(
  { order, pos }: QueueState,
  repeat: Repeat,
  currentTime: number,
): number {
  if (currentTime > 3 || order.length === 0) return pos;
  if (pos > 0) return pos - 1;
  return repeat === 'all' ? order.length - 1 : 0;
}

/** "3:07" from seconds. */
export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
