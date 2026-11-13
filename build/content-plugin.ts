import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import {
  addImageSizes,
  buildContent,
  docModuleCode,
  vfsModuleCode,
  type ContentResult,
  type ImageMaps,
} from './content.ts';
import { imageSize, processAll } from './images.ts';
import { buildMusic, musicModuleCode, type MusicResult } from './music.ts';
import { plainPages } from './plain.ts';

const VFS_ID = 'virtual:vfs';
const DOC_PREFIX = 'virtual:doc/';
const MUSIC_ID = 'virtual:music';

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
  let music: MusicResult | undefined;
  let covers: { cover: Map<string, string>; thumb: Map<string, string> } = {
    cover: new Map(),
    thumb: new Map(),
  };
  let base = '/';
  // Build only: emitted copies of processed images, so plain pages can link to them.
  const displayRefs = new Map<string, string>();
  const thumbRefs = new Map<string, string>();
  const coverRefs = new Map<string, string>();
  // Build only: each audio file emitted once, by audio index (D-034).
  let audioRefs: string[] = [];

  const appExists = (appId: string) =>
    existsSync(path.join(rootDir, 'src', 'apps', appId, 'index.ts'));

  // Validate synchronously, then resize every referenced image (cached by content).
  const rebuild = async () => {
    const next = buildContent({ contentDir, rootDir, appExists });
    const nextMusic = await buildMusic({ contentDir, rootDir });
    const [coverDisplay, coverThumb] = await Promise.all([
      processAll(rootDir, nextMusic.covers, 'cover'),
      processAll(rootDir, nextMusic.covers, 'thumb'),
    ]);
    const docImages = [...next.docs.values()].flatMap((doc) => doc.images);
    const [docDisplay, galleryDisplay, thumb] = await Promise.all([
      processAll(rootDir, docImages, 'display'),
      processAll(rootDir, next.assets, 'display'),
      processAll(rootDir, next.assets, 'thumb'),
    ]);
    const sizes = new Map(
      await Promise.all(
        [...docDisplay].map(
          async ([source, output]) =>
            [source, await imageSize(rootDir, output)] as const,
        ),
      ),
    );
    for (const doc of next.docs.values()) addImageSizes(doc, sizes);
    result = next;
    music = nextMusic;
    covers = { cover: coverDisplay, thumb: coverThumb };
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
      base = config.base;
    },

    async buildStart() {
      try {
        await rebuild();
      } catch (error) {
        if (isBuild) throw error;
        this.warn(String(error));
      }
      for (const file of [...(result?.files ?? []), ...(music?.files ?? [])]) {
        this.addWatchFile(file);
      }
      if (isBuild && images) {
        const emit = (from: Map<string, string>, to: Map<string, string>) => {
          for (const [source, output] of from) {
            to.set(
              source,
              this.emitFile({
                type: 'asset',
                name: path.basename(output),
                source: readFileSync(path.join(rootDir, output)),
              }),
            );
          }
        };
        emit(images.display, displayRefs);
        emit(images.thumb, thumbRefs);
        emit(covers.cover, coverRefs);
        audioRefs = (music?.audio ?? []).map((source) =>
          this.emitFile({
            type: 'asset',
            name: path.basename(source),
            source: readFileSync(path.join(rootDir, source)),
          }),
        );
      }
    },

    resolveId(id) {
      if (id === VFS_ID || id === MUSIC_ID || id.startsWith(DOC_PREFIX)) {
        return `\0${id}`;
      }
      return undefined;
    },

    load(id) {
      if (!id.startsWith('\0')) return undefined;
      const virtualId = id.slice(1);
      if (virtualId === MUSIC_ID) {
        if (!music) return 'export const albums = [];\n';
        const current = music;
        return musicModuleCode(
          current,
          (source, variant) => covers[variant].get(source) ?? source,
          (index) =>
            isBuild
              ? `import.meta.ROLLUP_FILE_URL_${audioRefs[index]}`
              : JSON.stringify(base + (current.audio[index] ?? '').slice(1)),
        );
      }
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

    // The plain view (D-028): static pages for every document, written into the build.
    generateBundle() {
      if (!result) return;
      const url = (refs: Map<string, string>, source: string) => {
        const ref = refs.get(source);
        return ref ? base + this.getFileName(ref) : source;
      };
      const pages = plainPages(result, {
        base,
        music: music?.albums ?? [],
        musicFile: (token) => {
          const audio = /^__MIKEOS_AUDIO_(\d+)__$/.exec(token);
          if (audio) {
            const ref = audioRefs[Number(audio[1])];
            return ref ? base + this.getFileName(ref) : '';
          }
          const cover = /^__MIKEOS_COVER_\w+_(\d+)__$/.exec(token);
          return url(coverRefs, music?.covers[Number(cover?.[1])] ?? '');
        },
        docImage: (source) => url(displayRefs, source),
        galleryImage: (index, variant) =>
          url(
            variant === 'thumb' ? thumbRefs : displayRefs,
            result?.assets[index] ?? '',
          ),
      });
      for (const [fileName, source] of pages) {
        this.emitFile({ type: 'asset', fileName, source });
      }
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
