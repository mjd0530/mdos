import type { KeyboardEvent } from 'react';
import { albums } from 'virtual:music';
import { useWindows } from '../../os/windows/store';
import type { AppProps } from '../types';
import { SKIN_SIZES } from './index';
import styles from './PlayerApp.module.css';
import { usePlayer, type Skin } from './playerStore';
import { Deck } from './skins/Deck';
import { Pocket } from './skins/Pocket';

const isTyping = (target: EventTarget) => {
  const el = target as HTMLElement;
  return (
    el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
  );
};

/** The music player (D-034): one engine, two looks. */
export default function PlayerApp({ instanceId, isActive }: AppProps) {
  const skin = usePlayer((s) => s.skin);

  const switchSkin = (next: Skin) => {
    usePlayer.getState().setSkin(next);
    const win = useWindows.getState().windows.find((w) => w.id === instanceId);
    if (win && !win.zoomed) {
      useWindows
        .getState()
        .resize(instanceId, SKIN_SIZES[next].w, SKIN_SIZES[next].h);
    }
  };

  // Keys that work anywhere in the player (sliders and buttons keep their own).
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const player = usePlayer.getState();
    const onButton = (e.target as HTMLElement).tagName === 'BUTTON';
    if (e.key === ' ' && !onButton && !isTyping(e.target)) {
      e.preventDefault();
      if (player.album) player.toggle();
      else if (albums[0]) player.playAlbum(albums[0], 0);
    } else if (
      (e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
      !isTyping(e.target)
    ) {
      if ((e.target as HTMLElement).getAttribute('role') === 'tab') return;
      e.preventDefault();
      const forward = e.key === 'ArrowRight';
      if (e.shiftKey) player.seek(player.time + (forward ? 5 : -5));
      else if (forward) player.next();
      else player.prev();
    } else if (
      (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
      !isTyping(e.target)
    ) {
      e.preventDefault();
      player.setVolume(player.volume + (e.key === 'ArrowUp' ? 0.05 : -0.05));
    }
  };

  return (
    <div className={styles.player} onKeyDown={onKeyDown}>
      {albums.length === 0 ? (
        <p className={styles.empty}>No music yet.</p>
      ) : skin === 'deck' ? (
        <Deck albums={albums} active={isActive} />
      ) : (
        <Pocket albums={albums} onSkin={switchSkin} />
      )}
      {skin === 'deck' && albums.length > 0 && (
        <button
          type="button"
          className={styles.skin}
          onClick={() => switchSkin('pocket')}
        >
          Switch to Pocket
        </button>
      )}
    </div>
  );
}
