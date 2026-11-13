import { create } from 'zustand';

/**
 * What the music player is playing, for the menu-bar indicator (D-034). The player
 * writes it; the OS only reads it, so the player's code loads only when it's opened.
 */
export interface NowPlaying {
  /** Song title, or null when nothing is loaded. */
  title: string | null;
  artist: string;
  playing: boolean;
}

export const useNowPlaying = create<NowPlaying>(() => ({
  title: null,
  artist: '',
  playing: false,
}));
