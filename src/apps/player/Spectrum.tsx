import { useEffect, useRef } from 'react';
import { useDisplay } from '../../os/display';
import { getAnalyser } from './analyser';
import { usePlayer } from './playerStore';

const BARS = 14;
const HEIGHT = 8; // blocks per bar

/** Decorative spectrum bars in the Deck's display. Hidden from screen readers. */
export function Spectrum({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playing = usePlayer((s) => s.playing);
  // Bar colour comes from the LCD token, which changes with Colors / Black & White.
  const display = useDisplay();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const levels = new Array<number>(BARS).fill(0);
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let data = new Uint8Array(0);
    let frame = 0;
    let tick = 0;

    const draw = () => {
      // Looked up each frame: in Safari and Firefox the analyser attaches a moment
      // after playback starts.
      const node = playing ? getAnalyser() : undefined;
      if (node && data.length !== node.frequencyBinCount) {
        data = new Uint8Array(node.frequencyBinCount);
      }
      if (playing && node) {
        node.getByteFrequencyData(data);
        for (let i = 0; i < BARS; i++) levels[i] = (data[i + 1] ?? 0) / 255;
      } else if (playing) {
        tick++;
        for (let i = 0; i < BARS; i++) {
          levels[i] =
            0.35 + 0.3 * Math.sin(tick / 9 + i * 1.3) * Math.cos(tick / 23 + i);
        }
      } else {
        levels.fill(0);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Read each frame: the display's tokens are applied by an effect that runs after
      // this one, so a colour read up front would be the old one.
      ctx.fillStyle = getComputedStyle(canvas).color;
      for (let i = 0; i < BARS; i++) {
        const blocks = Math.round((levels[i] ?? 0) * HEIGHT);
        for (let b = 0; b < blocks; b++) {
          ctx.fillRect(i * 4, (HEIGHT - 1 - b) * 3, 3, 2);
        }
      }
      if (playing && !still) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [playing, display]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={BARS * 4 - 1}
      height={HEIGHT * 3}
      aria-hidden="true"
    />
  );
}
