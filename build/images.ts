// Resizes content images to WebP at build time, cached by file content so unchanged
// pictures are never processed twice. Output lives under node_modules/.cache (inside the
// project root), so Vite serves it in dev and hashes it into dist/ in a build.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export interface ImageVariant {
  /** Longest edge in px; images smaller than this are never enlarged. */
  maxSize: number;
  quality: number;
}

export const VARIANTS = {
  /** Shown in documents and Viewer. */
  display: { maxSize: 2000, quality: 82 },
  /** Sketchbook icons in Files. */
  thumb: { maxSize: 192, quality: 76 },
} satisfies Record<string, ImageVariant>;

export type VariantName = keyof typeof VARIANTS;

const CACHE_VERSION = 1;

export function cacheDir(rootDir: string) {
  return path.join(rootDir, 'node_modules', '.cache', 'mikeos-images');
}

/**
 * Process one image and return the output's root-relative path ("/node_modules/…webp").
 * `source` is root-relative too ("/content/…").
 */
export async function processImage(
  rootDir: string,
  source: string,
  variant: VariantName,
): Promise<string> {
  const absolute = path.join(rootDir, source);
  const { maxSize, quality } = VARIANTS[variant];
  const hash = createHash('sha1')
    .update(readFileSync(absolute))
    .update(`${CACHE_VERSION}:${maxSize}:${quality}`)
    .digest('hex')
    .slice(0, 16);
  const base = path.basename(source).replace(/\.[^.]+$/, '');
  const outDir = cacheDir(rootDir);
  const output = path.join(outDir, `${base}-${variant}-${hash}.webp`);

  if (!existsSync(output)) {
    mkdirSync(outDir, { recursive: true });
    await sharp(absolute)
      .rotate() // respect camera/iPad orientation
      .resize({
        width: maxSize,
        height: maxSize,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toFile(output);
  }
  return '/' + path.relative(rootDir, output).split(path.sep).join('/');
}

/** Process many images in parallel; returns source → output for one variant. */
export async function processAll(
  rootDir: string,
  sources: Iterable<string>,
  variant: VariantName,
): Promise<Map<string, string>> {
  const unique = [...new Set(sources)];
  const outputs = await Promise.all(
    unique.map((source) => processImage(rootDir, source, variant)),
  );
  return new Map(unique.map((source, i) => [source, outputs[i] as string]));
}
