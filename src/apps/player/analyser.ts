import { currentMode } from '../../os/device';

let analyser: AnalyserNode | undefined;

/** The Deck's spectrum analyser, if one has been set up. */
export const getAnalyser = () => analyser;

/**
 * Route the player's audio through a Web Audio analyser for the spectrum (D-034). Called
 * only from Play, inside the visitor's click or key press, so the AudioContext starts
 * running: created any other time it could start suspended and mute the music. Desktops
 * only: on iOS, Web Audio routing stops background playback, so phones and tablets get
 * a decorative spectrum instead.
 */
export function ensureAnalyser(el: HTMLAudioElement) {
  if (analyser) {
    if (analyser.context.state === 'suspended') {
      void (analyser.context as AudioContext).resume();
    }
    return;
  }
  if (currentMode() !== 'desktop' || typeof AudioContext === 'undefined')
    return;
  try {
    const context = new AudioContext();
    if (context.state !== 'running') {
      // Not allowed to start: leave the audio element playing on its own.
      void context.close();
      return;
    }
    const source = context.createMediaElementSource(el);
    analyser = context.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);
    analyser.connect(context.destination);
  } catch {
    analyser = undefined;
  }
}
