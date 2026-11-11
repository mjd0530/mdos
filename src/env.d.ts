/// <reference types="vite/client" />

/** package.json version, injected at build time (vite.config.ts). */
declare const __APP_VERSION__: string;

/** Built from content/ by build/content-plugin.ts. */
declare module 'virtual:vfs' {
  import type { Doc, FolderNode } from './vfs/types';
  export const tree: FolderNode;
  export const docLoaders: Record<string, () => Promise<{ default: Doc }>>;
}
