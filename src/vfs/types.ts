// The virtual filesystem: what the build emits from content/ and the desktop reads.
// Shared by the build plugin (build/content-plugin.ts) and the app (src/vfs/index.ts).

import type { IconName } from '../assets/icons/icons.ts';

interface NodeBase {
  /** Stable, unique id, e.g. "portfolio" or "portfolio/magic-move". */
  id: string;
  /** Label under the icon. */
  name: string;
  /** Override the default icon for this kind. */
  icon?: IconName;
}

export interface FolderNode extends NodeBase {
  kind: 'folder';
  children: VNode[];
}

/** A Markdown document; opens in Notes. Its content loads only when opened. */
export interface DocNode extends NodeBase {
  kind: 'doc';
  docId: string;
}

export interface AppNode extends NodeBase {
  kind: 'app';
  appId: string;
}

/** Opens an external page (LinkedIn, email). */
export interface LinkNode extends NodeBase {
  kind: 'link';
  href: string;
}

export type VNode = FolderNode | DocNode | AppNode | LinkNode;

export interface CaseStudyMeta {
  client: string;
  years: string;
  role: string;
  scope: string[];
  summary: string;
  subtitle?: string;
  awards?: string;
}

/** A document as delivered to Notes when opened. */
export interface Doc {
  id: string;
  title: string;
  /** Present for portfolio case studies. */
  caseStudy?: CaseStudyMeta;
  /** Rendered from Mike's own Markdown at build time (trusted content). */
  html: string;
  /** Headings for the in-window table of contents. */
  headings: { id: string; text: string; level: number }[];
}

export const DEFAULT_ICONS: Record<VNode['kind'], IconName> = {
  folder: 'folder',
  doc: 'document',
  app: 'computer',
  link: 'link',
};
