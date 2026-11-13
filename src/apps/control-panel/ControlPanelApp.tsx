import {
  PATTERNS,
  patternImage,
  type PatternName,
} from '../../assets/patterns';
import { announce } from '../../os/announce';
import {
  HIGHLIGHTS,
  SCREENSAVER_MINUTES,
  useSettings,
  type HighlightName,
  type ScreensaverMinutes,
} from '../../os/settings';
import { playSound } from '../../os/sounds';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { Radio } from '../../ui/Radio';
import styles from './ControlPanelApp.module.css';

const PATTERN_NAMES = Object.keys(PATTERNS) as PatternName[];
/** Four patterns shown together on the Random swatch. */
const RANDOM_SWATCH: PatternName[] = ['bricks', 'stars', 'gingham', 'weave'];
const HIGHLIGHT_NAMES = Object.keys(HIGHLIGHTS) as HighlightName[];

/** Visitor preferences. Every change applies immediately and is remembered (D-025). */
export default function ControlPanelApp() {
  const settings = useSettings();

  return (
    <div className={styles.panel}>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Monitors</legend>
        <div className={styles.rows}>
          <Radio
            name="display"
            checked={settings.display === 'color'}
            onChange={() => {
              settings.set('display', 'color');
              announce('Colors');
            }}
          >
            Colors
          </Radio>
          <Radio
            name="display"
            checked={settings.display === 'bw'}
            onChange={() => {
              settings.set('display', 'bw');
              announce('Black and white');
            }}
          >
            Black &amp; White
          </Radio>
        </div>
      </fieldset>

      {settings.display === 'color' && (
        <fieldset className={styles.group}>
          <legend className={styles.legend}>Highlight Color</legend>
          <div className={styles.patterns}>
            {HIGHLIGHT_NAMES.map((name) => (
              <label key={name} className={styles.pattern}>
                <input
                  type="radio"
                  name="highlight"
                  value={name}
                  checked={settings.highlight === name}
                  onChange={() => settings.set('highlight', name)}
                  className={styles.patternInput}
                />
                <span
                  className={`${styles.swatch} ${styles.highlightSwatch}`}
                  style={{ backgroundColor: HIGHLIGHTS[name].color }}
                  aria-hidden="true"
                />
                <span>{HIGHLIGHTS[name].name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Desktop Pattern</legend>
        <div className={styles.patterns}>
          <label className={styles.pattern}>
            <input
              type="radio"
              name="desktop-pattern"
              value="random"
              checked={settings.pattern === 'random'}
              onChange={() => settings.set('pattern', 'random')}
              className={styles.patternInput}
            />
            <span
              className={`${styles.swatch} ${styles.randomSwatch}`}
              aria-hidden="true"
            >
              {RANDOM_SWATCH.map((name) => (
                <span
                  key={name}
                  style={{
                    backgroundImage: patternImage(name, settings.display),
                  }}
                />
              ))}
            </span>
            <span>Random</span>
          </label>
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
                style={{
                  backgroundImage: patternImage(name, settings.display),
                }}
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

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Screensaver</legend>
        <div className={styles.rows}>
          <Checkbox
            checked={settings.screensaver}
            onChange={(event) =>
              settings.set('screensaver', event.target.checked)
            }
          >
            Start when idle
          </Checkbox>
          <label className={styles.field}>
            After
            <select
              className={styles.select}
              value={settings.screensaverMinutes}
              disabled={!settings.screensaver}
              onChange={(event) =>
                settings.set(
                  'screensaverMinutes',
                  Number(event.target.value) as ScreensaverMinutes,
                )
              }
            >
              {SCREENSAVER_MINUTES.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes === 1 ? '1 minute' : `${minutes} minutes`}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Pointer</legend>
        <Checkbox
          checked={settings.cursorClock}
          onChange={(event) =>
            settings.set('cursorClock', event.target.checked)
          }
        >
          Clock follows the pointer
        </Checkbox>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Sound</legend>
        <div className={styles.rows}>
          <Checkbox
            checked={settings.sounds}
            onChange={(event) => {
              settings.set('sounds', event.target.checked);
              if (event.target.checked) playSound('test');
            }}
          >
            System sounds
          </Checkbox>
          <label className={styles.field}>
            Volume
            <input
              type="range"
              className={styles.range}
              min={0}
              max={1}
              step={0.1}
              value={settings.volume}
              disabled={!settings.sounds}
              onChange={(event) =>
                settings.set('volume', Number(event.target.value))
              }
              onPointerUp={() => playSound('test')}
              onKeyUp={() => playSound('test')}
            />
          </label>
        </div>
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
