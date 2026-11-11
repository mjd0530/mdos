import { useWindows } from '../os/windows/store';
import { getApp } from './registry';
import type { AppDefinition } from './types';

/** Decide which existing window (if any) a launch should bring forward instead of opening. */
export function findExistingWindow(
  app: AppDefinition,
  payload: unknown,
  windows: readonly { id: string; appId: string; key?: string }[],
): string | undefined {
  const mine = windows.filter((w) => w.appId === app.id);
  if (app.instances === 'single') return mine[0]?.id;
  if (app.instances === 'per-document' && app.documentKey) {
    const key = app.documentKey(payload);
    return mine.find((w) => w.key === key)?.id;
  }
  return undefined;
}

/** Open an app (or bring its existing window forward). Returns the window id. */
export function launch(appId: string, payload?: unknown): string | undefined {
  const app = getApp(appId);
  if (!app) {
    console.error(`launch: unknown app "${appId}"`);
    return undefined;
  }
  const windows = useWindows.getState();
  const existing = findExistingWindow(app, payload, windows.windows);
  if (existing) {
    windows.focus(existing);
    return existing;
  }
  const title =
    app.title?.(payload) ??
    (app.instances === 'multiple'
      ? `${app.name} ${windows.opened + 1}`
      : app.name);
  return windows.open({
    appId: app.id,
    title,
    size: app.window?.size,
    minSize: app.window?.minSize,
    payload,
    // Keyed windows reuse their last position: one per document, or the single window.
    key:
      app.instances === 'per-document'
        ? app.documentKey?.(payload)
        : app.instances === 'single'
          ? app.id
          : undefined,
  });
}
