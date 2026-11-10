import type { ButtonHTMLAttributes } from 'react';
import styles from './controls.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The default button wears System 7's thick ring and answers the Return key
   *  (the dialog wires Return to it; this component only draws it). */
  isDefault?: boolean;
}

export function Button({
  isDefault = false,
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, isDefault && styles.default, className]
    .filter(Boolean)
    .join(' ');
  return <button type={type} className={classes} {...rest} />;
}
