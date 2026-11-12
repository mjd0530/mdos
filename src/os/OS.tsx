import { useEffect, useMemo, useState } from 'react';
import { PATTERNS } from '../assets/patterns';
import { Alert } from '../ui/Alert';
import { patternDataUri } from '../ui/pixels';
import { APPS } from '../apps/registry';
import { launch } from '../apps/launch';
import { announce } from './announce';
import { Announcer } from './Announcer';
import { Clock } from './Clock';
import { CursorClock } from './CursorClock';
import { Screensaver } from './Screensaver';
import { useIdleScreensaver, useScreensaver } from './screensaverState';
import { useDesktop } from './desktopStore';
import { DesktopIcons } from './DesktopIcons';
import { MenuBar } from './menubar/MenuBar';
import { clearSaved } from './persist';
import { useDeviceMode } from './device';
import { useSettings } from './settings';
import { systemMenus } from './menus';
import styles from './OS.module.css';
import { useWindows } from './windows/store';
import { WindowLayer } from './windows/WindowLayer';

const MARK_MENU_APPS = [...APPS.values()]
  .filter((app) => app.inMarkMenu)
  .map(({ id, name }) => ({ id, name }));

type OpenAlert = 'about' | 'shortcuts' | 'restart' | 'reset' | null;

/** The desktop shell: menu bar, patterned desktop and system alerts. */
export function OS() {
  const [alert, setAlert] = useState<OpenAlert>(null);

  const device = useDeviceMode();
  useIdleScreensaver();
  // Phones and tablets open windows zoomed; the desktop cascades them.
  useEffect(() => {
    useWindows.getState().setOpenZoomed(device !== 'desktop');
  }, [device]);

  const windowCount = useWindows((s) => s.windows.length);
  const activeId = useWindows((s) => s.order.at(-1));

  const menus = useMemo(
    () =>
      systemMenus(
        {
          about: () => setAlert('about'),
          shortcuts: () => setAlert('shortcuts'),
          restart: () => setAlert('restart'),
          launch: (appId) => launch(appId),
          closeWindow: () => {
            if (activeId) useWindows.getState().close(activeId);
          },
          nextWindow: () => useWindows.getState().cycle(),
          cleanUp: () => useDesktop.getState().cleanUp(),
          resetDesktop: () => setAlert('reset'),
          plainVersion: () => {
            window.location.href = `${import.meta.env.BASE_URL}plain/`;
          },
          // After this click finishes, so the click itself doesn't wake it.
          startScreensaver: () =>
            window.setTimeout(() => useScreensaver.getState().start(), 50),
        },
        {
          hasWindow: activeId !== undefined,
          windowCount,
          markMenuApps: MARK_MENU_APPS,
        },
      ),
    [activeId, windowCount],
  );

  // Ctrl+` cycles windows (Shift reverses). ⌘` is taken by macOS for browser windows.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        event.code === 'Backquote'
      ) {
        event.preventDefault();
        useWindows.getState().cycle(event.shiftKey ? -1 : 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // The visitor's chosen desktop pattern (Control Panel).
  const pattern = useSettings((s) => s.pattern);
  const desktopStyle = useMemo(
    () => ({ backgroundImage: patternDataUri(PATTERNS[pattern].rows) }),
    [pattern],
  );

  return (
    <div className={styles.screen} data-device={device}>
      <MenuBar menus={menus} end={<Clock />} />

      <main className={styles.desktop} style={desktopStyle}>
        <h1 className="visually-hidden">Mike OS desktop</h1>
        <DesktopIcons />
        <WindowLayer />
      </main>
      <Announcer />
      <CursorClock />
      <Screensaver />

      <Alert
        open={alert === 'about'}
        title="Mike OS"
        onClose={() => setAlert(null)}
      >
        <p>Version {__APP_VERSION__}</p>
        <p>A portfolio by Mike DeMar, as a desktop computer you can explore.</p>
        <p>
          Inspired by the Macintosh System 7 interface; not affiliated with
          Apple. Type: Pixel Operator by Jayvee Enaguas (CC0).
        </p>
      </Alert>

      <Alert
        open={alert === 'shortcuts'}
        title="Keyboard shortcuts"
        onClose={() => setAlert(null)}
      >
        <ul className={styles.shortcutList}>
          <li>Tab: move to the menu bar, then to the desktop</li>
          <li>← →: move between menus</li>
          <li>↓ or Enter: open a menu</li>
          <li>↑ ↓: choose an item; Enter selects it</li>
          <li>Esc: close a menu or alert</li>
          <li>Ctrl+`: next window (add Shift for the previous one)</li>
          <li>Window title focused: arrows move, Shift+arrows resize</li>
        </ul>
      </Alert>

      <Alert
        open={alert === 'reset'}
        title="Reset the desktop?"
        buttons={[
          { value: 'cancel', label: 'Cancel' },
          { value: 'reset', label: 'Reset', isDefault: true },
        ]}
        onClose={(value) => {
          setAlert(null);
          if (value !== 'reset') return;
          useWindows.getState().forgetAll();
          useDesktop.getState().cleanUp();
          useSettings.getState().restoreDefaults();
          clearSaved();
          announce('Desktop reset');
        }}
      >
        <p>
          All windows close, icons and windows go back to where they started,
          and Control Panel settings return to their defaults.
        </p>
      </Alert>

      <Alert
        open={alert === 'restart'}
        title="Restart Mike OS?"
        buttons={[
          { value: 'cancel', label: 'Cancel' },
          { value: 'restart', label: 'Restart', isDefault: true },
        ]}
        onClose={(value) => {
          setAlert(null);
          if (value === 'restart') window.location.reload();
        }}
      >
        <p>Any open windows will close.</p>
      </Alert>
    </div>
  );
}
