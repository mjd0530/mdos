import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import { contentPlugin } from './build/content-plugin.ts';

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

// https://vite.dev/config/
export default defineConfig({
  // Where the site is served from. CI sets BASE_PATH=/mdos/ while the site lives at
  // mjd0530.github.io/mdos/; it becomes '/' once os.mikedemar.com is set up (D-013).
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), contentPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'build/**/*.test.ts'],
    passWithNoTests: true,
  },
});
