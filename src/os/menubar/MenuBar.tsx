import type { KeyboardEvent, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import chrome from '../../ui/chrome.module.css';
import styles from './MenuBar.module.css';
import { isCommand, type MenuCommand, type MenuDef } from './types';

interface MenuBarProps {
  menus: MenuDef[];
  /** Right-hand extras (the clock). Rendered outside role="menubar". */
  end?: ReactNode;
}

interface OpenState {
  menu: number;
  /** Index into the open menu's items; null = menu open, nothing highlighted. */
  item: number | null;
}

/**
 * System 7 menu bar following the WAI-ARIA menubar pattern.
 * Mouse: press a title to open; drag to an item and release, or click title then item.
 * Keyboard: one Tab stop; ←/→ move between menus, ↓/↑/Enter/Space open, Esc closes.
 */
export function MenuBar({ menus, end }: MenuBarProps) {
  const [open, setOpen] = useState<OpenState | null>(null);
  const [focusedTitle, setFocusedTitle] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const titleRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const enabledIndexes = useCallback(
    (menuIndex: number) =>
      (menus[menuIndex]?.items ?? []).flatMap((entry, i) =>
        isCommand(entry) && !entry.disabled ? [i] : [],
      ),
    [menus],
  );

  const close = (refocusTitle: boolean) => {
    if (open && refocusTitle) titleRefs.current[open.menu]?.focus();
    setOpen(null);
  };

  // Keyboard-highlighted items take focus so screen readers announce them.
  useEffect(() => {
    if (open?.item != null) itemRefs.current[open.item]?.focus();
  }, [open]);

  // Clicking anywhere outside the menu bar closes the open menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const openMenu = (menu: number, at: 'first' | 'last' | 'none') => {
    const enabled = enabledIndexes(menu);
    const item =
      at === 'first'
        ? (enabled[0] ?? null)
        : at === 'last'
          ? (enabled.at(-1) ?? null)
          : null;
    setFocusedTitle(menu);
    setOpen({ menu, item });
    if (item === null) titleRefs.current[menu]?.focus();
  };

  const moveTitle = (delta: number) => {
    const next = (focusedTitle + delta + menus.length) % menus.length;
    setFocusedTitle(next);
    if (open) openMenu(next, 'first');
    else titleRefs.current[next]?.focus();
  };

  const activate = (command: MenuCommand) => {
    if (command.disabled) return;
    setOpen(null);
    titleRefs.current[focusedTitle]?.focus();
    command.onSelect?.();
  };

  const onTitleKeyDown = (event: KeyboardEvent, index: number) => {
    switch (event.key) {
      case 'ArrowRight':
        moveTitle(1);
        break;
      case 'ArrowLeft':
        moveTitle(-1);
        break;
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        openMenu(index, 'first');
        break;
      case 'ArrowUp':
        openMenu(index, 'last');
        break;
      case 'Escape':
        close(true);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const onItemKeyDown = (event: KeyboardEvent) => {
    if (!open) return;
    const enabled = enabledIndexes(open.menu);
    const position = open.item === null ? -1 : enabled.indexOf(open.item);
    const go = (i: number) =>
      setOpen({ menu: open.menu, item: enabled[i] ?? null });

    switch (event.key) {
      case 'ArrowDown':
        go((position + 1) % enabled.length);
        break;
      case 'ArrowUp':
        go((position - 1 + enabled.length) % enabled.length);
        break;
      case 'Home':
        go(0);
        break;
      case 'End':
        go(enabled.length - 1);
        break;
      case 'ArrowRight':
        moveTitle(1);
        break;
      case 'ArrowLeft':
        moveTitle(-1);
        break;
      case 'Enter':
      case ' ': {
        const entry =
          open.item === null ? undefined : menus[open.menu]?.items[open.item];
        if (entry && isCommand(entry)) activate(entry);
        break;
      }
      case 'Escape':
        close(true);
        break;
      case 'Tab':
        setOpen(null);
        return; // let focus move on
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <header className={styles.bar} ref={barRef}>
      <div role="menubar" aria-label="Menu bar" className={styles.menubar}>
        {menus.map((menu, index) => {
          const isOpen = open?.menu === index;
          const menuId = `menu-${menu.id}`;
          return (
            <div key={menu.id} className={styles.slot}>
              <button
                type="button"
                ref={(el) => {
                  titleRefs.current[index] = el;
                }}
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls={isOpen ? menuId : undefined}
                aria-label={menu.icon ? menu.label : undefined}
                tabIndex={index === focusedTitle ? 0 : -1}
                className={`${styles.title} ${isOpen ? styles.titleOpen : ''}`}
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  event.preventDefault(); // keep focus where it is; no focus ring on mouse use
                  if (isOpen) setOpen(null);
                  else openMenu(index, 'none');
                }}
                onPointerEnter={() => {
                  if (open && !isOpen) openMenu(index, 'none');
                }}
                onKeyDown={(event) => onTitleKeyDown(event, index)}
                onFocus={() => setFocusedTitle(index)}
              >
                {menu.icon ? (
                  <span className={styles.mark} aria-hidden="true" />
                ) : (
                  menu.label
                )}
              </button>

              {isOpen && (
                <div
                  id={menuId}
                  role="menu"
                  aria-label={menu.label}
                  className={`${chrome.menu} ${styles.dropdown}`}
                  onKeyDown={onItemKeyDown}
                >
                  {menu.items.map((entry, i) =>
                    isCommand(entry) ? (
                      <div
                        key={entry.id}
                        ref={(el) => {
                          itemRefs.current[i] = el;
                        }}
                        role="menuitem"
                        tabIndex={-1}
                        aria-disabled={entry.disabled || undefined}
                        aria-keyshortcuts={
                          entry.shortcut
                            ? `Meta+${entry.shortcut} Control+${entry.shortcut}`
                            : entry.keyHint?.aria
                        }
                        data-highlighted={open.item === i || undefined}
                        className={chrome.menuItem}
                        onPointerEnter={() =>
                          setOpen({
                            menu: index,
                            item: entry.disabled ? null : i,
                          })
                        }
                        onPointerLeave={() =>
                          setOpen({ menu: index, item: null })
                        }
                        onPointerUp={() => activate(entry)}
                      >
                        <span>{entry.label}</span>
                        {entry.shortcut && (
                          <span className={styles.shortcut} aria-hidden="true">
                            <span className={styles.command} />
                            {entry.shortcut}
                          </span>
                        )}
                        {entry.keyHint && (
                          <span className={styles.shortcut} aria-hidden="true">
                            {entry.keyHint.label}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        key={entry.id}
                        role="separator"
                        className={chrome.separator}
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {end && <div className={styles.end}>{end}</div>}
    </header>
  );
}
