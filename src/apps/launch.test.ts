import { describe, expect, it } from 'vitest';
import { findExistingWindow } from './launch';
import { buildRegistry } from './registry';
import { defineApp, type AppDefinition } from './types';

const stub = (overrides: Partial<AppDefinition>): AppDefinition =>
  defineApp({
    id: 'x',
    name: 'X',
    icon: 'document',
    instances: 'multiple',
    load: () => Promise.resolve({ default: () => null }),
    ...overrides,
  });

const windows = [
  { id: 'w1', appId: 'panel' },
  { id: 'w2', appId: 'notes', key: 'readme' },
  { id: 'w3', appId: 'notes', key: 'about' },
  { id: 'w4', appId: 'hello' },
];

describe('findExistingWindow', () => {
  it('single-instance apps reuse their window', () => {
    const app = stub({ id: 'panel', instances: 'single' });
    expect(findExistingWindow(app, undefined, windows)).toBe('w1');
  });

  it('multiple-instance apps always open a new window', () => {
    const app = stub({ id: 'hello', instances: 'multiple' });
    expect(findExistingWindow(app, undefined, windows)).toBeUndefined();
  });

  it('per-document apps reuse the window for the same document only', () => {
    const app = stub({
      id: 'notes',
      instances: 'per-document',
      documentKey: (payload) => String(payload),
    });
    expect(findExistingWindow(app, 'about', windows)).toBe('w3');
    expect(findExistingWindow(app, 'contact', windows)).toBeUndefined();
  });
});

describe('buildRegistry', () => {
  it('rejects duplicate ids', () => {
    expect(() => buildRegistry([stub({}), stub({})])).toThrow(/Duplicate/);
  });

  it('requires documentKey for per-document apps', () => {
    expect(() => buildRegistry([stub({ instances: 'per-document' })])).toThrow(
      /documentKey/,
    );
  });
});
