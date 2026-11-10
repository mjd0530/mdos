import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  // Where the site is served from. CI sets BASE_PATH=/mdos/ while the site lives at
  // mjd0530.github.io/mdos/; it becomes '/' once os.mikedemar.com is set up (D-013).
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'build/**/*.test.ts'],
    passWithNoTests: true,
  },
});
