# Mike OS: working draft

> Decisions: `docs/decisions.md`. Design: `docs/architecture.md`. Build order: `docs/implementation-plan.md`.

An interactive, browser-based desktop OS inspired by early Macintosh System 1–7, serving as Mike DeMar's personal portfolio. Visitors explore files, folders and apps that reveal Mike's work, art and personality. It should feel like a working computer, not a website with a retro skin.

New project, separate from the Astro portfolio (`~/Documents/GitHub/website`). Reuse its content and decisions, not its framework.

## How we work
- Mike leads creative direction. Claude is product designer, UX architect and senior frontend engineer: recommend, explain tradeoffs, challenge weak assumptions.
- Discuss before major design or architecture changes; record decisions in `docs/decisions.md`.
- Build in phases: core desktop framework first, verified, then apps one at a time.
- Ask a few questions at a time. Branch per phase/feature; commit or push only when asked.
- Keep docs current in the same change as the code.

## References
- ryOS (`ryokun6/ryos`): **AGPL-3.0. Study patterns only; never copy code.**
- Classic Mac Elements (`danmorgandesigns/classic-mac-elements`): **no license, Apple-derived. Visual reference only; don't ship its files.**
- ryo.lu: a fast, personal front door; the OS is the layer you choose to enter.
- No Apple logo, "Macintosh", "Finder" or Apple system sounds in the product.

## Stack (D-011)
- Vite + React + TypeScript strict. Zustand for state (persisted keys `mikeos:*`, versioned).
- Plain CSS tokens + CSS Modules. No Tailwind, no CSS-in-JS, no animation library.
- Static site, no server. Hosting (D-005): GitHub Pages, deployed by GitHub Actions. Temporarily at `mjd0530.github.io/mdos/` (D-013): never hard-code root `/` URLs; use imports or `import.meta.env.BASE_URL`.
- No new dependency without stating why and the alternative.
- Commands: `npm run dev` · `build` · `preview` · `check` (tsc) · `lint` (oxlint + Prettier) · `test` (Vitest) · `e2e` (Playwright + axe, builds first, port 4330).
- Node 24 LTS (`.nvmrc`); CI uses it. Local npm 10 has a resolver bug with this tree: install with `npx npm@11 install`.

## Architecture
- `src/os/` shell: `OS` (desktop + alerts), `menubar/` (MenuBar, menu types), `menus.ts` (system menus as data), Clock, Announcer (`announce()`), `windows/` (store, geometry, Window, WindowLayer), DesktopIcons + `desktopStore`, IconView (desktop + Files), `open.ts` (`openNode`: the only way to open a VNode), `persist.ts` (safe `storage` for Zustand `persist`; all keys start `mikeos:`; sanitise on load), `settings.ts` (visitor preferences shown in Control Panel; add a setting only with the feature it controls). Menus are data (`MenuDef`), not JSX.
- `src/apps/<id>/` one folder per app: `index.ts` (`defineApp`), `<Name>App.tsx` (default export), `<Name>App.module.css`. Apps render content only; `Window` owns chrome. How-to: `docs/application-framework.md`. Open with `launch(appId, payload)`.
- `src/ui/` shared controls (Button, Checkbox, Slider, ListView, IconGrid, ScrollArea, Alert…). Apps use these, never one-off copies.
- `src/stores/` windows, desktop, settings (+ app stores only when needed).
- Adding an app = adding a folder. Adding content = editing `content/`, never app code.

## Virtual filesystem and content
- `content/` holds all content (Markdown + `fs.yaml` + images); guide: `docs/content.md`. `build/content-plugin.ts` validates it and emits `virtual:vfs` + lazy `virtual:doc/<id>` modules; read them via `src/vfs` (`desktop`, `findNode`, `pathTo`, `loadDoc`).
- Node kinds: folder (→ Files), doc (→ Notes), app, link. Body headings start at `##`.
- Read-only for visitors. Required `alt` on every image. Don't invent facts, metrics or quotes; leave `TODO(mike):`.

## Public content only
- All portfolio content is public; there is no NDA work (D-006). Still, this repo is public: if anything looks internal or unreleased, flag it and ask before committing.

## Visual direction
- System 7 (D-004): black and white plus a short grey ramp for bevels, title-bar stripes and frames. Grey is for chrome only; text stays black on white. Colour sparingly, never for chrome.
- Pixel-exact. Bitmap fonts, crisp edges (`image-rendering: pixelated`), no smooth gradients, blurs or soft shadows.
- Lives at `os.mikedemar.com` beside the Astro site (D-002).
- Original Mike-specific 1-bit icons and 8×8 desktop patterns, drawn as text rows (`src/assets/icons/icons.ts`, `src/assets/patterns.ts`; key in `src/ui/pixels.ts`) and rendered by `PixelIcon` / `patternDataUri`. Selected icons invert. Fonts (D-014): Pixel Operator HB for system chrome, Pixel Operator for text, CC0; 16px or whole multiples only.
- Design specimen at `/specimen.html` (dev only): add each new building block there for review.
- Never place text on dither patterns.

## Accessibility (WCAG 2.1 AA)
- Every mouse action has a keyboard path: menubar pattern, roving-tabindex icon grid, keyboard window move/resize, Ctrl/⌘+` to cycle windows.
- Focus moves into opened windows and returns on close. Live region announces window changes.
- Real buttons for window controls; labelled windows; ≥ 44px targets on touch.
- Respect `prefers-reduced-motion`. No autoplay audio. Decorative cursor clock is `aria-hidden` and never intercepts input.
- Plain HTML view of all public content for no-JS and screen readers.

## Responsive
- `useDeviceMode()` (D-024): phone < 768px = launcher grid, single tap, one full-screen window; tablet 768–1023px or coarse pointer = desktop with zoomed windows and long-press menus; desktop otherwise. Same apps and stores everywhere.
- E2E runs on desktop, Pixel 7 and iPad Mini; use `tests/e2e/device.ts` where behaviour differs.

## Verify before calling it done
- Typecheck, lint, unit tests (Vitest), Playwright + axe pass.
- Check in the built-in browser at 375 / 768 / 1280 px, keyboard-only, and with reduced motion.
- Report what was and wasn't verified.

## Skills and agents
- Installed: `code-review` per phase, `simplify` after component work, `security-review` before launch and for hosting changes, `run` to drive the dev server.
- Recommended to install: Anthropic **frontend-design** and **Design** (`accessibility-review`, `design-critique`, `design-system`, `ux-copy`).
- Parallel subagents only after the core framework is stable: per-app builds, accessibility audit, visual QA.

## Docs (to create as decisions land)
`docs/discovery.md` (now) · `project-brief` · `design-direction` · `design-system` · `architecture` · `application-framework` · `virtual-filesystem` · `content-management` · `ai-twin` · `decisions` · `implementation-plan`
