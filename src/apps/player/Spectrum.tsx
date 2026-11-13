import { useEffect, useRef } from 'react';
import { currentMode } from '../../os/device';
import { audioElement, usePlayer } from './playerStore';

const BARS = 14;
const HEIGHT = 8; // blocks per bar

let analyser: AnalyserNode | undefined;

/**
 * A real analyser on desktops. Phones and tablets get a decorative stand-in instead:
 * routing the audio through Web Audio stops background playback on iOS (D-034).
 */
function getAnalyser(): AnalyserNode | undefined {
  if (analyser) return analyser;
  if (currentMode() !== 'desktop' || typeof AudioContext === 'undefined') {
    return undefined;
  }
  try {
    const context = new AudioContext();
    const source = context.createMediaElementSource(audioElement());
    analyser = context.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);
    analyser.connect(context.destination);
    return analyser;
  } catch {
    return undefined;
  }
}

/** Decorative spectrum bars in the Deck's display. Hidden from screen readers. */
export function Spectrum({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playing = usePlayer((s) => s.playing);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const color = getComputedStyle(canvas).color;
    const levels = new Array<number>(BARS).fill(0);
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const node = playing ? getAnalyser() : undefined;
    if (node?.context.state === 'suspended')
      void (node.context as AudioContext).resume();
    const data = new Uint8Array(node?.frequencyBinCount ?? 0);
    let frame = 0;
    let tick = 0;

    const draw = () => {
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
      ctx.fillStyle = color;
      for (let i = 0; i < BARS; i++) {
        const blocks = Math.round((levels[i] ?? 0) * HEIGHT);
        for (let b = 0; b < blocks; b++) {
          ctx.fillRect(i * 4, (HEIGHT - 1 - b) * 3, 3, 2);
        }
      }
      if (playing && !still) frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [playing]);

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
