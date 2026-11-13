import type { CSSProperties } from 'react';
import { useState } from 'react';
import { ICONS, type IconName } from '../assets/icons/icons';
import { PATTERNS, patternImage, type PatternName } from '../assets/patterns';
import { useDisplay } from '../os/display';
import { PixelIcon } from '../ui/PixelIcon';
import styles from './Artwork.module.css';

const ICON_LABELS: Record<IconName, string> = {
  folder: 'Folder',
  document: 'Document',
  image: 'Picture',
  trash: 'Trash',
  notes: 'Notes',
  files: 'Files',
  weather: 'Weather',
  computer: 'MDOS',
  controlPanel: 'Control Panel',
  link: 'Link',
  player: 'Music player',
  weatherClear: 'Clear',
  weatherNight: 'Clear night',
  weatherCloudy: 'Cloudy',
  weatherRain: 'Rain',
  weatherSnow: 'Snow',
  weatherStorm: 'Storm',
};

const ICON_NAMES = Object.keys(ICONS) as IconName[];
const PATTERN_NAMES = Object.keys(PATTERNS) as PatternName[];

function patternStyle(
  name: PatternName,
  display: 'color' | 'bw',
): CSSProperties {
  return { backgroundImage: patternImage(name, display) };
}

export function Artwork() {
  const [pattern, setPattern] = useState<PatternName>('grey');
  const display = useDisplay();

  return (
    <>
      <section className={styles.section} aria-labelledby="icons-title">
        <h2 id="icons-title" className={styles.heading}>
          Icons
        </h2>
        <p className={styles.note}>
          Ten original 32×32 icons, shown at 1× and 2×, normal and selected
          (System 7 inverts a selected icon). Drawn as text in
          src/assets/icons/icons.ts.
        </p>
        <div className={styles.iconTable}>
          {ICON_NAMES.map((name) => (
            <figure key={name} className={styles.iconCell}>
              <div className={styles.iconRow}>
                <PixelIcon name={name} />
                <PixelIcon name={name} selected />
                <PixelIcon name={name} scale={2} />
              </div>
              <figcaption>{ICON_LABELS[name]}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="patterns-title">
        <h2 id="patterns-title" className={styles.heading}>
          Desktop patterns
        </h2>
        <p className={styles.note}>
          Ten original 8×8 patterns. Choose one to preview it behind desktop
          icons. The desktop shows a random one each visit.
        </p>

        <fieldset className={styles.patternPicker}>
          <legend className={styles.legend}>Pattern</legend>
          {PATTERN_NAMES.map((name) => (
            <label key={name} className={styles.patternOption}>
              <input
                type="radio"
                name="pattern"
                value={name}
                checked={pattern === name}
                onChange={() => setPattern(name)}
              />
              <span
                className={styles.swatch}
                style={patternStyle(name, display)}
                aria-hidden="true"
              />
              {PATTERNS[name].name}
            </label>
          ))}
        </fieldset>

        <div
          className={styles.desktop}
          style={patternStyle(pattern, display)}
          aria-label={`Preview of the ${PATTERNS[pattern].name} pattern`}
          role="img"
        >
          {(
            ['folder', 'document', 'image', 'files', 'trash'] as IconName[]
          ).map((name, i) => (
            <div key={name} className={styles.desktopIcon}>
              <PixelIcon name={name} selected={i === 1} />
              <span className={i === 1 ? styles.labelSelected : styles.label}>
                {i === 1 ? 'Read Me' : ICON_LABELS[name]}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
