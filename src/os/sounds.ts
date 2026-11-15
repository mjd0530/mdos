import { useSettings } from './settings';

// System sounds are synthesized square-wave blips (original, no audio files; D-003).
// On by default (D-029); Control Panel → Sound turns them off or changes the volume.

export type SoundName =
  'open' | 'close' | 'alert' | 'test' | 'trash' | 'putAway' | 'error';

/** [frequency Hz, start s, duration s, waveform] per note (square unless given). */
type Note = [number, number, number, OscillatorType?];

export const SOUNDS: Record<SoundName, Note[]> = {
  open: [
    [660, 0, 0.05],
    [880, 0.05, 0.07],
  ],
  close: [
    [880, 0, 0.05],
    [660, 0.05, 0.07],
  ],
  alert: [
    [440, 0, 0.09],
    [440, 0.13, 0.09],
  ],
  test: [
    [523, 0, 0.07],
    [659, 0.07, 0.07],
    [784, 0.14, 0.1],
  ],
  // Something tumbling into a tin can: a falling clatter with a low thud at the end.
  trash: [
    [392, 0, 0.04],
    [311, 0.04, 0.04],
    [247, 0.08, 0.04],
    [196, 0.12, 0.05],
    [98, 0.18, 0.12, 'triangle'],
  ],
  // Error alert: a buzzy "eh-ehh!" (original, not a recording of any system beep).
  error: [
    [740, 0, 0.07, 'sawtooth'],
    [740, 0.09, 0.05, 'sawtooth'],
    [370, 0.15, 0.2, 'square'],
  ],
  // Back out again: a quick hop up.
  putAway: [
    [294, 0, 0.05],
    [440, 0.05, 0.05],
    [587, 0.1, 0.08],
  ],
};

let context: AudioContext | undefined;

export function playSound(name: SoundName) {
  const { sounds, volume } = useSettings.getState();
  if (!sounds || volume <= 0 || typeof AudioContext === 'undefined') return;
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
    const now = context.currentTime;
    for (const [frequency, start, duration, type] of SOUNDS[name]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type ?? 'square';
      oscillator.frequency.value = frequency;
      // Square waves are loud: full volume maps to a modest gain.
      gain.gain.setValueAtTime(volume * 0.12, now + start);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + start);
      oscillator.stop(now + start + duration + 0.02);
    }
  } catch {
    /* audio blocked or unavailable: stay silent */
  }
}
