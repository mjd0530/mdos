import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  audioToken,
  buildMusic,
  coverToken,
  musicModuleCode,
} from './music.ts';
import { plainPages } from './plain.ts';

let root: string;
let content: string;
const tones = path.resolve('tests/fixtures/music/test-tones');

const write = (file: string, body: string) => {
  const full = path.join(content, file);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, body);
};

const album = (extra = '') => `title: Demo
artist: Band
year: 2004
cover: cover.png
coverAlt: A cover
tracks:
  - file: 01.m4a
    title: First
    lyrics: 01.txt
  - file: 02.m4a
    title: Second
${extra}`;

const build = () => buildMusic({ contentDir: content, rootDir: root });

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'mikeos-music-'));
  content = path.join(root, 'content');
  mkdirSync(path.join(content, 'music', 'demo'), { recursive: true });
  for (const file of ['01.m4a', '02.m4a', 'cover.png']) {
    copyFileSync(
      path.join(tones, file),
      path.join(content, 'music', 'demo', file),
    );
  }
  write('music/music.yaml', 'albums:\n  - demo\n');
  write('music/demo/01.txt', 'Line one\r\nLine two\n');
  write('music/demo/album.yaml', album());
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('buildMusic', () => {
  it('is empty without music.yaml', async () => {
    rmSync(path.join(content, 'music', 'music.yaml'));
    expect((await build()).albums).toEqual([]);
  });

  it('reads albums, tracks, durations and lyrics', async () => {
    const music = await build();
    expect(music.albums).toHaveLength(1);
    const [demo] = music.albums;
    expect(demo).toMatchObject({
      id: 'demo',
      title: 'Demo',
      year: '2004',
      cover: coverToken('cover', 0),
      coverThumb: coverToken('thumb', 0),
    });
    expect(demo?.tracks.map((t) => t.id)).toEqual(['demo/1', 'demo/2']);
    expect(demo?.tracks[0]?.src).toBe(audioToken(0));
    expect(demo?.tracks[0]?.duration).toBe(12);
    expect(demo?.tracks[0]?.lyrics).toBe('Line one\nLine two');
    expect(demo?.tracks[1]?.lyrics).toBeUndefined();
    expect(music.audio).toEqual([
      '/content/music/demo/01.m4a',
      '/content/music/demo/02.m4a',
    ]);
    expect(music.covers).toEqual(['/content/music/demo/cover.png']);
  });

  it.each([
    [
      'a missing audio file',
      album('  - file: 09.m4a\n    title: Gone\n'),
      /file not found: 09.m4a/,
    ],
    [
      'a missing lyrics file',
      album().replace('01.txt', '07.txt'),
      /file not found: 07.txt/,
    ],
    [
      'missing cover alt text',
      album().replace('coverAlt: A cover\n', ''),
      /coverAlt/,
    ],
    [
      'an unsupported audio type',
      album().replace('02.m4a', '02.wav'),
      /m4a or .mp3/,
    ],
  ])('rejects %s', async (_name, yaml, message) => {
    write('music/demo/album.yaml', yaml);
    await expect(build()).rejects.toThrow(message);
  });

  it('rejects an album folder without album.yaml', async () => {
    write('music/music.yaml', 'albums:\n  - demo\n  - nope\n');
    await expect(build()).rejects.toThrow(/nope\/album.yaml/);
  });
});

describe('musicModuleCode', () => {
  it('imports covers and inlines audio URLs', async () => {
    const code = musicModuleCode(
      await build(),
      (source, variant) => `${source}?${variant}`,
      (index) => `"/a/${index}.m4a"`,
    );
    expect(code).toContain(
      'import cover0 from "/content/music/demo/cover.png?cover";',
    );
    expect(code).toContain('"cover":cover0');
    expect(code).toContain('"src":"/a/1.m4a"');
    expect(code).not.toContain('__MIKEOS_');
  });
});

describe('plain music page', () => {
  it('lists albums with players and lyrics', async () => {
    const music = await build();
    const pages = plainPages(
      {
        tree: { kind: 'folder', id: 'desktop', name: 'Desktop', children: [] },
        docs: new Map(),
        files: [],
        assets: [],
      },
      {
        base: '/',
        docImage: (s) => s,
        galleryImage: () => '',
        music: music.albums,
        musicFile: (token) => `/f/${token}`,
      },
    );
    const page = pages.get('plain/music/index.html') ?? '';
    expect(page).toContain('<h2>Demo</h2>');
    expect(page).toContain(
      `<audio controls preload="none" src="/f/${audioToken(0)}">`,
    );
    expect(page).toContain('First (0:12)');
    expect(page).toContain('Line one\nLine two');
    expect(pages.get('plain/index.html')).toContain('plain/music/');
  });
});
