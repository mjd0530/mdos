// Reads content/, validates it and turns it into the virtual filesystem plus one rendered
// document per Markdown file. Pure Node; the Vite wiring lives in content-plugin.ts.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Marked, type Tokens } from 'marked';
import YAML from 'yaml';
import { z } from 'zod';
import { ICONS } from '../src/assets/icons/icons.ts';
import type { Doc, FolderNode, VNode } from '../src/vfs/types.ts';

export class ContentError extends Error {
  readonly file: string;

  constructor(file: string, message: string) {
    super(`${file}: ${message}`);
    this.name = 'ContentError';
    this.file = file;
  }
}

// ---------- Schemas ----------

const iconName = z.enum(Object.keys(ICONS) as [string, ...string[]]);
const text = z.string().trim().min(1);

type FsEntry =
  | { folder: string; icon?: string; children: FsEntry[] }
  | { doc: string; name?: string; icon?: string }
  | { app: string; name: string; icon?: string }
  | { link: string; name: string; icon?: string };

// One schema per entry type, chosen by the entry's key, so errors name the real problem
// (a union would only say "invalid input").
const entrySchemas = {
  folder: z
    .object({
      folder: text,
      icon: iconName.optional(),
      children: z.array(z.unknown()).default([]),
    })
    .strict(),
  doc: z
    .object({ doc: text, name: text.optional(), icon: iconName.optional() })
    .strict(),
  app: z.object({ app: text, name: text, icon: iconName.optional() }).strict(),
  link: z
    .object({ link: z.string().url(), name: text, icon: iconName.optional() })
    .strict(),
};

const ENTRY_KINDS = Object.keys(entrySchemas) as (keyof typeof entrySchemas)[];

function parseEntries(raw: unknown, where: string, file: string): FsEntry[] {
  if (!Array.isArray(raw)) {
    throw new ContentError(file, `${where} must be a list`);
  }
  return raw.map((item, index) => {
    const at = `${where}[${index}]`;
    const kinds =
      item && typeof item === 'object'
        ? ENTRY_KINDS.filter((kind) => kind in item)
        : [];
    if (kinds.length !== 1) {
      throw new ContentError(
        file,
        `${at} needs exactly one of: ${ENTRY_KINDS.join(', ')}`,
      );
    }
    const kind = kinds[0] as keyof typeof entrySchemas;
    const parsed = entrySchemas[kind].safeParse(item);
    if (!parsed.success) {
      throw new ContentError(
        file,
        `${at} (${kind}): ${describe(parsed.error)}`,
      );
    }
    if (kind === 'folder') {
      const folder = parsed.data as z.infer<typeof entrySchemas.folder>;
      return {
        ...folder,
        children: parseEntries(folder.children, `${at}.children`, file),
      };
    }
    return parsed.data as FsEntry;
  });
}

const fsFile = z.object({ desktop: z.array(z.unknown()) }).strict();

const frontMatter = z
  .object({
    title: text,
    caseStudy: z
      .object({
        client: text,
        // YAML reads a bare 2024 as a number; accept it and keep text.
        years: z.union([text, z.number()]).transform(String),
        role: text,
        scope: z.array(text).min(1),
        summary: text,
      })
      .strict()
      .optional(),
  })
  .strict();

function describe(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(top)'}: ${issue.message}`)
    .join('; ');
}

// ---------- Helpers ----------

export const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Split `---\nyaml\n---\nbody`. Front matter is required. */
export function splitFrontMatter(
  source: string,
  file: string,
): { data: unknown; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!match) {
    throw new ContentError(file, 'missing front matter (--- title: … ---)');
  }
  try {
    return { data: YAML.parse(match[1] ?? ''), body: match[2] ?? '' };
  } catch (error) {
    throw new ContentError(file, `front matter is not valid YAML: ${error}`);
  }
}

// ---------- Documents ----------

export interface RenderedDoc {
  doc: Doc;
  /** Root-relative image paths ("/content/…") referenced by the HTML as tokens. */
  images: string[];
}

export const imageToken = (index: number) => `__MIKEOS_IMAGE_${index}__`;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Render one Markdown document. Rules: no `#` headings in the body (the window title is the
 * document title); `##` → h3, `###` → h4 so headings nest under the window's h2; every image
 * needs alt text and must exist; external links open in a new tab.
 */
export function renderDoc(
  docId: string,
  source: string,
  file: string,
  rootDir: string,
): RenderedDoc {
  const { data, body } = splitFrontMatter(source, file);
  const meta = frontMatter.safeParse(data);
  if (!meta.success) {
    throw new ContentError(file, `front matter: ${describe(meta.error)}`);
  }

  const images: string[] = [];
  const headings: Doc['headings'] = [];
  const usedIds = new Set<string>();
  const dir = path.dirname(file);

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        if (depth === 1) {
          throw new ContentError(
            file,
            'use ## for headings; the document title is the window title',
          );
        }
        const html = this.parser.parseInline(tokens);
        const plain = html.replace(/<[^>]+>/g, '');
        let id = slug(plain) || 'section';
        while (usedIds.has(id)) id += '-x';
        usedIds.add(id);
        const level = Math.min(depth + 1, 6);
        headings.push({ id, text: plain, level });
        return `<h${level} id="${id}">${html}</h${level}>\n`;
      },
      image({ href, text: alt, title }: Tokens.Image) {
        if (!alt.trim()) {
          throw new ContentError(file, `image "${href}" needs alt text`);
        }
        let src = href;
        if (!/^https?:\/\//.test(href)) {
          const absolute = path.resolve(dir, href);
          if (!existsSync(absolute)) {
            throw new ContentError(file, `image not found: ${href}`);
          }
          images.push(
            '/' + path.relative(rootDir, absolute).split(path.sep).join('/'),
          );
          src = imageToken(images.length - 1);
        }
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<img src="${src}" alt="${escapeHtml(alt)}"${titleAttr} loading="lazy" decoding="async">`;
      },
      link({ href, title, tokens }: Tokens.Link) {
        const inner = this.parser.parseInline(tokens);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const external = /^https?:\/\//.test(href);
        const rel = external
          ? ' target="_blank" rel="noopener noreferrer"'
          : '';
        return `<a href="${escapeHtml(href)}"${titleAttr}${rel}>${inner}</a>`;
      },
    },
  });

  const html = marked.parse(body, { async: false });
  return {
    doc: {
      id: docId,
      title: meta.data.title,
      caseStudy: meta.data.caseStudy,
      html,
      headings,
    },
    images,
  };
}

// ---------- Tree ----------

export interface ContentResult {
  tree: FolderNode;
  docs: Map<string, RenderedDoc>;
  /** Every file read: the dev server watches these. */
  files: string[];
}

interface BuildOptions {
  contentDir: string;
  /** Project root: image paths are emitted relative to it. */
  rootDir: string;
  appExists: (appId: string) => boolean;
}

export function buildContent({
  contentDir,
  rootDir,
  appExists,
}: BuildOptions): ContentResult {
  const fsPath = path.join(contentDir, 'fs.yaml');
  if (!existsSync(fsPath)) throw new ContentError(fsPath, 'file is missing');

  let raw: unknown;
  try {
    raw = YAML.parse(readFileSync(fsPath, 'utf8'));
  } catch (error) {
    throw new ContentError(fsPath, `not valid YAML: ${error}`);
  }
  const parsed = fsFile.safeParse(raw);
  if (!parsed.success) throw new ContentError(fsPath, describe(parsed.error));
  const entries = parseEntries(parsed.data.desktop, 'desktop', fsPath);

  const docs = new Map<string, RenderedDoc>();
  const files = [fsPath];
  const ids = new Set<string>();

  const uniqueId = (base: string) => {
    if (ids.has(base)) {
      throw new ContentError(fsPath, `two items would share the id "${base}"`);
    }
    ids.add(base);
    return base;
  };

  const loadDoc = (docId: string) => {
    if (!docs.has(docId)) {
      // A doc is either content/<id>.md or content/<id>/index.md (a folder with its images).
      const candidates = [
        path.join(contentDir, `${docId}.md`),
        path.join(contentDir, docId, 'index.md'),
      ];
      const file = candidates.find((candidate) => existsSync(candidate));
      if (!file) {
        throw new ContentError(
          fsPath,
          `doc "${docId}" needs ${docId}.md or ${docId}/index.md`,
        );
      }
      files.push(file);
      docs.set(
        docId,
        renderDoc(docId, readFileSync(file, 'utf8'), file, rootDir),
      );
    }
    return docs.get(docId) as RenderedDoc;
  };

  const walk = (entries: FsEntry[], parent: string): VNode[] =>
    entries.map((entry): VNode => {
      if ('folder' in entry) {
        const id = uniqueId(
          parent ? `${parent}/${slug(entry.folder)}` : slug(entry.folder),
        );
        return {
          kind: 'folder',
          id,
          name: entry.folder,
          icon: entry.icon as VNode['icon'],
          children: walk(entry.children, id),
        };
      }
      if ('doc' in entry) {
        const rendered = loadDoc(entry.doc);
        const name = entry.name ?? rendered.doc.title;
        return {
          kind: 'doc',
          id: uniqueId(parent ? `${parent}/${slug(name)}` : slug(name)),
          name,
          icon: entry.icon as VNode['icon'],
          docId: entry.doc,
        };
      }
      if ('app' in entry) {
        if (!appExists(entry.app)) {
          throw new ContentError(fsPath, `unknown app "${entry.app}"`);
        }
        return {
          kind: 'app',
          id: uniqueId(`${parent || 'desktop'}/app-${entry.app}`),
          name: entry.name,
          icon: entry.icon as VNode['icon'],
          appId: entry.app,
        };
      }
      return {
        kind: 'link',
        id: uniqueId(
          parent ? `${parent}/${slug(entry.name)}` : slug(entry.name),
        ),
        name: entry.name,
        icon: entry.icon as VNode['icon'],
        href: entry.link,
      };
    });

  const tree: FolderNode = {
    kind: 'folder',
    id: 'desktop',
    name: 'Desktop',
    children: walk(entries, ''),
  };
  return { tree, docs, files };
}

// ---------- Module code ----------

/** `virtual:vfs`: the tree plus a lazy loader per document. */
export function vfsModuleCode(result: ContentResult): string {
  const loaders = [...result.docs.keys()]
    .map(
      (docId) =>
        `  ${JSON.stringify(docId)}: () => import(${JSON.stringify(`virtual:doc/${docId}`)}),`,
    )
    .join('\n');
  return `export const tree = ${JSON.stringify(result.tree)};\nexport const docLoaders = {\n${loaders}\n};\n`;
}

/** `virtual:doc/<id>`: one document, with its images imported so Vite hashes them. */
export function docModuleCode(rendered: RenderedDoc): string {
  const imports = rendered.images
    .map((src, i) => `import image${i} from ${JSON.stringify(src)};`)
    .join('\n');
  const replacements = rendered.images
    .map((_, i) => `.replaceAll(${JSON.stringify(imageToken(i))}, image${i})`)
    .join('');
  const { html, ...rest } = rendered.doc;
  return `${imports}\nconst doc = ${JSON.stringify(rest)};\ndoc.html = ${JSON.stringify(html)}${replacements};\nexport default doc;\n`;
}
