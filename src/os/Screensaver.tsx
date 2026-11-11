import { useEffect, useRef } from 'react';
import { ICONS, type IconName } from '../assets/icons/icons';
import { parsePixels } from '../ui/pixels';
import {
  ACTIVITY,
  step,
  useScreensaver,
  type Sprite,
} from './screensaverState';
import styles from './Screensaver.module.css';

const SCALE = 2;
const SIZE = 32 * SCALE;
const SPRITE_ICONS: IconName[] = [
  'folder',
  'document',
  'computer',
  'weather',
  'image',
  'notes',
  'files',
  'weatherClear',
  'link',
  'trash',
  'folder',
  'document',
];
const MOVE_TO_WAKE = 6; // px: ignore jitter from a resting mouse

/** Pre-draw an icon white-on-black (inverted, like a selected icon) at 2×. */
function renderSprite(name: IconName): HTMLCanvasElement {
  const art = parsePixels(ICONS[name]);
  const canvas = document.createElement('canvas');
  canvas.width = art.width * SCALE;
  canvas.height = art.height * SCALE;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (const run of art.runs) {
      ctx.fillStyle =
        run.color === 'black'
          ? '#fff'
          : run.color === 'white'
            ? '#000'
            : '#888';
      ctx.fillRect(run.x * SCALE, run.y * SCALE, run.width * SCALE, SCALE);
    }
  }
  return canvas;
}

/** Drifting Mike OS icons on black. Any key, click, touch or real mouse movement ends it. */
export function Screensaver() {
  const active = useScreensaver((s) => s.active);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Wake on input. The waking input is swallowed so it never clicks or types underneath.
  useEffect(() => {
    if (!active) return;
    let origin: { x: number; y: number } | null = null;
    const wake = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      useScreensaver.getState().stop();
    };
    const onMove = (event: PointerEvent) => {
      origin ??= { x: event.clientX, y: event.clientY };
      if (
        Math.hypot(event.clientX - origin.x, event.clientY - origin.y) >
        MOVE_TO_WAKE
      ) {
        useScreensaver.getState().stop();
      }
    };
    for (const type of ACTIVITY) {
      window.addEventListener(type, wake, { capture: true, passive: false });
    }
    window.addEventListener('pointermove', onMove, { capture: true });
    return () => {
      for (const type of ACTIVITY) {
        window.removeEventListener(type, wake, { capture: true });
      }
      window.removeEventListener('pointermove', onMove, { capture: true });
    };
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!active || !canvas || !ctx) return;

    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);
    const images = SPRITE_ICONS.map(renderSprite);
    let sprites: Sprite[] = images.map(() => {
      const speed = 25 + Math.random() * 35;
      const angle = Math.random() * Math.PI * 2;
      return {
        x: Math.random() * Math.max(1, w - SIZE),
        y: Math.random() * Math.max(1, h - SIZE),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      };
    });

    const draw = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = false;
      sprites.forEach((sprite, i) => {
        const image = images[i];
        if (image)
          ctx.drawImage(image, Math.round(sprite.x), Math.round(sprite.y));
      });
    };

    // Reduced motion: a still scene.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw();
      return;
    }

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      sprites = sprites.map((s) => step(s, dt, SIZE, w, h));
      draw();
      frame = requestAnimationFrame(tick);
    };
    draw();
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  if (!active) return null;
  return (
    <div
      className={styles.screensaver}
      aria-hidden="true"
      data-testid="screensaver"
    >
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
