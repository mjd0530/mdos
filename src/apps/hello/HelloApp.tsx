import { useState } from 'react';
import type { AppProps } from '../types';
import { Button } from '../../ui/Button';
import styles from './HelloApp.module.css';

export default function HelloApp({ instanceId, isActive }: AppProps) {
  const [crash, setCrash] = useState(false);
  if (crash) throw new Error('Hello was asked to crash');

  return (
    <div className={styles.page}>
      <p>
        <strong>Hello</strong> is a test app running in window {instanceId}
        {isActive ? ' (the active window)' : ''}. Drag the title bar to move it,
        drag the bottom-right box to resize it, and try the close, zoom and
        collapse boxes.
      </p>
      <p>
        Keyboard: focus the title (Tab), then use arrow keys to move and
        Shift+arrow keys to resize. Ctrl+` switches between windows.
      </p>
      <p>
        <Button onClick={() => setCrash(true)}>Simulate a crash</Button>
      </p>
      {Array.from({ length: 20 }, (_, i) => (
        <p key={i} className={styles.line}>
          Line {i + 1}. This line is deliberately long so the window needs a
          horizontal scroll bar as well as a vertical one.
        </p>
      ))}
    </div>
  );
}
