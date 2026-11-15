import { currentMode } from '../../os/device';

let analyser: AnalyserNode | undefined;
let pending: AudioContext | undefined;

/** The Deck's spectrum analyser, once it's set up and running. */
export const getAnalyser = () => analyser;

/** Route the element through `context` into a new analyser. */
function attach(context: AudioContext, el: HTMLAudioElement) {
  try {
    const source = context.createMediaElementSource(el);
    const node = context.createAnalyser();
    node.fftSize = 64;
    node.smoothingTimeConstant = 0.7;
    source.connect(node);
    node.connect(context.destination);
    analyser = node;
  } catch {
    void context.close();
  }
}

/**
 * Route the player's audio through a Web Audio analyser for the spectrum (D-034). Called
 * only from Play, inside the visitor's click or key press. The audio is only routed once
 * the AudioContext is actually running: Chrome starts it running inside a gesture, while
 * Safari and Firefox start it suspended until resume() succeeds, and routing through a
 * suspended context would mute the music. Until then the element plays on its own and
 * the spectrum shows decorative bars. Desktops only: on iOS, Web Audio routing stops
 * background playback, so phones and tablets always get the decorative spectrum.
 */
export function ensureAnalyser(el: HTMLAudioElement) {
  if (analyser) {
    if (analyser.context.state === 'suspended') {
      void (analyser.context as AudioContext).resume();
    }
    return;
  }
  if (pending || currentMode() !== 'desktop') return;
  if (typeof AudioContext === 'undefined') return;
  let context: AudioContext;
  try {
    context = new AudioContext();
  } catch {
    return;
  }
  if (context.state === 'running') {
    attach(context, el);
    return;
  }
  pending = context;
  context
    .resume()
    .then(() => {
      if (context.state === 'running' && !analyser) attach(context, el);
      else void context.close();
    })
    .catch(() => void context.close())
    .finally(() => {
      pending = undefined;
    });
}
