import { describe, expect, it } from 'vitest';
import { formatTime, makeOrder, nextPos, prevPos } from './queue';

describe('makeOrder', () => {
  it('keeps album order unless shuffled', () => {
    expect(makeOrder(4, false)).toEqual([0, 1, 2, 3]);
  });

  it('shuffles every track exactly once, starting with the current one', () => {
    let seed = 0.37;
    const random = () => (seed = (seed * 9301 + 0.49297) % 1);
    const order = makeOrder(10, true, 6, random);
    expect(order[0]).toBe(6);
    expect([...order].sort((a, b) => a - b)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it('handles an empty album', () => {
    expect(makeOrder(0, true)).toEqual([]);
  });
});

describe('nextPos', () => {
  const q = { order: [0, 1, 2], pos: 1 };
  it('moves forward', () => expect(nextPos(q, 'off', false)).toBe(2));
  it('stops at the end without repeat', () =>
    expect(nextPos({ ...q, pos: 2 }, 'off', true)).toBeNull());
  it('wraps with Repeat All', () =>
    expect(nextPos({ ...q, pos: 2 }, 'all', true)).toBe(0));
  it('repeats the song with Repeat One when it ends', () =>
    expect(nextPos(q, 'one', true)).toBe(1));
  it('still skips with Repeat One when Next is pressed', () =>
    expect(nextPos(q, 'one', false)).toBe(2));
});

describe('prevPos', () => {
  const q = { order: [0, 1, 2], pos: 1 };
  it('restarts the song after 3 seconds', () =>
    expect(prevPos(q, 'off', 3.5)).toBe(1));
  it('goes back near the start of a song', () =>
    expect(prevPos(q, 'off', 1)).toBe(0));
  it('stays on the first song without repeat', () =>
    expect(prevPos({ ...q, pos: 0 }, 'off', 0)).toBe(0));
  it('wraps to the last song with Repeat All', () =>
    expect(prevPos({ ...q, pos: 0 }, 'all', 0)).toBe(2));
});

describe('formatTime', () => {
  it.each([
    [0, '0:00'],
    [7.9, '0:07'],
    [187, '3:07'],
    [Number.NaN, '0:00'],
  ])('%s → %s', (seconds, text) => expect(formatTime(seconds)).toBe(text));
});
