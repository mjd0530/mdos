import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isRect, sanitizeRecord, storage } from '../persist';
import { announce } from '../announce';
import { playSound } from '../sounds';
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
  /** Last rect of each keyed window ("appId:key"), saved between visits. */
  remembered: Record<string, Rect>;
  /** On phones and tablets new windows open zoomed (D-024). */
  openZoomed: boolean;

  open: (options: OpenOptions) => string;
  close: (id: string) => void;
  setTitle: (id: string, title: string) => void;
  /** Re-launching an open window can hand it new data (e.g. a different picture). */
  setPayload: (id: string, payload: unknown) => void;
  focus: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, w: number, h: number) => void;
  toggleZoom: (id: string) => void;
  toggleCollapse: (id: string) => void;
  /** Bring the next (1) or previous (-1) window to the front. */
  cycle: (direction?: 1 | -1) => void;
  setBounds: (bounds: Size) => void;
  setOpenZoomed: (openZoomed: boolean) => void;
  /** Special → Reset Desktop: close every window and forget saved positions. */
  forgetAll: () => void;
  reset: () => void;
}

const initial = {
  windows: [] as WindowInstance[],
  order: [] as string[],
  bounds: { w: 0, h: 0 } as Size,
  opened: 0,
  remembered: {} as Record<string, Rect>,
  openZoomed: false,
};

/** Windows with a key (one per document, or single-instance apps) remember their rect. */
export const rememberKey = (win: { appId: string; key?: string }) =>
  win.key === undefined ? undefined : `${win.appId}:${win.key}`;

export const useWindows = create<WindowsState>()(
  persist(
    (set, get) => {
      const update = (
        id: string,
        change: (win: WindowInstance, bounds: Size) => WindowInstance,
      ) =>
        set((state) => ({
          windows: state.windows.map((win) =>
            win.id === id ? change(win, state.bounds) : win,
          ),
        }));

      /** Save a window's current (un-zoomed) rect under its key. */
      const remember = (id: string) => {
        const win = get().windows.find((w) => w.id === id);
        const key = win && rememberKey(win);
        if (!win || !key) return;
        const rect = win.zoomed ? (win.restoreRect ?? win.rect) : win.rect;
        set((state) => ({ remembered: { ...state.remembered, [key]: rect } }));
      };

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
          const { opened, bounds, remembered, openZoomed } = get();
          const id = `window-${opened + 1}`;
          const saved =
            key === undefined ? undefined : remembered[`${appId}:${key}`];
          const win: WindowInstance = {
            id,
            appId,
            title,
            minSize,
            rect: saved
              ? clampRect(saved, bounds, minSize)
              : cascadeRect(opened, size, bounds, minSize),
            zoomed: false,
            collapsed: false,
            payload,
            key,
          };
          if (openZoomed) {
            win.restoreRect = win.rect;
            win.rect = zoomedRect(bounds);
            win.zoomed = true;
          }
          set((state) => ({
            windows: [...state.windows, win],
            order: [...state.order, id],
            opened: opened + 1,
          }));
          announce(`${title} window opened`);
          playSound('open');
          return id;
        },

        close: (id) => {
          const win = get().windows.find((w) => w.id === id);
          if (!win) return;
          remember(id);
          set((state) => ({
            windows: state.windows.filter((w) => w.id !== id),
            order: state.order.filter((other) => other !== id),
          }));
          announce(`${win.title} window closed`);
          playSound('close');
        },

        setTitle: (id, title) => {
          if (get().windows.find((w) => w.id === id)?.title === title) return;
          update(id, (win) => ({ ...win, title }));
        },

        setPayload: (id, payload) => update(id, (win) => ({ ...win, payload })),

        focus: (id) =>
          set((state) =>
            state.order.at(-1) === id || !state.order.includes(id)
              ? state
              : { order: [...state.order.filter((other) => other !== id), id] },
          ),

        move: (id, x, y) => {
          update(id, (win, bounds) =>
            win.zoomed
              ? win
              : {
                  ...win,
                  rect: clampRect({ ...win.rect, x, y }, bounds, win.minSize),
                },
          );
          remember(id);
        },

        resize: (id, w, h) => {
          update(id, (win, bounds) =>
            win.zoomed || win.collapsed
              ? win
              : {
                  ...win,
                  rect: clampRect({ ...win.rect, w, h }, bounds, win.minSize),
                },
          );
          remember(id);
        },

        toggleZoom: (id) =>
          update(id, (win, bounds) =>
            win.zoomed
              ? {
                  ...win,
                  zoomed: false,
                  rect: clampRect(
                    win.restoreRect ?? win.rect,
                    bounds,
                    win.minSize,
                  ),
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

        setOpenZoomed: (openZoomed) => set({ openZoomed }),

        forgetAll: () => set({ windows: [], order: [], remembered: {} }),

        reset: () => set(initial),
      };
    },
    {
      name: 'mikeos:windows',
      version: 1,
      storage,
      // Open windows are not restored; only where keyed windows were last placed.
      partialize: (state) => ({ remembered: state.remembered }),
      merge: (saved, current) => ({
        ...current,
        remembered: sanitizeRecord(
          (saved as { remembered?: unknown } | undefined)?.remembered,
          isRect,
        ),
      }),
    },
  ),
);

export const selectActiveId = (state: WindowsState) => state.order.at(-1);
