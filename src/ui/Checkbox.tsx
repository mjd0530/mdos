import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './controls.module.css';

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  children: ReactNode;
}

/** A native checkbox drawn as System 7 (an X when checked). The whole label is clickable. */
export function Checkbox({ children, className, ...rest }: CheckboxProps) {
  return (
    <label className={[styles.choice, className].filter(Boolean).join(' ')}>
      <input type="checkbox" className={styles.checkbox} {...rest} />
      <span>{children}</span>
    </label>
  );
}
