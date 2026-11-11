import { useSettings } from './settings';

// System sounds are synthesized square-wave blips (original, no audio files; D-003).
// Off by default; nothing plays until a visitor turns sounds on in Control Panel.

export type SoundName = 'open' | 'close' | 'alert' | 'test';

/** [frequency Hz, start s, duration s] per note. */
const SOUNDS: Record<SoundName, [number, number, number][]> = {
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
};

let context: AudioContext | undefined;

export function playSound(name: SoundName) {
  const { sounds, volume } = useSettings.getState();
  if (!sounds || volume <= 0 || typeof AudioContext === 'undefined') return;
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
    const now = context.currentTime;
    for (const [frequency, start, duration] of SOUNDS[name]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'square';
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
