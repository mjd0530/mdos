import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './controls.module.css';

interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  children: ReactNode;
}

/** A native radio button drawn as System 7. Group with a shared `name` inside a
 *  <fieldset> + <legend> so arrow keys and screen readers treat it as one choice. */
export function Radio({ children, className, ...rest }: RadioProps) {
  return (
    <label className={[styles.choice, className].filter(Boolean).join(' ')}>
      <input type="radio" className={styles.radio} {...rest} />
      <span>{children}</span>
    </label>
  );
}
