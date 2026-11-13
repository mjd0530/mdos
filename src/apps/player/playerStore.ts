import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Album, Track } from '../../music/types';
import { announce } from '../../os/announce';
import { useNowPlaying } from '../../os/nowPlayingStore';
import { onClearSaved, storage } from '../../os/persist';
import { useWindows } from '../../os/windows/store';
import { ensureAnalyser } from './analyser';
import { updateMediaSession } from './mediaSession';
import { makeOrder, nextPos, prevPos, type Repeat } from './queue';

export type Skin = 'deck' | 'pocket';

/** What the player remembers between visits (D-034). Never the song or position. */
export interface PlayerPrefs {
  volume: number;
  shuffle: boolean;
  repeat: Repeat;
  skin: Skin;
}

export const DEFAULT_PREFS: PlayerPrefs = {
  volume: 0.8,
  shuffle: false,
  repeat: 'off',
  skin: 'deck',
};

export function sanitizePrefs(saved: unknown): PlayerPrefs {
  const v = (saved && typeof saved === 'object' ? saved : {}) as Record<
    string,
    unknown
  >;
  return {
    volume:
      typeof v.volume === 'number' && v.volume >= 0 && v.volume <= 1
        ? v.volume
        : DEFAULT_PREFS.volume,
    shuffle: typeof v.shuffle === 'boolean' ? v.shuffle : DEFAULT_PREFS.shuffle,
    repeat:
      v.repeat === 'off' || v.repeat === 'all' || v.repeat === 'one'
        ? v.repeat
        : DEFAULT_PREFS.repeat,
    skin:
      v.skin === 'deck' || v.skin === 'pocket' ? v.skin : DEFAULT_PREFS.skin,
  };
}

export interface PlayerState extends PlayerPrefs {
  album: Album | null;
  /** Indices into album.tracks, in play order. */
  order: number[];
  pos: number;
  playing: boolean;
  /** Seconds into the current song. */
  time: number;
  duration: number;
  /** Set when a song couldn't be loaded. */
  error: string | null;

  /** Load an album at a track and play it. */
  playAlbum: (album: Album, trackIndex?: number) => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setSkin: (skin: Skin) => void;
  /** Stop and forget the song (the player window closed). */
  stop: () => void;
}

/** The song at the current position, if any. */
export const currentTrack = (s: {
  album: Album | null;
  order: number[];
  pos: number;
}): Track | undefined => s.album?.tracks[s.order[s.pos] ?? -1];

// One audio element for the whole app, outside React: collapsing the window, switching
// skins or re-rendering never interrupts the music.
let audio: HTMLAudioElement | undefined;
/** True while one song is being swapped for the next during playback. */
let switching = false;

function element(): HTMLAudioElement {
  if (audio) return audio;
  const el = new Audio();
  el.preload = 'metadata';
  el.volume = usePlayer.getState().volume;
  el.addEventListener('timeupdate', () =>
    usePlayer.setState({ time: el.currentTime }),
  );
  el.addEventListener('durationchange', () => {
    if (Number.isFinite(el.duration)) {
      usePlayer.setState({ duration: el.duration });
    }
  });
  el.addEventListener('play', () => {
    switching = false;
    usePlayer.setState({ playing: true });
  });
  el.addEventListener('pause', () => {
    // Changing songs while playing fires a pause before the new song plays; ignore it so
    // the player doesn't flash to paused between songs.
    // A song reaching its end also pauses just before `ended`, which moves on to the
    // next song; staying "playing" through that avoids a flash of paused.
    if (!switching && !el.ended) usePlayer.setState({ playing: false });
  });
  el.addEventListener('ended', () => {
    // A late `ended` from a song that's already been replaced (skipped right at its
    // end) must not skip the new one too.
    if (el.ended && !switching) advance(true);
  });
  el.addEventListener('error', () => {
    switching = false;
    if (!el.getAttribute('src')) return;
    const title = currentTrack(usePlayer.getState())?.title ?? 'This song';
    usePlayer.setState({
      playing: false,
      error: `${title} couldn't be played.`,
    });
    announce(`${title} couldn't be played`);
  });
  audio = el;
  return el;
}

/**
 * Start playing. A rejected play() only means "paused" when the browser refused it
 * (NotAllowedError); an AbortError just means a newer song or seek replaced this one,
 * and the element's own play/pause events keep `playing` right.
 */
function start(el: HTMLAudioElement) {
  ensureAnalyser(el);
  el.play().catch((error: unknown) => {
    if ((error as { name?: string } | null)?.name !== 'AbortError') {
      switching = false;
      usePlayer.setState({ playing: false });
    }
  });
}

function load(pos: number, play: boolean) {
  const state = usePlayer.getState();
  const track = state.album?.tracks[state.order[pos] ?? -1];
  if (!state.album || !track) return;
  const el = element();
  usePlayer.setState({
    pos,
    time: 0,
    duration: track.duration,
    error: null,
  });
  // Going straight on to another song: the pause the src change fires isn't real.
  switching = play && !el.paused;
  el.src = track.src;
  if (play) start(el);
  announce(`${play ? 'Now playing' : 'Selected'}: ${track.title}`);
}

function advance(auto: boolean) {
  const { order, pos, repeat } = usePlayer.getState();
  const to = nextPos({ order, pos }, repeat, auto);
  if (to === null) {
    // End of the album: back to the first song, stopped.
    audio?.pause();
    usePlayer.setState({ playing: false });
    load(0, false);
    return;
  }
  if (to === pos && audio) {
    audio.currentTime = 0;
    start(audio);
    return;
  }
  // A song ending goes on to the next; Next while paused just moves, staying paused.
  load(to, auto || usePlayer.getState().playing);
}

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PREFS,
      album: null,
      order: [],
      pos: 0,
      playing: false,
      time: 0,
      duration: 0,
      error: null,

      playAlbum: (album, trackIndex = 0) => {
        const { shuffle, album: current, order } = get();
        if (current?.id === album.id && order[get().pos] === trackIndex) {
          if (!get().playing) get().play();
          return;
        }
        const nextOrder =
          current?.id === album.id && !shuffle
            ? order
            : makeOrder(album.tracks.length, shuffle, trackIndex);
        set({ album, order: nextOrder });
        load(nextOrder.indexOf(trackIndex), true);
      },
      toggle: () => (get().playing ? get().pause() : get().play()),
      play: () => {
        if (!get().album || !audio?.getAttribute('src')) return;
        start(audio);
      },
      pause: () => {
        // Pausing mid-swap cancels the swap: the pause it fires is real.
        switching = false;
        set({ playing: false });
        audio?.pause();
      },
      next: () => {
        if (get().album) advance(false);
      },
      prev: () => {
        const { order, pos, repeat, album } = get();
        if (!album) return;
        const to = prevPos({ order, pos }, repeat, audio?.currentTime ?? 0);
        if (to === pos) get().seek(0);
        else load(to, get().playing);
      },
      seek: (seconds) => {
        // Nothing loaded (e.g. reopened after closing): nothing to seek.
        if (!audio || !get().album || !audio.getAttribute('src')) return;
        const max = get().duration || audio.duration || 0;
        const time = Math.min(Math.max(0, seconds), max);
        audio.currentTime = time;
        set({ time });
      },
      setVolume: (volume) => {
        const v = Math.min(1, Math.max(0, Math.round(volume * 100) / 100));
        if (audio) audio.volume = v;
        set({ volume: v });
      },
      toggleShuffle: () => {
        const { shuffle, album, order, pos } = get();
        const on = !shuffle;
        const playingIndex = order[pos] ?? 0;
        const nextOrder = album
          ? makeOrder(album.tracks.length, on, on ? playingIndex : 0)
          : [];
        set({
          shuffle: on,
          order: nextOrder,
          pos: album ? nextOrder.indexOf(playingIndex) : 0,
        });
        announce(on ? 'Shuffle on' : 'Shuffle off');
      },
      cycleRepeat: () => {
        const repeat: Repeat =
          get().repeat === 'off'
            ? 'all'
            : get().repeat === 'all'
              ? 'one'
              : 'off';
        set({ repeat });
        announce(
          repeat === 'off'
            ? 'Repeat off'
            : repeat === 'all'
              ? 'Repeat all songs'
              : 'Repeat this song',
        );
      },
      setSkin: (skin) => set({ skin }),
      stop: () => {
        switching = false;
        set({ error: null });
        if (audio) {
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        }
        set({
          album: null,
          order: [],
          pos: 0,
          playing: false,
          time: 0,
          duration: 0,
        });
      },
    }),
    {
      name: 'mikeos:player',
      version: 1,
      storage,
      partialize: ({ volume, shuffle, repeat, skin }) => ({
        volume,
        shuffle,
        repeat,
        skin,
      }),
      merge: (saved, current) => ({ ...current, ...sanitizePrefs(saved) }),
    },
  ),
);

// Reset Desktop forgets the player's preferences too.
onClearSaved(() => {
  usePlayer.setState(DEFAULT_PREFS);
  if (audio) audio.volume = DEFAULT_PREFS.volume;
});

// Music plays while the window is open (even collapsed or behind others) and stops
// when it closes.
useWindows.subscribe((state) => {
  if (
    usePlayer.getState().album &&
    !state.windows.some((w) => w.appId === 'player')
  ) {
    usePlayer.getState().stop();
  }
});

// Keep the menu bar's indicator and the phone's lock screen in step.
usePlayer.subscribe((state, before) => {
  const track = currentTrack(state);
  if (
    state.playing === before.playing &&
    track === currentTrack(before) &&
    state.album === before.album
  ) {
    return;
  }
  useNowPlaying.setState({
    title: track?.title ?? null,
    artist: state.album?.artist ?? '',
    playing: state.playing,
  });
  updateMediaSession(state.album, track, state.playing);
});
