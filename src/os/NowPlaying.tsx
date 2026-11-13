import { launch } from '../apps/launch';
import styles from './NowPlaying.module.css';
import { useNowPlaying } from './nowPlayingStore';

// A small note in the menu bar while music plays (D-034); it brings the player forward.
const NOTE = ['  ####', '  #  #', '  #   ', '  #   ', '###   ', '###   '];

export function NowPlaying() {
  const { title, artist, playing } = useNowPlaying();
  if (!title || !playing) return null;
  return (
    <button
      type="button"
      className={styles.button}
      aria-label={`Now playing: ${title}, ${artist}. Show the music player`}
      title={`${title} · ${artist}`}
      onClick={() => launch('player')}
    >
      <svg
        aria-hidden="true"
        width={12}
        height={12}
        viewBox="0 0 6 6"
        shapeRendering="crispEdges"
        fill="currentColor"
      >
        {NOTE.flatMap((row, y) =>
          [...row].map((c, x) =>
            c === '#' ? (
              <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} />
            ) : null,
          ),
        )}
      </svg>
    </button>
  );
}
