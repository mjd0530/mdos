import { beforeEach, describe, expect, it } from 'vitest';
import { desktop } from '../vfs';
import {
  defaultPosition,
  sanitizeTrashed,
  TRASH_ID,
  trashPosition,
  useDesktop,
} from './desktopStore';

const bounds = { w: 1024, h: 700 };
const [first, second] = desktop.children;

beforeEach(() => {
  useDesktop.setState({ positions: {}, trashed: [], selectedId: null });
});

describe('the Trash', () => {
  it('takes an item once and clears its selection', () => {
    useDesktop.getState().select(first!.id);
    useDesktop.getState().trash(first!.id);
    useDesktop.getState().trash(first!.id);
    expect(useDesktop.getState().trashed).toEqual([first!.id]);
    expect(useDesktop.getState().selectedId).toBeNull();
  });

  it('never takes the Trash itself', () => {
    useDesktop.getState().trash(TRASH_ID);
    expect(useDesktop.getState().trashed).toEqual([]);
  });

  it('puts an item away to its old spot, or to where it was dropped', () => {
    const { trash, putAway, place } = useDesktop.getState();
    place(first!.id, { x: 40, y: 50 });
    trash(first!.id);
    trash(second!.id);
    putAway(first!.id);
    expect(useDesktop.getState().positions[first!.id]).toEqual({
      x: 40,
      y: 50,
    });
    putAway(second!.id, { x: 300, y: 200 });
    expect(useDesktop.getState().positions[second!.id]).toEqual({
      x: 300,
      y: 200,
    });
    expect(useDesktop.getState().trashed).toEqual([]);
  });

  it('restores everything on Reset, and Clean Up leaves it alone', () => {
    useDesktop.getState().trash(first!.id);
    useDesktop.getState().cleanUp();
    expect(useDesktop.getState().trashed).toEqual([first!.id]);
    useDesktop.getState().restoreAll();
    expect(useDesktop.getState().trashed).toEqual([]);
  });
});

describe('sanitizeTrashed', () => {
  const valid = new Set(['a', 'b']);
  it('keeps known ids once, in order', () => {
    expect(sanitizeTrashed(['b', 'a', 'b'], valid)).toEqual(['b', 'a']);
  });
  it('drops unknown ids and junk', () => {
    expect(sanitizeTrashed(['a', 'zzz', 3, null], valid)).toEqual(['a']);
    expect(sanitizeTrashed('a', valid)).toEqual([]);
    expect(sanitizeTrashed(undefined, valid)).toEqual([]);
  });
});

describe('desktop arrangement', () => {
  it('keeps the bottom of the first column for the Trash', () => {
    const trash = trashPosition(bounds);
    const slots = Array.from({ length: 20 }, (_, i) =>
      defaultPosition(i, bounds),
    );
    expect(slots).not.toContainEqual(trash);
    expect(trash.x).toBe(defaultPosition(0, bounds).x);
    expect(trash.y).toBeGreaterThan(defaultPosition(0, bounds).y);
  });
});
