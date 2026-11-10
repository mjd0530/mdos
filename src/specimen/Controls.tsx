import { useState } from 'react';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Radio } from '../ui/Radio';
import chrome from '../ui/chrome.module.css';
import styles from './Controls.module.css';

const LINES = Array.from(
  { length: 14 },
  (_, i) =>
    `Line ${i + 1}. Sample text that runs wide enough to need a horizontal scroll bar in this narrow window.`,
);

function SampleWindow({ title, active }: { title: string; active: boolean }) {
  return (
    <div
      className={`${chrome.window} ${active ? '' : chrome.inactive} ${styles.window}`}
    >
      <div className={chrome.titleBar}>
        <button
          type="button"
          className={`${chrome.titleBox} ${chrome.closeBox}`}
          aria-label={`Close ${title}`}
        />
        <h3 className={chrome.title}>{title}</h3>
        <button
          type="button"
          className={`${chrome.titleBox} ${chrome.zoomBox}`}
          aria-label={`Zoom ${title}`}
        />
        <button
          type="button"
          className={`${chrome.titleBox} ${chrome.collapseBox}`}
          aria-label={`Collapse ${title}`}
        />
      </div>
      <div className={`${chrome.content} ${styles.windowContent}`} tabIndex={0}>
        {LINES.map((line) => (
          <p key={line} className={styles.line}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

export function Controls() {
  const [sounds, setSounds] = useState(true);
  const [clock, setClock] = useState(false);
  const [size, setSize] = useState('medium');

  return (
    <section className={styles.section} aria-labelledby="controls-title">
      <h2 id="controls-title" className={styles.heading}>
        Controls and chrome
      </h2>
      <p className={styles.note}>
        Real, keyboard-operable controls drawn with pixel art. Press and hold to
        see pressed states; Tab to see focus.
      </p>

      <div className={styles.grid}>
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Buttons</h3>
          <div className={styles.row}>
            <Button>Cancel</Button>
            <Button isDefault>OK</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>

        <fieldset className={styles.panel}>
          <legend className={styles.panelTitle}>Checkboxes</legend>
          <div className={styles.stack}>
            <Checkbox
              checked={sounds}
              onChange={(e) => setSounds(e.target.checked)}
            >
              System sounds
            </Checkbox>
            <Checkbox
              checked={clock}
              onChange={(e) => setClock(e.target.checked)}
            >
              Cursor clock
            </Checkbox>
            <Checkbox disabled>Unavailable</Checkbox>
          </div>
        </fieldset>

        <fieldset className={styles.panel}>
          <legend className={styles.panelTitle}>Icon size</legend>
          <div className={styles.stack}>
            {['small', 'medium', 'large'].map((value) => (
              <Radio
                key={value}
                name="icon-size"
                value={value}
                checked={size === value}
                onChange={() => setSize(value)}
              >
                {value[0]?.toUpperCase() + value.slice(1)}
              </Radio>
            ))}
          </div>
        </fieldset>

        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Menu</h3>
          <ul className={chrome.menu} aria-label="Sample File menu">
            <li className={chrome.menuItem}>
              New Folder <span className={chrome.shortcut}>⌘N</span>
            </li>
            <li className={`${chrome.menuItem} ${chrome.menuItemActive}`}>
              Open <span className={chrome.shortcut}>⌘O</span>
            </li>
            <li className={chrome.menuItem} aria-disabled="true">
              Print <span className={chrome.shortcut}>⌘P</span>
            </li>
            <li className={chrome.separator} aria-hidden="true" />
            <li className={chrome.menuItem}>
              Close Window <span className={chrome.shortcut}>⌘W</span>
            </li>
          </ul>
        </div>
      </div>

      <h3 className={styles.panelTitle}>Windows: active and inactive</h3>
      <div className={styles.windows}>
        <SampleWindow title="Read Me" active />
        <SampleWindow title="Portfolio" active={false} />
      </div>
    </section>
  );
}
