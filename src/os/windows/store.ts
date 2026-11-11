import { create } from 'zustand';
import { announce } from '../announce';
import {
  cascadeRect,
  clampRect,
  DEFAULT_MIN_SIZE,
  DEFAULT_SIZE,
  zoomedRect,
  type Rect,
  type Size,
} from './geometry';

export interface WindowInstance {
  id: string;
  appId: string;
  title: string;
  rect: Rect;
  minSize: Size;
  zoomed: boolean;
  /** Collapsed windows show only their title bar ("window shade"). */
  collapsed: boolean;
  /** The rect to return to when un-zooming. */
  restoreRect?: Rect;
  /** What the app was opened with (e.g. a file path). Opaque to the window manager. */
  payload?: unknown;
  /** Identity for "one window per document" apps; launch() matches on it. */
  key?: string;
}

export interface OpenOptions {
  appId: string;
  title: string;
  size?: Size;
  minSize?: Size;
  payload?: unknown;
  key?: string;
}

interface WindowsState {
  /** Stable creation order: the DOM order, so reordering never moves focus. */
  windows: WindowInstance[];
  /** Stacking order, back to front. The last id is the active window. */
  order: string[];
  /** Size of the desktop area windows live in. */
  bounds: Size;
  /** Windows opened so far: drives ids and the cascade. */
  opened: number;

  open: (options: OpenOptions) => string;
  close: (id: string) => void;
  setTitle: (id: string, title: string) => void;
  focus: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, w: number, h: number) => void;
  toggleZoom: (id: string) => void;
  toggleCollapse: (id: string) => void;
  /** Bring the next (1) or previous (-1) window to the front. */
  cycle: (direction?: 1 | -1) => void;
  setBounds: (bounds: Size) => void;
  reset: () => void;
}

const initial = {
  windows: [] as WindowInstance[],
  order: [] as string[],
  bounds: { w: 0, h: 0 } as Size,
  opened: 0,
};

export const useWindows = create<WindowsState>((set, get) => {
  const update = (
    id: string,
    change: (win: WindowInstance, bounds: Size) => WindowInstance,
  ) =>
    set((state) => ({
      windows: state.windows.map((win) =>
        win.id === id ? change(win, state.bounds) : win,
      ),
    }));

  return {
    ...initial,

    open: ({
      appId,
      title,
      size = DEFAULT_SIZE,
      minSize = DEFAULT_MIN_SIZE,
      payload,
      key,
    }) => {
      const { opened, bounds } = get();
      const id = `window-${opened + 1}`;
      const win: WindowInstance = {
        id,
        appId,
        title,
        minSize,
        rect: cascadeRect(opened, size, bounds, minSize),
        zoomed: false,
        collapsed: false,
        payload,
        key,
      };
      set((state) => ({
        windows: [...state.windows, win],
        order: [...state.order, id],
        opened: opened + 1,
      }));
      announce(`${title} window opened`);
      return id;
    },

    close: (id) => {
      const win = get().windows.find((w) => w.id === id);
      if (!win) return;
      set((state) => ({
        windows: state.windows.filter((w) => w.id !== id),
        order: state.order.filter((other) => other !== id),
      }));
      announce(`${win.title} window closed`);
    },

    setTitle: (id, title) => {
      if (get().windows.find((w) => w.id === id)?.title === title) return;
      update(id, (win) => ({ ...win, title }));
    },

    focus: (id) =>
      set((state) =>
        state.order.at(-1) === id || !state.order.includes(id)
          ? state
          : { order: [...state.order.filter((other) => other !== id), id] },
      ),

    move: (id, x, y) =>
      update(id, (win, bounds) =>
        win.zoomed
          ? win
          : {
              ...win,
              rect: clampRect({ ...win.rect, x, y }, bounds, win.minSize),
            },
      ),

    resize: (id, w, h) =>
      update(id, (win, bounds) =>
        win.zoomed || win.collapsed
          ? win
          : {
              ...win,
              rect: clampRect({ ...win.rect, w, h }, bounds, win.minSize),
            },
      ),

    toggleZoom: (id) =>
      update(id, (win, bounds) =>
        win.zoomed
          ? {
              ...win,
              zoomed: false,
              rect: clampRect(win.restoreRect ?? win.rect, bounds, win.minSize),
              restoreRect: undefined,
            }
          : {
              ...win,
              zoomed: true,
              collapsed: false,
              restoreRect: win.rect,
              rect: zoomedRect(bounds),
            },
      ),

    toggleCollapse: (id) =>
      update(id, (win) => ({ ...win, collapsed: !win.collapsed })),

    cycle: (direction = 1) =>
      set((state) => {
        if (state.order.length < 2) return state;
        const order = [...state.order];
        if (direction === 1) order.push(order.shift() as string);
        else order.unshift(order.pop() as string);
        return { order };
      }),

    setBounds: (bounds) =>
      set((state) =>
        state.bounds.w === bounds.w && state.bounds.h === bounds.h
          ? state
          : {
              bounds,
              windows: state.windows.map((win) => ({
                ...win,
                rect: win.zoomed
                  ? zoomedRect(bounds)
                  : clampRect(win.rect, bounds, win.minSize),
              })),
            },
      ),

    reset: () => set(initial),
  };
});

export const selectActiveId = (state: WindowsState) => state.order.at(-1);
