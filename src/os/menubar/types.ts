export interface MenuCommand {
  kind: 'command';
  id: string;
  label: string;
  /** Letter for ⌘/Ctrl shortcuts, e.g. 'W'. Shown in the menu; wiring is per command. */
  shortcut?: string;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface MenuSeparator {
  kind: 'separator';
  id: string;
}

export type MenuEntry = MenuCommand | MenuSeparator;

export interface MenuDef {
  id: string;
  /** Visible title. The mark menu uses `icon` instead and needs `ariaLabel`. */
  label: string;
  icon?: 'mark';
  items: MenuEntry[];
}

export const isCommand = (entry: MenuEntry): entry is MenuCommand =>
  entry.kind === 'command';
