import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import {
  buildContent,
  docModuleCode,
  vfsModuleCode,
  type ContentResult,
} from './content.ts';

const VFS_ID = 'virtual:vfs';
const DOC_PREFIX = 'virtual:doc/';

/**
 * Turns content/ into `virtual:vfs` (the tree + lazy doc loaders) and one
 * `virtual:doc/<id>` module per document. Bad content fails the build; in dev it shows
 * Vite's error overlay and keeps serving the last good version.
 */
export function contentPlugin(): Plugin {
  let rootDir = '';
  let contentDir = '';
  let isBuild = false;
  let result: ContentResult | undefined;

  const appExists = (appId: string) =>
    existsSync(path.join(rootDir, 'src', 'apps', appId, 'index.ts'));

  const rebuild = () => {
    result = buildContent({ contentDir, rootDir, appExists });
  };

  return {
    name: 'mikeos-content',

    configResolved(config) {
      rootDir = config.root;
      contentDir = path.join(rootDir, 'content');
      isBuild = config.command === 'build';
    },

    buildStart() {
      try {
        rebuild();
      } catch (error) {
        if (isBuild) throw error;
        this.warn(String(error));
      }
      for (const file of result?.files ?? []) this.addWatchFile(file);
    },

    resolveId(id) {
      if (id === VFS_ID || id.startsWith(DOC_PREFIX)) return `\0${id}`;
      return undefined;
    },

    load(id) {
      if (!id.startsWith('\0')) return undefined;
      const virtualId = id.slice(1);
      if (!result) {
        if (virtualId === VFS_ID) {
          return 'export const tree = { kind: "folder", id: "desktop", name: "Desktop", children: [] };\nexport const docLoaders = {};\n';
        }
        return undefined;
      }
      if (virtualId === VFS_ID) return vfsModuleCode(result);
      if (virtualId.startsWith(DOC_PREFIX)) {
        const rendered = result.docs.get(virtualId.slice(DOC_PREFIX.length));
        if (rendered) return docModuleCode(rendered);
      }
      return undefined;
    },

    configureServer(devServer) {
      devServer.watcher.add(contentDir);
      const onChange = (file: string) => {
        if (!file.startsWith(contentDir)) return;
        try {
          rebuild();
        } catch (error) {
          devServer.config.logger.error(String(error));
          devServer.ws.send({
            type: 'error',
            err: {
              message: String(error),
              stack: '',
              plugin: 'mikeos-content',
            },
          });
          return;
        }
        for (const mod of devServer.moduleGraph.idToModuleMap.values()) {
          if (mod.id?.startsWith('\0virtual:')) {
            devServer.moduleGraph.invalidateModule(mod);
          }
        }
        devServer.ws.send({ type: 'full-reload' });
      };
      devServer.watcher.on('change', onChange);
      devServer.watcher.on('add', onChange);
      devServer.watcher.on('unlink', onChange);
    },
  };
}
