# Architecture

_Source of truth for how Mike OS is built. Decisions referenced as D-xxx live in `docs/decisions.md`._

## 1. Shape of the system

A fully static single-page app (D-005, D-011). Everything is generated from `content/` at build time and served from GitHub Pages at `os.mikedemar.com`.

```
content/  ──build (Vite plugin)──▶  vfs.json + docs/*.json + optimized images  ──▶  React app  ──▶  GitHub Pages
                                  └▶ /plain/*.html (no-JS, SEO, screen-reader view)
```

No server, no API keys, no runtime CMS. The only third-party call is Open-Meteo for weather, made from the browser.

## 2. Repository layout

```
content/                    all words and pictures; no code
  fs.yaml                   the desktop/folder tree
  readme.md
  about/*.md
  portfolio/<slug>/index.md + images/
  sketchbook/manifest.yaml + images/
  personal/*.md
  contact.md
src/
  main.tsx                  boot
  os/                       the shell: MenuBar, Desktop, DesktopIcon, WindowLayer, Window,
                            ContextMenu, Clock, CursorClock, ScreenSaver, Announcer, shells/
  apps/<id>/                one folder per app (see §5)
  ui/                       shared System 7 controls
  stores/                   windows.ts, desktop.ts, settings.ts
  vfs/                      types, lookup helpers, open-file → app resolution
  styles/                   tokens.css, fonts.css, base.css
  assets/icons/             our 1-bit icons (SVG)
build/
  content-plugin.ts         Vite plugin: read content/, validate (Zod), emit vfs + docs + plain view
  images.ts                 resize drawings/case-study images (sharp, build-time only)
tests/                      Vitest unit + Playwright e2e/axe
docs/
```

## 3. Content pipeline and virtual filesystem

**Input.** `content/fs.yaml` describes the tree and points at content files:

```yaml
desktop:
  - folder: Portfolio
    children:
      - doc: portfolio/magic-move      # opens in Notes
      - doc: portfolio/vantage
      - doc: portfolio/hello-design-system
  - folder: Sketchbook
    source: sketchbook/manifest.yaml   # each entry becomes an image file
  - doc: about/biography               # "About Mike" on the desktop
    opensOnFirstVisit: true            # opens by itself on a first visit
  - image: about/portrait.jpg          # a single picture (needs name + alt); opens in Viewer
  - doc: readme                        # "Read Me" on the desktop
  - app: weather
  - link: { name: LinkedIn, href: "https://www.linkedin.com/in/mikedemar/" }
```

**Validation.** Zod schemas for `fs.yaml`, document front matter and the sketchbook manifest. A missing `alt`, a broken path or an unknown app id fails the build.

**Output.**
- `virtual:vfs`: the tree as metadata only (ids, names, icons, kinds, sizes for list view). Imported at boot; small.
- `docs/<id>.json`: each document's rendered HTML and metadata, **fetched when opened**, so case studies don't slow the first load.
- Images: hashed URLs; drawings get a thumbnail (~240px) and a display size (~1600px).
- `/plain/`: static HTML pages of every public document plus an index.

**Node kinds.**
```ts
type VNode =
  | { kind: 'folder'; id; name; icon?; children: VNode[] }
  | { kind: 'doc';    id; name; icon?; docId: string }        // → Notes
  | { kind: 'image';  id; name; thumb; full; alt; title?; date?; description? } // → Viewer
  | { kind: 'app';    id; name; appId: AppId }
  | { kind: 'link';   id; name; href: string }                 // opens new tab, with confirmation alert
  | { kind: 'alias';  id; name; target: string };              // points at another node id
```
`openNode(node)` is the single entry point: folders → Files, docs → Notes, images → Viewer, apps → their app, links → new tab. Apps declare which kinds they `handle`, so nothing hardcodes these pairings in the UI.

**Markdown.** Rendered to HTML at build time (build-only dependency, e.g. `marked`), from our own trusted content. Images inside a document are wrapped in buttons that open the Viewer.

## 4. State and persistence

Zustand stores, each persisted under a versioned key; any parse failure falls back to defaults (storage access wrapped in try/catch).

| Store | Holds | Persisted |
|---|---|---|
| `windows` | instances, z-order, focus, rect, state, payload | rects per app; open windows only if "Reopen windows" is on |
| `desktop` | icon positions, selection, label editing | positions only |
| `settings` | desktop pattern, sounds, screensaver delay/enabled, cursor clock, weather location | all |

Special → Reset Desktop clears every `mikeos:*` key and reloads to defaults.

## 5. Application framework

```ts
// src/apps/notes/index.ts
export default defineApp({
  id: 'notes',
  name: 'Notes',
  icon: icons.notes,
  handles: ['doc'],
  instances: 'per-document',          // 'single' | 'multiple' | 'per-document'
  window: { size: [560, 480], minSize: [320, 240], resizable: true },
  menus: notesMenus,                  // optional; merged into the menu bar while focused
  load: () => import('./NotesApp'),
});
```

- Registry = `import.meta.glob('../apps/*/index.ts', { eager: true })`. Adding an app is adding a folder.
- App components get `AppProps { instanceId, payload, isActive, setTitle, close }` and render **content only**. `Window` owns chrome, focus, error boundary and the loading state.
- Each app: `index.ts`, `<Name>App.tsx`, `use<Name>Logic.ts` (behaviour), `<Name>App.module.css`. Apps build their UI from `src/ui/`.

**v1 apps**

| App | Handles | Notes |
|---|---|---|
| Files | folder | Icon and list views, back/forward, path pop-up; icon view of Sketchbook shows thumbnails |
| Notes | doc | Case studies, About, Read Me, Personal, Contact (D-009) |
| Viewer | image | Single image, prev/next within its folder, title/date/description |
| Weather | app | Open-Meteo; default Cary, NC; location only on explicit request |
| Control Panel | app | Desktop pattern, sounds, screensaver, cursor clock, reset |
| Screensaver | system | Not a window; idle overlay owned by the shell |

## 6. Window manager

```ts
interface WindowInstance {
  id: string; appId: AppId; title: string; payload?: unknown;
  rect: { x: number; y: number; w: number; h: number };
  state: 'normal' | 'collapsed' | 'zoomed';   // System 7: close box, zoom box, collapse (WindowShade)
  z: number;
}
```
Actions: `open`, `close`, `focus`, `move`, `resize`, `toggleZoom`, `toggleCollapse`, `cycleFocus`. `open` reuses an existing window per the app's `instances` rule.

- **Pointer Events** for drag (title bar) and resize (grow box, plus edges on touch); title bar is kept on-screen.
- New windows cascade; each app remembers its last rect.
- Active window: horizontal-stripe title bar and close/zoom boxes. Inactive: plain title bar, no boxes, content fully readable.
- Open/close "zoom rect" outline (CSS), removed under reduced motion.

**Keyboard and screen readers**
- Window = `<section role="dialog" aria-modal="false" aria-labelledby=title>`; final role confirmed with VoiceOver testing in the window step.
- Opening moves focus into the window; closing returns focus to whatever opened it.
- `Ctrl/⌘+\`` next window · `Ctrl/⌘+W` close · `Ctrl/⌘+O` open selection · `Esc` closes menus.
- Window menu → "Move/Resize with keyboard": arrows move or resize, Enter commits, Esc cancels.
- `Announcer` live region: "Notes: Magic Move opened", "Window closed".

## 7. Shell and responsive

| Width | Shell |
|---|---|
| ≥ 1024 px | `DesktopShell`: menu bar, desktop icons, free windows, cursor clock |
| 768–1023 px | `DesktopShell` with larger hit areas (≥ 44 px), windows open zoomed, long-press = context menu |
| < 768 px | `LauncherShell`: full-screen icon grid; one app at a time, full-screen, with a title bar and back button; compact menu bar |

Same apps and stores in every shell.

**App switching.** System 7 had no dock; it switched apps from the Application menu at the right of the menu bar. Whether we use that, a dock, or both is an open design question for the Desktop step.

## 8. Visual system (System 7, D-004)

- Tokens in `tokens.css`: black, white, a 4-step grey ramp, 1px/2px borders, the 1px drop shadow on windows and menus, desktop pattern tiles. No other colours in chrome.
- Fonts: openly licensed bitmap-style faces for the system font (menus, titles) and the document font (D-003). Chosen and license-checked in the design-system step.
- Icons: our own 32×32 and 16×16 1-bit SVGs drawn on a pixel grid, `shape-rendering: crispEdges`.
- Scale: the UI renders at integer multiples (1× / 2×) so pixels stay crisp; `image-rendering: pixelated` for bitmaps.

## 9. Accessibility (WCAG 2.1 AA)

See CLAUDE.md for the rules. Architectural pieces: the Announcer, focus return on close, a roving-tabindex icon grid, the WAI-ARIA menubar pattern, the keyboard move/resize mode, the `/plain/` view, and reduced-motion handling in one place (`settings` + media query).

## 10. Build, test, deploy

- `npm run dev` · `build` · `preview` · `check` (tsc) · `lint` · `test` (Vitest) · `e2e` (Playwright + axe).
- GitHub Actions: on every push run check, lint, unit, e2e. On `main`, build and deploy to GitHub Pages. `public/CNAME` = `os.mikedemar.com`; DNS: a `CNAME os → mjd0530.github.io` record in Route 53.
- Budgets: initial JS (gzip) ≤ 120 KB before apps; Lighthouse Performance ≥ 90, Accessibility 100.
