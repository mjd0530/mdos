import type { Plugin } from 'vite';

// A Content Security Policy for the built app (D-028). Mike OS loads only its own files
// and talks only to Open-Meteo, so everything else is refused. Build only: Vite's dev
// server needs inline scripts for hot reload.
const POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  // React sets element styles through the DOM (allowed); 'unsafe-inline' covers the few
  // style attributes in rendered Markdown and SVG.
  "style-src 'self' 'unsafe-inline'",
  // data: for the pixel-art patterns and chrome, which are inline SVG images.
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://api.open-meteo.com https://geocoding-api.open-meteo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export function cspPlugin(): Plugin {
  return {
    name: 'mikeos-csp',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: POLICY },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}
