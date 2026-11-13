import type { ComponentType } from 'react';
import type { IconName } from '../assets/icons/icons';
import type { Size } from '../os/windows/geometry';

/** What every app component receives. Apps render content only; the Window owns chrome. */
export interface AppProps<Payload = unknown> {
  instanceId: string;
  payload: Payload | undefined;
  /** Is this app's window the front one? */
  isActive: boolean;
  setTitle: (title: string) => void;
  close: () => void;
}

/**
 * How many windows an app may have:
 * - single: one window; launching again brings it forward (Control Panel).
 * - multiple: a new window each time (a test app, Stickies).
 * - per-document: one window per payload key; opening the same file again focuses it (Notes).
 */
export type InstanceRule = 'single' | 'multiple' | 'per-document';

export interface AppDefinition<Payload = unknown> {
  id: string;
  name: string;
  icon: IconName;
  instances: InstanceRule;
  window?: {
    size?: Size;
    minSize?: Size;
    /** 'none': free-standing (D-035). No title bar, frame or scroll bars: the app draws
     *  its own shape and uses useWindowFrame() for its drag grip and close button. Never
     *  zoomed; centred on phones. */
    frame?: 'system' | 'none';
  };
  /** Listed in the M menu (like System 7's Apple menu items). */
  inMarkMenu?: boolean;
  /** For per-document apps: a stable key for a payload (e.g. its file id). */
  documentKey?: (payload: Payload) => string;
  /** Window title for a payload (defaults to the app name). */
  title?: (payload: Payload | undefined) => string;
  /** Code-split: the component loads the first time the app opens. */
  load: () => Promise<{ default: ComponentType<AppProps<Payload>> }>;
}

/** Identity function that gives app definitions full type-checking. */
export function defineApp<Payload = unknown>(
  definition: AppDefinition<Payload>,
): AppDefinition<Payload> {
  return definition;
}
