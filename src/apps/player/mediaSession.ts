import type { Album, Track } from '../../music/types';
import { usePlayer } from './playerStore';

// Media Session: song details and controls on phone lock screens, in the OS media
// overlay and on keyboard media keys. Missing in some browsers; then this does nothing.

let handlersSet = false;

function setHandlers(session: MediaSession) {
  const actions: [MediaSessionAction, MediaSessionActionHandler][] = [
    ['play', () => usePlayer.getState().play()],
    ['pause', () => usePlayer.getState().pause()],
    ['previoustrack', () => usePlayer.getState().prev()],
    ['nexttrack', () => usePlayer.getState().next()],
    [
      'seekto',
      (details) => {
        if (details.seekTime !== undefined) {
          usePlayer.getState().seek(details.seekTime);
        }
      },
    ],
  ];
  for (const [action, handler] of actions) {
    try {
      session.setActionHandler(action, handler);
    } catch {
      /* action not supported here */
    }
  }
  handlersSet = true;
}

export function updateMediaSession(
  album: Album | null,
  track: Track | undefined,
  playing: boolean,
) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator))
    return;
  const session = navigator.mediaSession;
  if (!handlersSet) setHandlers(session);
  if (!album || !track) {
    session.metadata = null;
    session.playbackState = 'none';
    return;
  }
  const artwork = new URL(album.cover, window.location.href).href;
  session.metadata = new MediaMetadata({
    title: track.title,
    artist: album.artist,
    album: album.title,
    artwork: [{ src: artwork, sizes: '600x600', type: 'image/webp' }],
  });
  session.playbackState = playing ? 'playing' : 'paused';
}
