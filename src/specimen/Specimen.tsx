import type { CSSProperties } from 'react';
import { useApplyDisplay } from '../os/display';
import { useSettings } from '../os/settings';
import { Radio } from '../ui/Radio';
import { Artwork } from './Artwork';
import { Controls } from './Controls';
import styles from './Specimen.module.css';

// Step 2 design specimen (dev only: /specimen.html). Each option pairs a "system" face
// (menus, titles, buttons) with a "document" face (reading text), rendered in
// mock System 7 chrome so the fonts are judged in context.

interface Option {
  id: string;
  label: string;
  system: { family: string; weight: number; size: number };
  document: { family: string; weight: number; size: number };
  note: string;
}

// Chosen pairing (D-014). Other candidates were compared on 2026-11-10 and removed.
const OPTIONS: Option[] = [
  {
    id: 'type',
    label: 'Pixel Operator HB + Pixel Operator',
    system: { family: 'Pixel Operator HB', weight: 400, size: 16 },
    document: { family: 'Pixel Operator', weight: 400, size: 16 },
    note: 'Heavy bold for menus, titles and buttons; regular for reading. CC0.',
  },
];

const MENUS = ['File', 'Edit', 'View', 'Special', 'Help'];

// Neutral sample copy: specimen text must not state facts about Mike's work.
const BODY =
  'Sample paragraph. A case study opens here as a document: the challenge, the process and what changed, with images in between. How does this read over a few lines of real-length text?';

function vars(option: Option): CSSProperties {
  return {
    '--sys-family': `'${option.system.family}', monospace`,
    '--sys-weight': option.system.weight,
    '--sys-size': `${option.system.size}px`,
    '--doc-family': `'${option.document.family}', monospace`,
    '--doc-weight': option.document.weight,
    '--doc-size': `${option.document.size}px`,
  } as CSSProperties;
}

export function Specimen() {
  useApplyDisplay();
  const display = useSettings((s) => s.display);
  const set = useSettings((s) => s.set);
  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <h1>MDOS design specimen</h1>
        <fieldset className={styles.displaySwitch}>
          <legend>Monitors</legend>
          <Radio
            name="specimen-display"
            checked={display === 'color'}
            onChange={() => set('display', 'color')}
          >
            Colors
          </Radio>
          <Radio
            name="specimen-display"
            checked={display === 'bw'}
            onChange={() => set('display', 'bw')}
          >
            Black &amp; White
          </Radio>
        </fieldset>
        <p>
          The System 7 building blocks, shown in context. Fonts first; icons,
          patterns and controls are added as step 2 continues. View at 100%
          zoom: pixel fonts are drawn for exact sizes.
        </p>
      </header>

      {OPTIONS.map((option) => (
        <section
          key={option.id}
          className={styles.option}
          style={vars(option)}
          aria-labelledby={`opt-${option.id}`}
        >
          <h2 id={`opt-${option.id}`} className={styles.optionLabel}>
            {option.label}
          </h2>
          <p className={styles.optionNote}>{option.note}</p>

          <div className={styles.screen}>
            <div className={styles.menubar} aria-hidden="true">
              <span className={styles.mark}>◆</span>
              {MENUS.map((m) => (
                <span key={m} className={styles.menu}>
                  {m}
                </span>
              ))}
              <span className={styles.clock}>3:42 PM</span>
            </div>

            <div className={styles.desktop}>
              <div className={styles.window} aria-hidden="true">
                <div className={styles.titlebar}>
                  <span className={styles.box} />
                  <span className={styles.title}>Magic Move</span>
                  <span className={styles.box} />
                </div>
                <div className={styles.doc}>
                  <p className={styles.docHeading}>Smart Share / Magic Move</p>
                  <p className={styles.docMeta}>
                    Role · Client · Years (sample metadata)
                  </p>
                  <p>{BODY}</p>
                  <p className={styles.glyphs}>
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ
                    <br />
                    abcdefghijklmnopqrstuvwxyz
                    <br />
                    0123456789 &amp; . , : ; ! ? ’ “ ” ( ) – —
                  </p>
                </div>
              </div>

              <div className={styles.dialog} aria-hidden="true">
                <p className={styles.dialogText}>
                  Restart MDOS? Your open windows will close.
                </p>
                <div className={styles.buttons}>
                  <span className={styles.button}>Cancel</span>
                  <span className={`${styles.button} ${styles.default}`}>
                    Restart
                  </span>
                </div>
              </div>

              <div className={styles.icons} aria-hidden="true">
                {['Portfolio', 'Sketchbook', 'About Mike', 'Read Me'].map(
                  (name) => (
                    <span key={name} className={styles.iconLabel}>
                      {name}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>
      ))}

      <Artwork />
      <Controls />
    </main>
  );
}
