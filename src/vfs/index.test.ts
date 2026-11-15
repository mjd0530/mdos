import { describe, expect, it } from 'vitest';
import { desktop, findNode, loadDoc, pathTo } from './index';

// These run against the real content/ folder through the Vite plugin.

describe('the real content', () => {
  it('has a Read Me on the desktop and a Portfolio folder', () => {
    const names = desktop.children.map((node) => node.name);
    expect(names).toContain('Read Me');
    expect(names).toContain('Portfolio');
  });

  it('finds nodes and their path from the desktop', () => {
    const magicMove = findNode('portfolio/tap-to-launch');
    expect(magicMove).toMatchObject({
      kind: 'doc',
      docId: 'portfolio/magic-move',
    });
    expect(pathTo('portfolio/tap-to-launch').map((n) => n.id)).toEqual([
      'desktop',
      'portfolio',
      'portfolio/tap-to-launch',
    ]);
  });

  it('loads a document lazily, with real image URLs in place of tokens', async () => {
    const doc = await loadDoc('portfolio/magic-move');
    expect(doc.title).toBe('Tap to Launch');
    expect(doc.caseStudy?.role).toBe('Lead UX Designer');
    expect(doc.html).not.toContain('__MIKEOS_IMAGE_');
    expect(doc.html).toMatch(/src="[^"]*tap-and-share[^"]*\.webp"/);
  });

  it('rejects unknown documents', async () => {
    await expect(loadDoc('nope')).rejects.toThrow(/No document/);
  });
});
