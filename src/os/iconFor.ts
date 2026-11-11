import { getApp } from '../apps/registry';
import type { IconName } from '../assets/icons/icons';
import { DEFAULT_ICONS, type VNode } from '../vfs';

/** The icon a node shows: its own override, its app's icon, or the default for its kind. */
export function iconFor(node: VNode): IconName {
  if (node.icon) return node.icon;
  if (node.kind === 'app') return getApp(node.appId)?.icon ?? DEFAULT_ICONS.app;
  return DEFAULT_ICONS[node.kind];
}
