import type { MenuDef, MenuEntry } from './menubar/types';

export interface SystemActions {
  about: () => void;
  shortcuts: () => void;
  restart: () => void;
  launch: (appId: string) => void;
  closeWindow: () => void;
  nextWindow: () => void;
}

export interface SystemState {
  /** Is there an active window for Close / Next to act on? */
  hasWindow: boolean;
  windowCount: number;
  /** Apps listed in the M menu, like System 7's Apple menu items. */
  markMenuApps: { id: string; name: string }[];
}

/**
 * The system menus. Items that depend on later steps (windows, Files, persistence) are
 * present but disabled so the menu bar already reads like a complete System 7 machine.
 */
export function systemMenus(
  actions: SystemActions,
  state: SystemState,
): MenuDef[] {
  return [
    {
      id: 'mark',
      label: 'Mike OS',
      icon: 'mark',
      items: [
        {
          kind: 'command',
          id: 'about',
          label: 'About Mike OS…',
          onSelect: actions.about,
        },
        { kind: 'separator', id: 'sep1' },
        ...state.markMenuApps.map((app): MenuEntry => ({
          kind: 'command',
          id: `app-${app.id}`,
          label: app.name,
          onSelect: () => actions.launch(app.id),
        })),
        {
          kind: 'command',
          id: 'control-panel',
          label: 'Control Panel',
          disabled: true,
        },
      ],
    },
    {
      id: 'file',
      label: 'File',
      items: [
        {
          kind: 'command',
          id: 'open',
          label: 'Open',
          shortcut: 'O',
          disabled: true,
        },
        { kind: 'separator', id: 'sep1' },
        {
          // No ⌘W: browsers close the tab before a page can see it.
          kind: 'command',
          id: 'close',
          label: 'Close Window',
          disabled: !state.hasWindow,
          onSelect: actions.closeWindow,
        },
        {
          kind: 'command',
          id: 'next-window',
          label: 'Next Window',
          keyHint: { label: 'Ctrl+`', aria: 'Control+`' },
          disabled: state.windowCount < 2,
          onSelect: actions.nextWindow,
        },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        {
          kind: 'command',
          id: 'undo',
          label: 'Undo',
          shortcut: 'Z',
          disabled: true,
        },
        { kind: 'separator', id: 'sep1' },
        {
          kind: 'command',
          id: 'cut',
          label: 'Cut',
          shortcut: 'X',
          disabled: true,
        },
        {
          kind: 'command',
          id: 'copy',
          label: 'Copy',
          shortcut: 'C',
          disabled: true,
        },
        {
          kind: 'command',
          id: 'paste',
          label: 'Paste',
          shortcut: 'V',
          disabled: true,
        },
        {
          kind: 'command',
          id: 'select-all',
          label: 'Select All',
          shortcut: 'A',
          disabled: true,
        },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { kind: 'command', id: 'by-icon', label: 'by Icon', disabled: true },
        { kind: 'command', id: 'by-name', label: 'by Name', disabled: true },
      ],
    },
    {
      id: 'special',
      label: 'Special',
      items: [
        {
          kind: 'command',
          id: 'clean-up',
          label: 'Clean Up Desktop',
          disabled: true,
        },
        { kind: 'separator', id: 'sep1' },
        {
          kind: 'command',
          id: 'reset',
          label: 'Reset Desktop…',
          disabled: true,
        },
        {
          kind: 'command',
          id: 'restart',
          label: 'Restart…',
          onSelect: actions.restart,
        },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        {
          kind: 'command',
          id: 'shortcuts',
          label: 'Keyboard Shortcuts…',
          onSelect: actions.shortcuts,
        },
        {
          kind: 'command',
          id: 'about-help',
          label: 'About Mike OS…',
          onSelect: actions.about,
        },
      ],
    },
  ];
}
