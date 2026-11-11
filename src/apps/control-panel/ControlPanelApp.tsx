import { PATTERNS, type PatternName } from '../../assets/patterns';
import { announce } from '../../os/announce';
import { useSettings } from '../../os/settings';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { patternDataUri } from '../../ui/pixels';
import styles from './ControlPanelApp.module.css';

const PATTERN_NAMES = Object.keys(PATTERNS) as PatternName[];

/** Visitor preferences. Every change applies immediately and is remembered (D-025). */
export default function ControlPanelApp() {
  const settings = useSettings();

  return (
    <div className={styles.panel}>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Desktop Pattern</legend>
        <div className={styles.patterns}>
          {PATTERN_NAMES.map((name) => (
            <label key={name} className={styles.pattern}>
              <input
                type="radio"
                name="desktop-pattern"
                value={name}
                checked={settings.pattern === name}
                onChange={() => settings.set('pattern', name)}
                className={styles.patternInput}
              />
              <span
                className={styles.swatch}
                style={{ backgroundImage: patternDataUri(PATTERNS[name].rows) }}
                aria-hidden="true"
              />
              <span>{PATTERNS[name].name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Clock</legend>
        <Checkbox
          checked={settings.clock24h}
          onChange={(event) => settings.set('clock24h', event.target.checked)}
        >
          24-hour time
        </Checkbox>
      </fieldset>

      <div className={styles.actions}>
        <Button
          onClick={() => {
            settings.restoreDefaults();
            announce('Settings restored to their defaults');
          }}
        >
          Restore Defaults
        </Button>
      </div>
    </div>
  );
}
