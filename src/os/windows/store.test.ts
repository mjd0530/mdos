import { beforeEach, describe, expect, it } from 'vitest';
import { useAnnouncer } from '../announce';
import { selectActiveId, useWindows } from './store';

const store = () => useWindows.getState();
const open = (title: string) => store().open({ appId: 'test', title });
const get = (id: string) => {
  const win = store().windows.find((w) => w.id === id);
  if (!win) throw new Error(`no window ${id}`);
  return win;
};

beforeEach(() => {
  store().reset();
  store().setBounds({ w: 1000, h: 600 });
});

describe('open and close', () => {
  it('opens windows in a cascade and makes the newest active', () => {
    const a = open('A');
    const b = open('B');
    expect(store().windows.map((w) => w.id)).toEqual([a, b]);
    expect(selectActiveId(store())).toBe(b);
    expect(get(b).rect.x).toBeGreaterThan(get(a).rect.x);
  });

  it('closing the active window activates the one beneath it', () => {
    const a = open('A');
    const b = open('B');
    store().close(b);
    expect(store().windows).toHaveLength(1);
    expect(selectActiveId(store())).toBe(a);
  });

  it('announces opening and closing', () => {
    const a = open('Read Me');
    expect(useAnnouncer.getState().message).toBe('Read Me window opened');
    store().close(a);
    expect(useAnnouncer.getState().message).toBe('Read Me window closed');
  });

  it('never reuses ids', () => {
    const a = open('A');
    store().close(a);
    expect(open('B')).not.toBe(a);
  });
});

describe('stacking', () => {
  it('focus brings a window to the front without changing DOM order', () => {
    const a = open('A');
    const b = open('B');
    store().focus(a);
    expect(store().order).toEqual([b, a]);
    expect(store().windows.map((w) => w.id)).toEqual([a, b]);
  });

  it('cycle walks through every window in both directions', () => {
    const a = open('A');
    const b = open('B');
    const c = open('C');
    store().cycle();
    expect(selectActiveId(store())).toBe(a);
    store().cycle();
    expect(selectActiveId(store())).toBe(b);
    store().cycle();
    expect(selectActiveId(store())).toBe(c);
    store().cycle(-1);
    expect(selectActiveId(store())).toBe(b);
  });
});

describe('move and resize', () => {
  it('moves, but keeps the title bar on the desktop', () => {
    const a = open('A');
    store().move(a, 200, 150);
    expect(get(a).rect).toMatchObject({ x: 200, y: 150 });
    store().move(a, 0, -500);
    expect(get(a).rect.y).toBe(0);
  });

  it('resizes within the minimum size and the desktop', () => {
    const a = open('A');
    store().resize(a, 500, 400);
    expect(get(a).rect).toMatchObject({ w: 500, h: 400 });
    store().resize(a, 1, 1);
    expect(get(a).rect).toMatchObject({ w: 176, h: 112 });
  });
});

describe('zoom and collapse', () => {
  it('zoom fills the desktop and un-zoom restores the old rect', () => {
    const a = open('A');
    store().move(a, 120, 80);
    const before = get(a).rect;
    store().toggleZoom(a);
    expect(get(a).zoomed).toBe(true);
    expect(get(a).rect).toEqual({ x: 2, y: 2, w: 995, h: 595 });
    store().move(a, 300, 300); // ignored while zoomed
    expect(get(a).rect.x).toBe(2);
    store().toggleZoom(a);
    expect(get(a).zoomed).toBe(false);
    expect(get(a).rect).toEqual(before);
  });

  it('collapse toggles and blocks resizing; zooming expands again', () => {
    const a = open('A');
    store().toggleCollapse(a);
    expect(get(a).collapsed).toBe(true);
    const { w } = get(a).rect;
    store().resize(a, 600, 500);
    expect(get(a).rect.w).toBe(w);
    store().toggleZoom(a);
    expect(get(a).collapsed).toBe(false);
  });
});

describe('desktop resize', () => {
  it('pulls windows back on screen and refits zoomed ones', () => {
    const a = open('A');
    const b = open('B');
    store().move(a, 900, 500);
    store().toggleZoom(b);
    store().setBounds({ w: 400, h: 300 });
    expect(get(a).rect.x).toBeLessThanOrEqual(400 - 48);
    expect(get(a).rect.y).toBeLessThanOrEqual(300 - 21);
    expect(get(b).rect).toEqual({ x: 2, y: 2, w: 395, h: 295 });
  });
});

describe('remembering where windows were', () => {
  const openDoc = (key: string) =>
    store().open({ appId: 'notes', title: key, key });

  it('reopens a keyed window where it was closed', () => {
    const a = openDoc('readme');
    store().move(a, 300, 120);
    store().resize(a, 500, 350);
    store().close(a);
    const again = openDoc('readme');
    expect(get(again).rect).toEqual({ x: 300, y: 120, w: 500, h: 350 });
  });

  it('remembers the un-zoomed rect of a zoomed window', () => {
    const a = openDoc('about');
    store().move(a, 50, 60);
    const before = get(a).rect;
    store().toggleZoom(a);
    store().close(a);
    expect(get(openDoc('about')).rect).toEqual(before);
  });

  it('does not remember windows without a key', () => {
    const a = open('Hello');
    store().move(a, 400, 300);
    store().close(a);
    expect(Object.keys(store().remembered)).toEqual([]);
  });

  it('forgetAll closes windows and clears saved positions', () => {
    const a = openDoc('readme');
    store().move(a, 300, 120);
    store().forgetAll();
    expect(store().windows).toEqual([]);
    expect(store().remembered).toEqual({});
  });
});

describe('phones and tablets', () => {
  it('opens windows zoomed, remembering a normal size to restore to', () => {
    store().setOpenZoomed(true);
    const a = open('A');
    expect(get(a).zoomed).toBe(true);
    expect(get(a).rect).toEqual({ x: 2, y: 2, w: 995, h: 595 });
    store().toggleZoom(a);
    expect(get(a).zoomed).toBe(false);
    expect(get(a).rect.w).toBeLessThan(995);
    store().setOpenZoomed(false);
  });
});
