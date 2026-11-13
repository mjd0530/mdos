import type { KeyboardEvent, PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { Album } from '../../../music/types';
import { Glyph } from '../Glyph';
import { currentTrack, usePlayer, type Skin } from '../playerStore';
import { formatTime } from '../queue';
import styles from './Pocket.module.css';

type View =
  | { kind: 'main' }
  | { kind: 'albums' }
  | { kind: 'album'; albumId: string }
  | { kind: 'now' }
  | { kind: 'lyrics' };

interface Item {
  id: string;
  label: string;
  /** Shows a › like a submenu. */
  more?: boolean;
  onSelect: () => void;
}

const STEP_DEGREES = 24;

/** The early-2000s handheld skin (D-034): a menu screen and a scroll wheel. */
export function Pocket({
  albums,
  onSkin,
}: {
  albums: Album[];
  onSkin: (skin: Skin) => void;
}) {
  const s = usePlayer();
  const track = currentTrack(s);
  const [stack, setStack] = useState<View[]>([{ kind: 'main' }]);
  const view = stack.at(-1) ?? { kind: 'main' };
  // The highlighted row, by item id, so a row appearing above it (Now Playing, once a
  // song starts) doesn't move the highlight onto a different item.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLElement>(null);

  const push = (next: View) => {
    setStack((st) => [...st, next]);
    setSelectedId(null);
  };
  const back = () => {
    if (stack.length > 1) {
      setStack((st) => st.slice(0, -1));
      setSelectedId(null);
    }
  };

  const openAlbum = (album: Album) =>
    push({ kind: 'album', albumId: album.id });
  const onlyAlbum = albums.length === 1 ? albums[0] : undefined;

  let title = 'Music';
  let items: Item[] = [];
  if (view.kind === 'main') {
    items = [
      onlyAlbum
        ? {
            id: 'songs',
            label: 'Songs',
            more: true,
            onSelect: () => openAlbum(onlyAlbum),
          }
        : {
            id: 'albums',
            label: 'Albums',
            more: true,
            onSelect: () => push({ kind: 'albums' }),
          },
      ...(track
        ? [
            {
              id: 'now',
              label: 'Now Playing',
              more: true,
              onSelect: () => push({ kind: 'now' }),
            },
          ]
        : []),
      {
        id: 'shuffle',
        label: `Shuffle: ${s.shuffle ? 'On' : 'Off'}`,
        onSelect: s.toggleShuffle,
      },
      {
        id: 'repeat',
        label: `Repeat: ${s.repeat === 'off' ? 'Off' : s.repeat === 'all' ? 'All' : 'One'}`,
        onSelect: s.cycleRepeat,
      },
      { id: 'skin', label: 'Switch to Deck', onSelect: () => onSkin('deck') },
    ];
  } else if (view.kind === 'albums') {
    title = 'Albums';
    items = albums.map((album) => ({
      id: album.id,
      label: album.title,
      more: true,
      onSelect: () => openAlbum(album),
    }));
  } else if (view.kind === 'album') {
    const album = albums.find((a) => a.id === view.albumId);
    title = album?.title ?? 'Songs';
    items =
      album?.tracks.map((t, i) => ({
        id: t.id,
        label: t.title,
        onSelect: () => {
          s.playAlbum(album, i);
          push({ kind: 'now' });
        },
      })) ?? [];
  } else if (view.kind === 'now') {
    title = 'Now Playing';
  } else {
    title = 'Lyrics';
  }

  const isList = view.kind !== 'now' && view.kind !== 'lyrics';
  const clamped = Math.max(
    0,
    items.findIndex((item) => item.id === selectedId),
  );

  // Keep the selected row in view; move focus with it when focus is in the list.
  useEffect(() => {
    const row = listRef.current?.children[clamped] as HTMLElement | undefined;
    row?.scrollIntoView?.({ block: 'nearest' });
    // Keep keyboard focus in the player when a screen changes under it.
    const focus = document.activeElement;
    const lost = !focus || focus === document.body;
    if (lost || listRef.current?.contains(focus)) {
      const target = row?.querySelector('button') ?? screenRef.current;
      target?.focus();
    }
  }, [clamped, stack]);

  /** One click of the wheel (or an arrow key). */
  const step = (direction: 1 | -1) => {
    // Several clicks can land in one pointer move, so each builds on the latest state,
    // not on this render's.
    if (isList) {
      setSelectedId((prev) => {
        const at = Math.max(
          0,
          items.findIndex((item) => item.id === prev),
        );
        const to = Math.min(Math.max(0, at + direction), items.length - 1);
        return items[to]?.id ?? prev;
      });
    } else if (view.kind === 'now') {
      const { volume, setVolume } = usePlayer.getState();
      setVolume(volume + direction * 0.05);
    } else {
      lyricsRef.current?.scrollBy({ top: direction * 20 });
    }
  };

  const select = () => {
    if (isList) items[clamped]?.onSelect();
    else if (view.kind === 'now' && track?.lyrics) push({ kind: 'lyrics' });
    else if (view.kind === 'now') s.toggle();
  };

  const playPause = () => {
    if (s.album) s.toggle();
    else if (albums[0]) s.playAlbum(albums[0], 0);
  };

  // Circular drag on the wheel ring scrolls, like a real scroll wheel.
  const drag = useRef<{ angle: number; acc: number } | null>(null);
  const angleOf = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return (
      (Math.atan2(
        e.clientY - (rect.top + rect.height / 2),
        e.clientX - (rect.left + rect.width / 2),
      ) *
        180) /
      Math.PI
    );
  };
  const onWheelDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // a button, not the ring
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { angle: angleOf(e), acc: 0 };
  };
  const onWheelMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const angle = angleOf(e);
    let delta = angle - drag.current.angle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    drag.current.angle = angle;
    drag.current.acc += delta;
    while (Math.abs(drag.current.acc) >= STEP_DEGREES) {
      const direction = drag.current.acc > 0 ? 1 : -1;
      drag.current.acc -= direction * STEP_DEGREES;
      step(direction);
    }
  };
  const onWheelUp = () => {
    drag.current = null;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      // Down moves down a list but turns the volume down.
      const down = e.key === 'ArrowDown';
      step(view.kind === 'now' ? (down ? -1 : 1) : down ? 1 : -1);
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
      if (stack.length > 1) {
        e.preventDefault();
        e.stopPropagation();
        back();
      }
    } else if (
      e.key === 'Enter' &&
      (e.target as HTMLElement).tagName !== 'BUTTON'
    ) {
      e.preventDefault();
      select();
    }
  };

  const duration = s.duration || track?.duration || 0;

  return (
    <div className={styles.pocket} onKeyDown={onKeyDown}>
      <div className={styles.shell}>
        <section
          ref={screenRef}
          className={styles.screen}
          aria-label="Screen"
          tabIndex={-1}
        >
          <header className={styles.bar}>
            <h3>{title}</h3>
            {s.playing && <Glyph name="play" scale={1} />}
          </header>

          {isList && (
            <ul ref={listRef} className={styles.list} aria-label={title}>
              {items.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    tabIndex={i === clamped ? 0 : -1}
                    aria-current={i === clamped || undefined}
                    onClick={() => {
                      setSelectedId(item.id);
                      item.onSelect();
                    }}
                  >
                    <span>{item.label}</span>
                    {item.more && <span aria-hidden="true">›</span>}
                  </button>
                </li>
              ))}
              {items.length === 0 && (
                <li className={styles.empty}>No songs yet</li>
              )}
            </ul>
          )}

          {view.kind === 'now' && track && s.album && (
            <div className={styles.now}>
              <p className={styles.count}>
                {s.pos + 1} of {s.order.length}
              </p>
              <div className={styles.nowBody}>
                <img
                  src={s.album.coverThumb}
                  alt={s.album.coverAlt}
                  width={72}
                  height={72}
                />
                <div>
                  <p className={styles.song}>{track.title}</p>
                  <p>{s.album.artist}</p>
                  <p>{s.album.title}</p>
                </div>
              </div>
              <div className={styles.progress} aria-hidden="true">
                <span
                  style={{
                    width: `${duration ? (s.time / duration) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className={styles.times}>
                <span className="visually-hidden">Position </span>
                <span>{formatTime(s.time)}</span>
                <span className="visually-hidden"> of </span>
                <span aria-hidden="true">
                  -{formatTime(Math.max(0, duration - s.time))}
                </span>
                <span className="visually-hidden">{formatTime(duration)}</span>
              </p>
              {track.lyrics && (
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => push({ kind: 'lyrics' })}
                >
                  Lyrics ›
                </button>
              )}
            </div>
          )}
          {view.kind === 'now' && !track && (
            <p className={styles.empty}>Nothing playing</p>
          )}

          {view.kind === 'lyrics' && (
            <div ref={lyricsRef} className={styles.lyrics} tabIndex={0}>
              <p className={styles.song}>{track?.title}</p>
              <p>{track?.lyrics ?? 'No lyrics for this song.'}</p>
            </div>
          )}
        </section>

        <div
          className={styles.wheel}
          onPointerDown={onWheelDown}
          onPointerMove={onWheelMove}
          onPointerUp={onWheelUp}
          onPointerCancel={onWheelUp}
        >
          <button
            type="button"
            className={`${styles.wheelButton} ${styles.top}`}
            onClick={back}
            aria-label="Back"
          >
            BACK
          </button>
          <button
            type="button"
            className={`${styles.wheelButton} ${styles.left}`}
            onClick={s.prev}
            aria-label="Previous"
          >
            <Glyph name="prev" scale={1} />
          </button>
          <button
            type="button"
            className={`${styles.wheelButton} ${styles.right}`}
            onClick={s.next}
            aria-label="Next"
          >
            <Glyph name="next" scale={1} />
          </button>
          <button
            type="button"
            className={`${styles.wheelButton} ${styles.bottom}`}
            onClick={playPause}
            aria-label={s.playing ? 'Pause' : 'Play'}
          >
            <Glyph name="play" scale={1} />
            <Glyph name="pause" scale={1} />
          </button>
          <button
            type="button"
            className={styles.centre}
            onClick={select}
            aria-label="Select"
          />
        </div>
      </div>
      <p className="visually-hidden">
        Up and Down move through the menu or change the volume, Enter selects,
        Escape goes back.
      </p>
    </div>
  );
}
