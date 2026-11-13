import { useState } from 'react';
import type { Album } from '../../../music/types';
import { launch } from '../../launch';
import { ScrollArea } from '../../../ui/ScrollArea';
import { Glyph } from '../Glyph';
import { currentTrack, usePlayer } from '../playerStore';
import { formatTime } from '../queue';
import { Spectrum } from '../Spectrum';
import styles from './Deck.module.css';

type Panel = 'playlist' | 'lyrics' | 'album';

const REPEAT_LABEL = {
  off: 'Repeat: off',
  all: 'Repeat: all',
  one: 'Repeat: one',
};

/** The late-90s desktop player skin (D-034). */
export function Deck({ albums, active }: { albums: Album[]; active: boolean }) {
  const s = usePlayer();
  const track = currentTrack(s);
  // Before anything plays, show the first album so the playlist isn't empty.
  const album = s.album ?? albums[0];
  const [panel, setPanel] = useState<Panel>('playlist');
  const playingIndex = s.order[s.pos];
  const duration = s.duration || track?.duration || 0;
  const marquee = track
    ? `${(playingIndex ?? 0) + 1}. ${track.title} · ${s.album?.artist} · ${s.album?.title}`
    : album
      ? `${album.artist} · ${album.title}`
      : 'No music yet';

  const play = () => {
    if (s.album) s.toggle();
    else if (album) s.playAlbum(album, 0);
  };

  return (
    <div className={styles.deck}>
      <div className={styles.display}>
        <div className={styles.time} aria-hidden="true">
          <span className={styles.state}>
            <Glyph name={s.playing ? 'play' : 'pause'} scale={1} />
          </span>
          {formatTime(s.time)}
        </div>
        <div className={styles.marquee}>
          <span
            className={styles.marqueeText}
            data-scroll={marquee.length > 28 || undefined}
          >
            {marquee}
          </span>
        </div>
        <Spectrum className={styles.spectrum} />
        <div className={styles.flags} aria-hidden="true">
          <span data-on={s.shuffle || undefined}>SHUF</span>
          <span data-on={s.repeat !== 'off' || undefined}>
            {s.repeat === 'one' ? 'REP 1' : 'REP'}
          </span>
        </div>
      </div>

      <label className={styles.seek}>
        <span className="visually-hidden">Position</span>
        <input
          type="range"
          min={0}
          max={Math.max(1, Math.round(duration))}
          step={1}
          value={Math.round(s.time)}
          disabled={!track}
          aria-valuetext={`${formatTime(s.time)} of ${formatTime(duration)}`}
          onChange={(e) => s.seek(Number(e.currentTarget.value))}
        />
      </label>

      <div className={styles.controls}>
        <div className={styles.transport}>
          <button
            type="button"
            onClick={s.prev}
            disabled={!track}
            aria-label="Previous"
          >
            <Glyph name="prev" />
          </button>
          <button
            type="button"
            onClick={play}
            disabled={!album}
            aria-label={s.playing ? 'Pause' : 'Play'}
          >
            <Glyph name={s.playing ? 'pause' : 'play'} />
          </button>
          <button
            type="button"
            onClick={s.next}
            disabled={!track}
            aria-label="Next"
          >
            <Glyph name="next" />
          </button>
          <button
            type="button"
            onClick={s.toggleShuffle}
            aria-pressed={s.shuffle}
            aria-label="Shuffle"
          >
            <Glyph name="shuffle" />
          </button>
          <button
            type="button"
            onClick={s.cycleRepeat}
            aria-label={REPEAT_LABEL[s.repeat]}
            data-on={s.repeat !== 'off' || undefined}
          >
            <Glyph name="repeat" />
            {s.repeat === 'one' && <span className={styles.one}>1</span>}
          </button>
        </div>
        <label className={styles.volume}>
          <span>Vol</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(s.volume * 100)}
            aria-label="Volume"
            aria-valuetext={`${Math.round(s.volume * 100)}%`}
            onChange={(e) => s.setVolume(Number(e.currentTarget.value) / 100)}
          />
        </label>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Show">
        {(['playlist', 'lyrics', 'album'] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`deck-tab-${id}`}
            aria-selected={panel === id}
            aria-controls="deck-panel"
            tabIndex={panel === id ? 0 : -1}
            onClick={() => setPanel(id)}
            onKeyDown={(e) => {
              const ids = ['playlist', 'lyrics', 'album'] as const;
              const at = ids.indexOf(id);
              const to =
                e.key === 'ArrowRight'
                  ? ids[(at + 1) % 3]
                  : e.key === 'ArrowLeft'
                    ? ids[(at + 2) % 3]
                    : undefined;
              if (!to) return;
              e.preventDefault();
              e.stopPropagation();
              setPanel(to);
              document.getElementById(`deck-tab-${to}`)?.focus();
            }}
          >
            {id === 'playlist'
              ? 'Playlist'
              : id === 'lyrics'
                ? 'Lyrics'
                : 'Album'}
          </button>
        ))}
      </div>

      <div
        id="deck-panel"
        role="tabpanel"
        aria-labelledby={`deck-tab-${panel}`}
        className={styles.panel}
      >
        <ScrollArea active={active}>
          {panel === 'playlist' && (
            <div className={styles.playlist}>
              {albums.length > 1 && (
                <ul className={styles.albums} aria-label="Albums">
                  {albums.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        aria-current={a.id === album?.id || undefined}
                        onClick={() => s.playAlbum(a, 0, false)}
                      >
                        <img src={a.coverThumb} alt="" width={32} height={32} />
                        <span>{a.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {album && (
                <ol
                  className={styles.tracks}
                  aria-label={`${album.title} songs`}
                >
                  {album.tracks.map((t, i) => {
                    const current =
                      s.album?.id === album.id && playingIndex === i;
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          aria-current={current || undefined}
                          onClick={() => s.playAlbum(album, i)}
                        >
                          <span className={styles.n}>{i + 1}.</span>
                          <span className={styles.title}>{t.title}</span>
                          <span className={styles.len}>
                            {formatTime(t.duration)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
          {panel === 'lyrics' && (
            <div className={styles.lyrics}>
              {track ? (
                <>
                  <h3>{track.title}</h3>
                  {track.lyrics ? (
                    <p>{track.lyrics}</p>
                  ) : (
                    <p>No lyrics for this song.</p>
                  )}
                </>
              ) : (
                <p>Play a song to see its lyrics.</p>
              )}
            </div>
          )}
          {panel === 'album' && album && (
            <div className={styles.album}>
              <button
                type="button"
                className={styles.cover}
                onClick={() =>
                  launch('viewer', {
                    items: [
                      {
                        src: album.cover,
                        alt: album.coverAlt,
                        title: album.title,
                      },
                    ],
                    index: 0,
                    set: `album:${album.id}`,
                  })
                }
              >
                <span className="visually-hidden">View larger: </span>
                <img
                  src={album.cover}
                  alt={album.coverAlt}
                  width={180}
                  height={180}
                />
              </button>
              <h3>{album.title}</h3>
              <p>{[album.artist, album.year].filter(Boolean).join(', ')}</p>
              {album.credits && (
                <p className={styles.credits}>{album.credits}</p>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
