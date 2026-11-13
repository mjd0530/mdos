import type { KeyboardEvent, PointerEvent } from 'react';
import { createContext, useContext } from 'react';

/**
 * What a free-standing window (`window.frame: 'none'`, D-035) hands its app, which draws
 * its own shape instead of System 7 chrome. The app must render `grip` on the part people
 * drag it by and a close button that calls `close`.
 */
export interface WindowFrame {
  title: string;
  close: () => void;
  /** Spread onto the drag handle: pointer drag plus arrow keys to move. Pointer drags
   *  that start on a button, input, link or `[data-no-drag]` are left alone. */
  grip: {
    onPointerDown: (event: PointerEvent<HTMLElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
  };
  /** For a focusable handle: arrow keys move the window. */
  onGripKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /** id of the "Arrow keys move this window" hint, for aria-describedby. */
  hintId: string;
  /** Phones show the device centred and fixed; there's nothing to drag. */
  phone: boolean;
}

export const WindowFrameContext = createContext<WindowFrame | null>(null);

/** The free-standing window this app is in, or null inside a normal window. */
export function useWindowFrame(): WindowFrame | null {
  return useContext(WindowFrameContext);
}
