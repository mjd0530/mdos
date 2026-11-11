import { mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { processAll, processImage } from './images.ts';

let root: string;

beforeAll(async () => {
  root = mkdtempSync(path.join(tmpdir(), 'mikeos-images-'));
  mkdirSync(path.join(root, 'content'));
  await sharp({
    create: { width: 3000, height: 1000, channels: 3, background: '#808080' },
  })
    .png()
    .toFile(path.join(root, 'content', 'wide.png'));
  await sharp({
    create: { width: 100, height: 80, channels: 3, background: '#000' },
  })
    .png()
    .toFile(path.join(root, 'content', 'small.png'));
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

const sizeOf = async (rootRelative: string) =>
  sharp(path.join(root, rootRelative)).metadata();

describe('processImage', () => {
  it('shrinks large images to the display size, as WebP', async () => {
    const out = await processImage(root, '/content/wide.png', 'display');
    expect(out).toMatch(
      /^\/node_modules\/\.cache\/mikeos-images\/wide-display-.*\.webp$/,
    );
    const meta = await sizeOf(out);
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(2000);
    expect(meta.height).toBe(667);
  });

  it('makes small thumbnails', async () => {
    const meta = await sizeOf(
      await processImage(root, '/content/wide.png', 'thumb'),
    );
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBe(192);
  });

  it('never enlarges small images', async () => {
    const meta = await sizeOf(
      await processImage(root, '/content/small.png', 'display'),
    );
    expect(meta.width).toBe(100);
  });

  it('reuses cached output instead of processing again', async () => {
    const first = await processImage(root, '/content/wide.png', 'display');
    const before = statSync(path.join(root, first)).mtimeMs;
    const second = await processImage(root, '/content/wide.png', 'display');
    expect(second).toBe(first);
    expect(statSync(path.join(root, second)).mtimeMs).toBe(before);
  });
});

describe('processAll', () => {
  it('maps each unique source to its output', async () => {
    const map = await processAll(
      root,
      ['/content/wide.png', '/content/small.png', '/content/wide.png'],
      'thumb',
    );
    expect([...map.keys()]).toEqual([
      '/content/wide.png',
      '/content/small.png',
    ]);
  });
});
