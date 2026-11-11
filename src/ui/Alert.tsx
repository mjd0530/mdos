import type { ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';
import type { IconName } from '../assets/icons/icons';
import { playSound } from '../os/sounds';
import { Button } from './Button';
import { PixelIcon } from './PixelIcon';
import styles from './Alert.module.css';

export interface AlertButton {
  value: string;
  label: string;
  isDefault?: boolean;
}

interface AlertProps {
  open: boolean;
  /** Accessible name of the dialog (also shown as the bold first line). */
  title: string;
  icon?: IconName;
  children?: ReactNode;
  buttons?: AlertButton[];
  /** Called with the chosen button's value, or null for Esc. */
  onClose: (value: string | null) => void;
}

/**
 * A System 7 modal alert built on <dialog>: the browser traps focus, makes the rest of the
 * page inert, closes on Esc and returns focus to whatever opened it. Return presses the
 * default button.
 */
export function Alert({
  open,
  title,
  icon = 'computer',
  children,
  buttons = [{ value: 'ok', label: 'OK', isDefault: true }],
  onClose,
}: AlertProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      playSound('alert');
      // showModal() focuses the first button; System 7 puts Return on the default one.
      dialog.querySelector<HTMLButtonElement>('[data-default]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.alert}
      aria-labelledby={titleId}
      aria-describedby={children ? bodyId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose(null);
      }}
    >
      <form
        method="dialog"
        className={styles.layout}
        onSubmit={(event) => {
          event.preventDefault();
          const submitter = (event.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement | null;
          onClose(
            submitter?.value ?? buttons.find((b) => b.isDefault)?.value ?? null,
          );
        }}
      >
        <PixelIcon name={icon} className={styles.icon} />
        <div className={styles.text}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {children && (
            <div id={bodyId} className={styles.body}>
              {children}
            </div>
          )}
        </div>
        <div className={styles.buttons}>
          {buttons.map((button) => (
            <Button
              key={button.value}
              type={button.isDefault ? 'submit' : 'button'}
              value={button.value}
              isDefault={button.isDefault}
              data-default={button.isDefault || undefined}
              onClick={
                button.isDefault ? undefined : () => onClose(button.value)
              }
            >
              {button.label}
            </Button>
          ))}
        </div>
      </form>
    </dialog>
  );
}
