import type { KeyboardEvent } from 'react';
import { useEffect, useState } from 'react';
import { albums } from 'virtual:music';
import { useWindowFrame } from '../../os/windows/frame';
import { useWindows } from '../../os/windows/store';
import { Button } from '../../ui/Button';
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
  const frame = useWindowFrame();
  // The album Deck's playlist shows; Play and Space start it when nothing is loaded.
  const [browsing, setBrowsing] = useState<string | null>(null);
  const shown = albums.find((a) => a.id === browsing) ?? albums[0];

  const switchSkin = (next: Skin) => usePlayer.getState().setSkin(next);

  // The device is exactly its look's size. The window remembers its last rect, which
  // may be the other look's (or an older size), so set it on open and on every switch.
  useEffect(() => {
    const { w, h } = SKIN_SIZES[skin];
    const win = useWindows.getState().windows.find((x) => x.id === instanceId);
    if (win && (win.rect.w !== w || win.rect.h !== h)) {
      useWindows.getState().resize(instanceId, w, h);
    }
  }, [skin, instanceId]);

  // Keys that work anywhere in the player (sliders and buttons keep their own).
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const player = usePlayer.getState();
    const onButton = (e.target as HTMLElement).tagName === 'BUTTON';
    if (e.key === ' ' && !onButton && !isTyping(e.target)) {
      e.preventDefault();
      if (player.album) player.toggle();
      else if (shown) player.playAlbum(shown, 0);
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
        <div className={styles.empty} {...frame?.grip}>
          <p>No music yet.</p>
          {frame && <Button onClick={frame.close}>Close</Button>}
        </div>
      ) : skin === 'deck' ? (
        <Deck
          albums={albums}
          active={isActive}
          onSkin={switchSkin}
          browsing={browsing}
          onBrowse={setBrowsing}
        />
      ) : (
        <Pocket albums={albums} onSkin={switchSkin} />
      )}
    </div>
  );
}
