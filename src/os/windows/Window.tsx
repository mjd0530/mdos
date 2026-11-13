import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { useEffect, useId, useMemo, useRef } from 'react';
import chrome from '../../ui/chrome.module.css';
import { ScrollArea } from '../../ui/ScrollArea';
import { WindowFrameContext, type WindowFrame } from './frame';
import { useWindows, type WindowInstance } from './store';
import styles from './Window.module.css';

interface WindowProps {
  win: WindowInstance;
  active: boolean;
  /** Stacking position, 1 = backmost. */
  z: number;
  /** Phones: full screen, one at a time; no zoom, collapse or resize. */
  phone?: boolean;
  /** Free-standing (D-035): no chrome; the app draws its own shape, grip and close. */
  frameless?: boolean;
  children: ReactNode;
}

const KEY_STEP = 16;

const ARROWS: Record<string, [number, number] | undefined> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/**
 * A System 7 window. Owns all chrome and behaviour; apps render content only.
 * Mouse/touch: drag the title bar, drag the grow box, double-click the title to collapse.
 * Keyboard: focus the title, then arrows move and Shift+arrows resize.
 */
export function Window({
  win,
  active,
  z,
  phone = false,
  frameless = false,
  children,
}: WindowProps) {
  const { id, title, rect, zoomed, collapsed } = win;
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();
  const hintId = useId();
  const drag = useRef<{
    kind: 'move' | 'resize';
    pointerX: number;
    pointerY: number;
    rect: typeof rect;
  } | null>(null);

  const actions = useWindows.getState();

  // Remember what opened this window; closing hands focus back to it. Declared before the
  // "active" effect so that, when another window becomes active, that window wins.
  useEffect(() => {
    const opener = document.activeElement;
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  // Becoming the active window pulls keyboard focus inside it.
  useEffect(() => {
    const el = ref.current;
    if (active && el && !el.contains(document.activeElement)) {
      el.focus({ preventScroll: true });
    }
  }, [active]);

  const startDrag = (kind: 'move' | 'resize') => (event: PointerEvent) => {
    if (event.button !== 0 || (phone && frameless)) return;
    if (
      kind === 'move' &&
      (event.target as Element).closest('button, input, a, [data-no-drag]')
    ) {
      return;
    }
    if (zoomed || (kind === 'resize' && collapsed)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      kind,
      pointerX: event.clientX,
      pointerY: event.clientY,
      rect,
    };
  };

  const onDragMove = (event: PointerEvent) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.pointerX;
    const dy = event.clientY - start.pointerY;
    if (start.kind === 'move') {
      actions.move(id, start.rect.x + dx, start.rect.y + dy);
    } else {
      actions.resize(id, start.rect.w + dx, start.rect.h + dy);
    }
  };

  const endDrag = () => {
    drag.current = null;
  };

  const onTitleKeyDown = (event: KeyboardEvent) => {
    const direction = ARROWS[event.key];
    if (!direction) return;
    event.preventDefault();
    event.stopPropagation();
    const [dx, dy] = direction;
    if (event.shiftKey && !frameless) {
      actions.resize(id, rect.w + dx * KEY_STEP, rect.h + dy * KEY_STEP);
    } else {
      actions.move(id, rect.x + dx * KEY_STEP, rect.y + dy * KEY_STEP);
    }
  };

  const frame = useMemo<WindowFrame>(
    () => ({
      title,
      close: () => useWindows.getState().close(id),
      grip: {
        onPointerDown: startDrag('move'),
        onPointerMove: onDragMove,
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
      },
      onGripKeyDown: onTitleKeyDown,
      hintId,
      phone,
    }),
    // The handlers read the latest rect through closures recreated each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [title, id, hintId, phone, rect, zoomed, collapsed],
  );

  if (frameless) {
    return (
      <section
        ref={ref}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-active={active || undefined}
        data-phone={phone || undefined}
        data-frameless=""
        hidden={phone && !active}
        inert={phone && !active}
        className={styles.frameless}
        // Phones centre the device on the screen instead of placing it.
        style={
          phone
            ? { zIndex: z }
            : {
                left: rect.x,
                top: rect.y,
                width: rect.w,
                height: rect.h,
                zIndex: z,
              }
        }
        onPointerDownCapture={() => actions.focus(id)}
        onFocusCapture={() => actions.focus(id)}
      >
        <h2 id={titleId} className="visually-hidden">
          {title}
        </h2>
        <span id={hintId} className="visually-hidden">
          Arrow keys move this window.
        </span>
        <div
          className={styles.framelessBody}
          style={phone ? { width: rect.w, height: rect.h } : undefined}
        >
          <WindowFrameContext.Provider value={frame}>
            {children}
          </WindowFrameContext.Provider>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      data-active={active || undefined}
      data-phone={phone || undefined}
      // On phones only the front window is shown (and reachable by screen readers).
      hidden={phone && !active}
      inert={phone && !active}
      data-collapsed={collapsed || undefined}
      className={`${chrome.window} ${active ? '' : chrome.inactive} ${styles.window}`}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: collapsed ? undefined : rect.h,
        zIndex: z,
      }}
      onPointerDownCapture={() => actions.focus(id)}
      onFocusCapture={() => actions.focus(id)}
    >
      <div
        className={`${chrome.titleBar} ${styles.titleBar}`}
        onPointerDown={startDrag('move')}
        onPointerMove={onDragMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={(event) => {
          if (!(event.target as Element).closest('button')) {
            actions.toggleCollapse(id);
          }
        }}
      >
        <button
          type="button"
          className={`${chrome.titleBox} ${chrome.closeBox}`}
          aria-label={`Close ${title}`}
          onClick={() => actions.close(id)}
        />
        <h2
          id={titleId}
          className={`${chrome.title} ${styles.title}`}
          tabIndex={0}
          aria-describedby={phone ? undefined : hintId}
          onKeyDown={onTitleKeyDown}
        >
          {title}
        </h2>
        {/* Phones show every window full screen: zoom and collapse don't apply. */}
        {!phone && (
          <>
            <button
              type="button"
              className={`${chrome.titleBox} ${chrome.zoomBox}`}
              aria-label={`${zoomed ? 'Restore' : 'Zoom'} ${title}`}
              aria-pressed={zoomed}
              onClick={() => actions.toggleZoom(id)}
            />
            <button
              type="button"
              className={`${chrome.titleBox} ${chrome.collapseBox}`}
              aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${title}`}
              aria-expanded={!collapsed}
              onClick={() => actions.toggleCollapse(id)}
            />
          </>
        )}
      </div>
      {!phone && (
        <span id={hintId} className="visually-hidden">
          Arrow keys move this window. Shift plus arrow keys resize it.
        </span>
      )}

      {!collapsed && (
        <ScrollArea
          active={active}
          className={styles.body}
          corner={
            !zoomed && (
              <div
                className={`${styles.grow} ${active ? styles.growActive : ''}`}
                data-testid="grow-box"
                aria-hidden="true"
                onPointerDown={startDrag('resize')}
                onPointerMove={onDragMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              />
            )
          }
        >
          {children}
        </ScrollArea>
      )}
    </section>
  );
}
