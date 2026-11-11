import type { AppDefinition } from './types';

// Every folder in src/apps/ with an index.ts is an app. Definitions are tiny and loaded
// eagerly; each app's component is loaded lazily by its own `load()`.
const modules = import.meta.glob<{ default: AppDefinition }>('./*/index.ts', {
  eager: true,
});

export function buildRegistry(
  definitions: AppDefinition[],
): Map<string, AppDefinition> {
  const registry = new Map<string, AppDefinition>();
  for (const app of definitions) {
    if (registry.has(app.id)) throw new Error(`Duplicate app id "${app.id}"`);
    if (app.instances === 'per-document' && !app.documentKey) {
      throw new Error(`App "${app.id}" is per-document but has no documentKey`);
    }
    registry.set(app.id, app);
  }
  return registry;
}

export const APPS = buildRegistry(
  Object.values(modules).map((module) => module.default),
);

export function getApp(appId: string): AppDefinition | undefined {
  return APPS.get(appId);
}
