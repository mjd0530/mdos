import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import {
  buildContent,
  docModuleCode,
  vfsModuleCode,
  type ContentResult,
  type ImageMaps,
} from './content.ts';
import { processAll } from './images.ts';

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
  let images: ImageMaps | undefined;

  const appExists = (appId: string) =>
    existsSync(path.join(rootDir, 'src', 'apps', appId, 'index.ts'));

  // Validate synchronously, then resize every referenced image (cached by content).
  const rebuild = async () => {
    const next = buildContent({ contentDir, rootDir, appExists });
    const docImages = [...next.docs.values()].flatMap((doc) => doc.images);
    const [docDisplay, galleryDisplay, thumb] = await Promise.all([
      processAll(rootDir, docImages, 'display'),
      processAll(rootDir, next.assets, 'display'),
      processAll(rootDir, next.assets, 'thumb'),
    ]);
    result = next;
    images = {
      display: new Map([...docDisplay, ...galleryDisplay]),
      thumb,
    };
  };

  return {
    name: 'mikeos-content',

    configResolved(config) {
      rootDir = config.root;
      contentDir = path.join(rootDir, 'content');
      isBuild = config.command === 'build';
    },

    async buildStart() {
      try {
        await rebuild();
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
      if (virtualId === VFS_ID) return vfsModuleCode(result, images);
      if (virtualId.startsWith(DOC_PREFIX)) {
        const rendered = result.docs.get(virtualId.slice(DOC_PREFIX.length));
        if (rendered) return docModuleCode(rendered, images?.display);
      }
      return undefined;
    },

    configureServer(devServer) {
      devServer.watcher.add(contentDir);
      const onChange = async (file: string) => {
        if (!file.startsWith(contentDir)) return;
        try {
          await rebuild();
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
      const handle = (file: string) => void onChange(file);
      devServer.watcher.on('change', handle);
      devServer.watcher.on('add', handle);
      devServer.watcher.on('unlink', handle);
    },
  };
}
