// The plain view: every public document as a simple static HTML page under /plain/, for
// visitors without JavaScript, search engines, and anyone who prefers reading to exploring.

import type { FolderNode, VNode } from '../src/vfs/types.ts';
import { imageToken, type ContentResult, type RenderedDoc } from './content.ts';

export interface PlainOptions {
  /** Site base path, e.g. "/" or "/mdos/". */
  base: string;
  /** Final URL of a document image, from its root-relative source path. */
  docImage: (source: string) => string;
  /** Final URL of a gallery image, from its asset index. */
  galleryImage: (index: number, variant: 'display' | 'thumb') => string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const STYLE = `
  :root { color-scheme: light dark; }
  body { max-width: 68ch; margin: 0 auto; padding: 1.5rem 1rem 4rem;
    font: 1.0625rem/1.6 system-ui, sans-serif; }
  h1, h2, h3 { line-height: 1.25; }
  img { max-width: 100%; height: auto; }
  figure { margin: 1.5rem 0; }
  figcaption { font-size: 0.9375rem; opacity: 0.8; }
  blockquote { margin: 1.5rem 0; padding-left: 1rem; border-left: 3px solid; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; }
  dt { font-weight: 600; } dd { margin: 0; }
  nav { margin-bottom: 2rem; }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap: 1rem; padding: 0; list-style: none; }
`.replace(/\s+/g, ' ');

function page(
  options: PlainOptions,
  title: string,
  description: string,
  body: string,
): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="icon" type="image/svg+xml" href="${options.base}favicon.svg">
<style>${STYLE}</style>
</head>
<body>
${body}
</body>
</html>
`;
}

export const plainDocPath = (docId: string) => `plain/${docId}/index.html`;
const docHref = (options: PlainOptions, docId: string) =>
  `${options.base}plain/${docId}/`;

/** Turn the app's document HTML into plain HTML: pictures become figures, headings move
 *  up a level (the page has its own h1), image tokens become real URLs. */
export function plainBody(
  rendered: RenderedDoc,
  options: PlainOptions,
): string {
  let html = rendered.doc.html
    .replace(/<button type="button" class="doc-image"[^>]*>/g, '<figure>')
    .replace(/<span class="visually-hidden">View larger: <\/span>/g, '')
    .replace(
      /<\/button><span class="doc-caption">([\s\S]*?)<\/span>/g,
      '<figcaption>$1</figcaption></figure>',
    )
    .replace(/<\/button>/g, '</figure>')
    .replace(
      /<(\/?)h([3-6])\b/g,
      (_match, slash: string, level: string) =>
        `<${slash}h${Number(level) - 1}`,
    );
  rendered.images.forEach((source, i) => {
    html = html.replaceAll(imageToken(i), options.docImage(source));
  });
  return html;
}

function docPage(rendered: RenderedDoc, options: PlainOptions): string {
  const { doc } = rendered;
  const study = doc.caseStudy;
  const header = study
    ? `${study.subtitle ? `<p><strong>${escapeHtml(study.subtitle)}</strong></p>` : ''}
<p>${escapeHtml(study.summary)}</p>
<dl>
<dt>Role</dt><dd>${escapeHtml(study.role)}</dd>
<dt>Client</dt><dd>${escapeHtml(study.client)}</dd>
<dt>Years</dt><dd>${escapeHtml(study.years)}</dd>
<dt>Scope</dt><dd>${escapeHtml(study.scope.join(', '))}</dd>
${study.awards ? `<dt>Award</dt><dd>${escapeHtml(study.awards)}</dd>` : ''}
</dl>`
    : '';
  return page(
    options,
    `${doc.title} · Mike DeMar`,
    study?.summary ?? `${doc.title}, from Mike DeMar's portfolio.`,
    `<nav><a href="${options.base}plain/">← All pages</a> · <a href="${options.base}">Open MDOS</a></nav>
<main>
<h1>${escapeHtml(doc.title)}</h1>
${header}
${plainBody(rendered, options)}
</main>`,
  );
}

function listing(nodes: VNode[], options: PlainOptions): string {
  const images = nodes.filter((n) => n.kind === 'image');
  const others = nodes.filter((n) => n.kind !== 'image' && n.kind !== 'app');
  if (images.length === 0 && others.length === 0) {
    return '<p>Nothing here yet.</p>';
  }
  const items = others
    .map((node) => {
      if (node.kind === 'doc') {
        return `<li><a href="${docHref(options, node.docId)}">${escapeHtml(node.name)}</a></li>`;
      }
      if (node.kind === 'link') {
        return `<li><a href="${escapeHtml(node.href)}" rel="noopener noreferrer">${escapeHtml(node.name)}</a></li>`;
      }
      if (node.kind === 'folder') {
        return `<li><strong>${escapeHtml(node.name)}</strong>\n${listing(node.children, options)}</li>`;
      }
      return '';
    })
    .join('\n');
  const gallery = images
    .map((node) => {
      if (node.kind !== 'image') return '';
      const index = Number(/_(\d+)__$/.exec(node.src)?.[1] ?? -1);
      const caption = [node.name, node.date].filter(Boolean).join(', ');
      return `<li><figure><a href="${options.galleryImage(index, 'display')}"><img src="${options.galleryImage(index, 'thumb')}" alt="${escapeHtml(node.alt)}" loading="lazy"></a><figcaption>${escapeHtml(caption)}</figcaption></figure></li>`;
    })
    .join('\n');
  return `${items ? `<ul>\n${items}\n</ul>` : ''}${gallery ? `<ul class="gallery">\n${gallery}\n</ul>` : ''}`;
}

function indexPage(tree: FolderNode, options: PlainOptions) {
  return page(
    options,
    'Mike DeMar · plain version of MDOS',
    "Mike DeMar's portfolio as plain pages: case studies, about, sketchbook and contact.",
    `<main>
<h1>Mike DeMar</h1>
<p>This is the plain version of <a href="${options.base}">MDOS</a>, my portfolio built as a
little desktop computer. Everything in it is listed here as ordinary pages.</p>
${listing(tree.children, options)}
</main>`,
  );
}

/** Every plain page, keyed by its output file name. */
export function plainPages(
  result: ContentResult,
  options: PlainOptions,
): Map<string, string> {
  const pages = new Map<string, string>();
  pages.set('plain/index.html', indexPage(result.tree, options));
  for (const [docId, rendered] of result.docs) {
    pages.set(plainDocPath(docId), docPage(rendered, options));
  }
  return pages;
}
