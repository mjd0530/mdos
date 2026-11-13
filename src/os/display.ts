import { useEffect } from 'react';
import { installChromeArt } from '../ui/chromeArt';
import {
  HIGHLIGHTS,
  useSettings,
  type Display,
  type HighlightName,
} from './settings';

/** Put the display mode and highlight colour on the page root, where tokens.css reads
 *  them, and install the matching pixel chrome (D-031). */
export function applyDisplay(
  display: Display,
  highlight: HighlightName,
  root: HTMLElement = document.documentElement,
) {
  root.dataset.display = display;
  if (display === 'color') {
    root.style.setProperty('--color-highlight', HIGHLIGHTS[highlight].color);
    root.style.setProperty('--color-highlight-text', '#000000');
  } else {
    root.style.removeProperty('--color-highlight');
    root.style.removeProperty('--color-highlight-text');
  }
  installChromeArt(display, root);
}

/** Keep the page in step with the Monitors and highlight settings. */
export function useApplyDisplay() {
  const display = useSettings((s) => s.display);
  const highlight = useSettings((s) => s.highlight);
  useEffect(() => applyDisplay(display, highlight), [display, highlight]);
}

/** The current display mode, for components that draw pixels themselves. */
export const useDisplay = () => useSettings((s) => s.display);
