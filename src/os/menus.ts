import type { MenuDef } from './menubar/types';

export interface SystemActions {
  about: () => void;
  shortcuts: () => void;
  restart: () => void;
}

/**
 * The system menus. Items that depend on later steps (windows, Files, persistence) are
 * present but disabled so the menu bar already reads like a complete System 7 machine.
 */
export function systemMenus(actions: SystemActions): MenuDef[] {
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
          id: 'new-folder',
          label: 'New Folder',
          shortcut: 'N',
          disabled: true,
        },
        {
          kind: 'command',
          id: 'open',
          label: 'Open',
          shortcut: 'O',
          disabled: true,
        },
        { kind: 'separator', id: 'sep1' },
        {
          kind: 'command',
          id: 'close',
          label: 'Close Window',
          shortcut: 'W',
          disabled: true,
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
