import { useEffect, useMemo, useState } from 'react';
import { PATTERNS } from '../assets/patterns';
import { Alert } from '../ui/Alert';
import { patternDataUri } from '../ui/pixels';
import { Announcer } from './Announcer';
import { Clock } from './Clock';
import { MenuBar } from './menubar/MenuBar';
import { systemMenus } from './menus';
import styles from './OS.module.css';
import { useWindows } from './windows/store';
import { TestWindowContent } from './windows/TestWindowContent';
import { WindowLayer } from './windows/WindowLayer';

type OpenAlert = 'about' | 'shortcuts' | 'restart' | null;

/** The desktop shell: menu bar, patterned desktop and system alerts. */
export function OS() {
  const [alert, setAlert] = useState<OpenAlert>(null);

  const windowCount = useWindows((s) => s.windows.length);
  const activeId = useWindows((s) => s.order.at(-1));

  const menus = useMemo(
    () =>
      systemMenus(
        {
          about: () => setAlert('about'),
          shortcuts: () => setAlert('shortcuts'),
          restart: () => setAlert('restart'),
          newWindow: () => {
            const { opened, open } = useWindows.getState();
            open({ appId: 'test', title: `Untitled ${opened + 1}` });
          },
          closeWindow: () => {
            if (activeId) useWindows.getState().close(activeId);
          },
          nextWindow: () => useWindows.getState().cycle(),
        },
        { hasWindow: activeId !== undefined, windowCount },
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

  // Pattern choice moves to settings in step 8 / Control Panel in step 12.
  const desktopStyle = useMemo(
    () => ({ backgroundImage: patternDataUri(PATTERNS.grey.rows) }),
    [],
  );

  return (
    <div className={styles.screen}>
      <MenuBar menus={menus} end={<Clock />} />

      <main className={styles.desktop} style={desktopStyle}>
        <h1 className="visually-hidden">Mike OS desktop</h1>
        <WindowLayer
          renderContent={(win) => <TestWindowContent title={win.title} />}
        />
      </main>
      <Announcer />

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
