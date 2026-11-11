import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assetToken,
  buildContent,
  ContentError,
  docModuleCode,
  imageToken,
  slug,
  splitFrontMatter,
  vfsModuleCode,
} from './content.ts';

let root: string;
let content: string;

const write = (file: string, body: string) => {
  const full = path.join(content, file);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, body);
};

const doc = (title: string, body = '') => `---\ntitle: ${title}\n---\n${body}`;

const build = () =>
  buildContent({
    contentDir: content,
    rootDir: root,
    appExists: (id) => id === 'hello',
  });

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'mikeos-content-'));
  content = path.join(root, 'content');
  mkdirSync(content);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('helpers', () => {
  it('slugs names', () => {
    expect(slug('Smart Share / Magic Move')).toBe('smart-share-magic-move');
    expect(slug('Café Notes')).toBe('cafe-notes');
  });

  it('requires front matter', () => {
    expect(() => splitFrontMatter('# hi', 'x.md')).toThrow(/front matter/);
  });
});

describe('buildContent: valid content', () => {
  beforeEach(() => {
    write(
      'fs.yaml',
      `desktop:
  - doc: readme
    name: Read Me
  - folder: Portfolio
    children:
      - doc: portfolio/alpha
  - app: hello
    name: Hello
  - link: https://example.com/
    name: Example
`,
    );
    write(
      'readme.md',
      doc('Read Me', '## Start here\n\nHello [site](https://example.com).'),
    );
    write(
      'portfolio/alpha/index.md',
      `---
title: Alpha
caseStudy:
  client: Acme
  years: 2024
  role: Lead
  scope: [Research]
  summary: It went well.
---
![A diagram](./diagram.png)

## Process
`,
    );
    write('portfolio/alpha/diagram.png', 'png');
  });

  it('builds the tree with stable ids and kinds', () => {
    const { tree } = build();
    expect(tree.id).toBe('desktop');
    expect(tree.children.map((n) => [n.kind, n.id, n.name])).toEqual([
      ['doc', 'read-me', 'Read Me'],
      ['folder', 'portfolio', 'Portfolio'],
      ['app', 'desktop/app-hello', 'Hello'],
      ['link', 'example', 'Example'],
    ]);
    const portfolio = tree.children[1];
    expect(portfolio?.kind === 'folder' && portfolio.children[0]).toMatchObject(
      {
        kind: 'doc',
        id: 'portfolio/alpha',
        name: 'Alpha',
        docId: 'portfolio/alpha',
      },
    );
  });

  it('renders docs: shifted headings, tokens for images, safe external links', () => {
    const { docs } = build();
    const readme = docs.get('readme');
    expect(readme?.doc.html).toContain('<h3 id="start-here">Start here</h3>');
    expect(readme?.doc.headings).toEqual([
      { id: 'start-here', text: 'Start here', level: 3 },
    ]);
    expect(readme?.doc.html).toContain(
      'target="_blank" rel="noopener noreferrer"',
    );

    const alpha = docs.get('portfolio/alpha');
    expect(alpha?.images).toEqual(['/content/portfolio/alpha/diagram.png']);
    expect(alpha?.doc.html).toContain(`src="${imageToken(0)}"`);
    expect(alpha?.doc.html).toContain('alt="A diagram"');
    expect(alpha?.doc.caseStudy?.years).toBe('2024');
  });

  it('emits doc modules that import their images', () => {
    const code = docModuleCode(build().docs.get('portfolio/alpha')!);
    expect(code).toContain(
      'import image0 from "/content/portfolio/alpha/diagram.png";',
    );
    expect(code).toContain(`.replaceAll("${imageToken(0)}", image0)`);
  });
});

describe('buildContent: broken content fails with a clear message', () => {
  const fsWith = (entries: string) => write('fs.yaml', `desktop:\n${entries}`);

  const cases: [string, () => void, RegExp][] = [
    ['missing fs.yaml', () => {}, /fs\.yaml: file is missing/],
    [
      'unknown entry keys',
      () => fsWith('  - doc: readme\n    colour: red\n'),
      /fs\.yaml/,
    ],
    [
      'doc file missing',
      () => fsWith('  - doc: nope\n'),
      /doc "nope" needs nope\.md or nope\/index\.md/,
    ],
    [
      'unknown app',
      () => fsWith('  - app: paint\n    name: Paint\n'),
      /unknown app "paint"/,
    ],
    [
      'unknown icon',
      () => {
        fsWith('  - doc: a\n    icon: rocket\n');
        write('a.md', doc('A'));
      },
      /icon/,
    ],
    [
      'duplicate ids',
      () => {
        fsWith('  - doc: a\n  - doc: b\n');
        write('a.md', doc('Same'));
        write('b.md', doc('Same'));
      },
      /share the id "same"/,
    ],
    [
      'front matter missing a title',
      () => {
        fsWith('  - doc: a\n');
        write('a.md', '---\nsubtitle: x\n---\n');
      },
      /a\.md: front matter/,
    ],
    [
      'a # heading in the body',
      () => {
        fsWith('  - doc: a\n');
        write('a.md', doc('A', '# Big'));
      },
      /use ## for headings/,
    ],
    [
      'image without alt text',
      () => {
        fsWith('  - doc: a\n');
        write('a.md', doc('A', '![](./x.png)'));
        write('x.png', 'png');
      },
      /needs alt text/,
    ],
    [
      'image that does not exist',
      () => {
        fsWith('  - doc: a\n');
        write('a.md', doc('A', '![A cat](./cat.png)'));
      },
      /image not found: \.\/cat\.png/,
    ],
    [
      'link that is not a URL',
      () => fsWith('  - link: linkedin\n    name: LinkedIn\n'),
      /fs\.yaml/,
    ],
  ];

  it.each(cases)('%s', (_name, setup, message) => {
    setup();
    expect(build).toThrow(ContentError);
    expect(build).toThrow(message);
  });
});

describe('galleries', () => {
  const setup = (manifest: string, files: string[] = ['owl.png']) => {
    write(
      'fs.yaml',
      'desktop:\n  - gallery: sketchbook\n    name: Sketchbook\n',
    );
    write('sketchbook/manifest.yaml', manifest);
    for (const file of files) write(`sketchbook/${file}`, 'png');
  };

  it('turns the manifest into a folder of picture nodes', () => {
    setup(`drawings:
  - file: owl.png
    title: Night Owl
    alt: An owl on a branch
    date: 2025-03-14
    description: Pencil.
`);
    const { tree, assets } = build();
    const folder = tree.children[0];
    expect(folder).toMatchObject({
      kind: 'folder',
      id: 'sketchbook',
      name: 'Sketchbook',
    });
    expect(folder?.kind === 'folder' && folder.children[0]).toEqual({
      kind: 'image',
      id: 'sketchbook/owl',
      name: 'Night Owl',
      alt: 'An owl on a branch',
      date: '2025-03-14',
      description: 'Pencil.',
      src: assetToken('display', 0),
      thumb: assetToken('thumb', 0),
      icon: undefined,
    });
    expect(assets).toEqual(['/content/sketchbook/owl.png']);
  });

  it('imports gallery images in virtual:vfs instead of leaving tokens', () => {
    setup('drawings:\n  - file: owl.png\n    title: Owl\n    alt: An owl\n');
    const code = vfsModuleCode(build(), {
      display: new Map([
        ['/content/sketchbook/owl.png', '/cache/owl-display.webp'],
      ]),
      thumb: new Map([
        ['/content/sketchbook/owl.png', '/cache/owl-thumb.webp'],
      ]),
    });
    expect(code).toContain('import display0 from "/cache/owl-display.webp";');
    expect(code).toContain('import thumb0 from "/cache/owl-thumb.webp";');
    expect(code).toContain('"src":display0');
    expect(code).not.toContain('__MIKEOS_ASSET_');
  });

  it('allows an empty sketchbook', () => {
    setup('drawings: []\n', []);
    const folder = build().tree.children[0];
    expect(folder?.kind === 'folder' && folder.children).toEqual([]);
  });

  it.each([
    [
      'a missing manifest',
      () => write('fs.yaml', 'desktop:\n  - gallery: art\n    name: Art\n'),
      /needs art\/manifest\.yaml/,
    ],
    [
      'a missing image',
      () =>
        setup('drawings:\n  - file: cat.png\n    title: Cat\n    alt: A cat\n'),
      /image not found: cat\.png/,
    ],
    [
      'a drawing without alt text',
      () => setup('drawings:\n  - file: owl.png\n    title: Owl\n'),
      /alt/,
    ],
  ])('fails on %s', (_name, arrange, message) => {
    arrange();
    expect(build).toThrow(message);
  });
});
