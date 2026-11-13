import type { ComponentType, ErrorInfo, ReactNode } from 'react';
import { Component, lazy, Suspense, useCallback, useState } from 'react';
import { useWindows, type WindowInstance } from '../os/windows/store';
import { Button } from '../ui/Button';
import { PixelIcon } from '../ui/PixelIcon';
import { APPS, getApp } from './registry';
import type { AppProps } from './types';
import styles from './AppHost.module.css';

// One lazy component per installed app, created once at startup so every render reuses it.
const LAZY_APPS = new Map<string, ComponentType<AppProps>>(
  [...APPS.values()].map((app) => [app.id, lazy(app.load)]),
);

interface AppHostProps {
  win: WindowInstance;
  isActive: boolean;
}

/** Renders an app inside its window: loads it on demand and contains its crashes. */
export function AppHost({ win, isActive }: AppHostProps) {
  // Bumping the key remounts the app (Relaunch after a crash).
  const [generation, setGeneration] = useState(0);
  const app = getApp(win.appId);
  const AppComponent = LAZY_APPS.get(win.appId);
  const windowId = win.id;

  // Stable callbacks: apps may use them in effect dependencies.
  const setTitle = useCallback(
    (title: string) => useWindows.getState().setTitle(windowId, title),
    [windowId],
  );
  const close = useCallback(
    () => useWindows.getState().close(windowId),
    [windowId],
  );

  if (!app || !AppComponent) {
    return (
      <Message icon="document" title="Can't open this window">
        No application called “{win.appId}” is installed.
      </Message>
    );
  }

  return (
    <CrashBoundary
      key={generation}
      appName={app.name}
      onRelaunch={() => setGeneration((g) => g + 1)}
      onClose={close}
    >
      <Suspense fallback={<Loading name={app.name} />}>
        {/* oxlint-disable-next-line react/static-components -- created once in LAZY_APPS; this only picks one */}
        <AppComponent
          instanceId={win.id}
          payload={win.payload}
          isActive={isActive}
          setTitle={setTitle}
          close={close}
        />
      </Suspense>
    </CrashBoundary>
  );
}

function Loading({ name }: { name: string }) {
  return (
    <p className={styles.loading} role="status">
      Opening {name}…
    </p>
  );
}

function Message({
  icon,
  title,
  children,
  actions,
}: {
  icon: 'document' | 'computer';
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.message} role="alert">
      <PixelIcon name={icon} />
      <div>
        <p className={styles.messageTitle}>{title}</p>
        <p>{children}</p>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}

interface CrashBoundaryProps {
  appName: string;
  children: ReactNode;
  onRelaunch: () => void;
  onClose: () => void;
}

/** A crash stays inside its window, System 7 style, with a way to relaunch. */
class CrashBoundary extends Component<
  CrashBoundaryProps,
  { crashed: boolean }
> {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`${this.props.appName} crashed`, error, info.componentStack);
  }

  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <Message
        icon="computer"
        title={`The application “${this.props.appName}” has unexpectedly quit.`}
        actions={
          <>
            <Button onClick={this.props.onClose}>Close</Button>
            <Button isDefault onClick={this.props.onRelaunch}>
              Relaunch
            </Button>
          </>
        }
      >
        The rest of MDOS is fine.
      </Message>
    );
  }
}
