import type { KeyboardEvent } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import chrome from './chrome.module.css';
import styles from './ContextMenu.module.css';

export interface ContextMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  onSelect: () => void;
}

interface ContextMenuProps {
  /** Viewport coordinates of the pointer (or the focused item). */
  x: number;
  y: number;
  label: string;
  items: ContextMenuItem[];
  onClose: () => void;
}

/** A small pop-up menu: arrows move, Enter chooses, Esc or clicking elsewhere closes.
 *  Focus goes into the menu and back to where it was when it closes. */
export function ContextMenu({ x, y, label, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const enabled = items.flatMap((item, i) => (item.disabled ? [] : [i]));
  const [active, setActive] = useState<number | undefined>(enabled[0]);
  const [position, setPosition] = useState({ left: x, top: y });

  // Keep the menu on screen.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setPosition({
      left: Math.max(0, Math.min(x, window.innerWidth - width - 2)),
      top: Math.max(0, Math.min(y, window.innerHeight - height - 2)),
    });
  }, [x, y]);

  useEffect(() => {
    const opener = document.activeElement;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (active !== undefined) itemRefs.current[active]?.focus();
  }, [active]);

  const choose = (index: number) => {
    const item = items[index];
    if (!item || item.disabled) return;
    onClose();
    item.onSelect();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const position = active === undefined ? -1 : enabled.indexOf(active);
    switch (event.key) {
      case 'ArrowDown':
        setActive(enabled[(position + 1) % enabled.length]);
        break;
      case 'ArrowUp':
        setActive(enabled[(position - 1 + enabled.length) % enabled.length]);
        break;
      case 'Enter':
      case ' ':
        if (active !== undefined) choose(active);
        break;
      case 'Escape':
      case 'Tab':
        onClose();
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      className={`${chrome.menu} ${styles.menu}`}
      style={position}
      onKeyDown={onKeyDown}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          role="menuitem"
          tabIndex={-1}
          aria-disabled={item.disabled || undefined}
          data-highlighted={active === index || undefined}
          className={chrome.menuItem}
          onPointerEnter={() => {
            if (!item.disabled) setActive(index);
          }}
          onClick={() => choose(index)}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
