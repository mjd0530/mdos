# Decisions

ADR-style log. Each entry: context, decision, consequences.

---

## D-001 Separate project, not the Astro site
_2026-11-10 · Accepted_

Mike OS is a new codebase in `mjd0530/mdos`. The Astro portfolio (`mjd0530/website`) stays as-is. We reuse its content and past decisions, not its framework.

## D-002 Location: `os.mikedemar.com`
_2026-11-10 · Accepted_

Mike OS lives at `os.mikedemar.com`, next to the Astro site at `mikedemar.com`, and the two link to each other. **How** they link (a desktop-icon teaser on the Astro home page, a "Restart in Mike OS" link, etc.) is a design question for later.
**Consequence:** one CNAME record in Route 53; the apex domain and the Astro site are untouched.

## D-003 Original assets, no Apple marks
_2026-11-10 · Accepted_

- ryOS is AGPL-3.0: study its patterns, never copy its code.
- Classic Mac Elements has no license and is derived from Apple's work: visual reference only, none of its files ship.
- We draw original 1-bit icons, use only openly licensed fonts (license recorded per font), and make or source CC0 sounds.
- No Apple logo, "Macintosh", "Finder", "System 7" or Apple system sounds in the product UI. An "Inspired by" credit in About is fine.

## D-004 Visual era: System 7
_2026-11-10 · Accepted (to be explored in Phase 4)_

Mostly black and white, with System 7's small set of greys for depth: bevelled buttons and scroll bars, grey title-bar stripes and window frames. Colour is used sparingly, if at all (e.g. icons or artwork), never for chrome.
**Consequences:**
- Design tokens include a short grey ramp (about 4 steps) on top of black and white.
- Grey is for chrome and decoration only. Text stays black on white (or white on black) so contrast stays well above AA.
- Inactive windows can drop their bevels and stripes the way System 7 did, but their content stays fully readable.

## D-005 Hosting
_2026-11-10 · Accepted: GitHub Pages_

With no server needs (D-006, D-007), GitHub Pages serves the static build at `os.mikedemar.com` via a GitHub Actions deploy. Cloudflare Pages is the fallback if we later want branch previews or a server function.

## D-006 No NDA content
_2026-11-10 · Accepted_

Nothing in the portfolio is under NDA. No access-control system, private repo or `locked` filesystem node is needed. Every case study is public.

## D-007 No AI twin
_2026-11-10 · Accepted_

Mike AI is removed from scope. No chat app, API keys, server functions or knowledge base. This also removes the only reason for a server, so the site is fully static.

## D-008 No music player
_2026-11-10 · Accepted_

The music player is removed from scope. No audio files, playlist or licensing questions. System sounds (our own, D-003) stay, off or quiet by default.

## D-009 Case studies open as Notes documents
_2026-11-10 · Accepted_

Each portfolio project is a document file in the Portfolio folder. Double-clicking it opens a **Notes** window: a System 7 text-document window showing the full case study (headings, text, metadata, inline images). Clicking an image opens it larger in the image viewer.
**Consequences:**
- One document app serves case studies, About, Read Me and Personal notes. No separate "Portfolio app".
- Case studies are ported from the Astro site's MDX to plain Markdown with front matter (title, client, years, role, scope, impact, images with required `alt`). Full text, not summaries.
- Long documents scroll inside the window; a heading list in the window's menu lets keyboard and screen-reader users jump between sections.

## D-010 Sketchbook: local folder + manifest
_2026-11-10 · Accepted_

10–20 drawings to start. That's small enough for images in `content/sketchbook/` plus a `manifest.yaml` (file, title, date, alt, optional description). Adding a drawing = add the image + a few manifest lines + push; GitHub Actions redeploys. No CMS.
A build script resizes each drawing into a thumbnail and a full-size version, so Mike can drop in original exports.

## D-011 Stack
_2026-11-10 · Accepted_

Vite + React + TypeScript strict; Zustand (+ persist) for state; plain CSS tokens + CSS Modules; our own window manager on Pointer Events; Zod for content validation; Vitest + Playwright + axe for tests. Radix for menus is still to be evaluated in the menu bar step. No other runtime dependencies without a stated reason.

## D-012 Scaffold tooling
_2026-11-10 · Accepted_

Current Vite template versions: Vite 8, React 19, TypeScript 7 (strict + `noUncheckedIndexedAccess`). **oxlint** instead of ESLint (the Vite default; one fast binary, no plugin tree). Prettier for formatting (Markdown docs excluded). Vitest 5, Playwright + `@axe-core/playwright` on desktop and mobile Chrome. Node 24 LTS in CI (`.nvmrc`).

## D-013 Temporary address: `mjd0530.github.io/mdos/`
_2026-11-10 · Accepted_

DNS is deferred. Until then the site is served from GitHub's default address, so the CI build sets `BASE_PATH=/mdos/` and there is no `public/CNAME`.
**To switch to `os.mikedemar.com` (D-002):** add a Route 53 CNAME `os → mjd0530.github.io`; restore `public/CNAME` containing `os.mikedemar.com`; remove `BASE_PATH` from `.github/workflows/ci.yml`; set the custom domain and Enforce HTTPS in Settings → Pages.
**Rule until then:** asset and link URLs go through Vite (imports, `import.meta.env.BASE_URL`), never hard-coded `/…` paths, so they work under both addresses.

## D-014 Fonts: Pixel Operator HB + Pixel Operator
_2026-11-10 · Accepted_

**Context.** No openly licensed Chicago lookalike exists: "Chicago Kare" copies Apple's design, has no published license and uses Apple's trademarked name (ruled out by D-003). Mike chose existing fonts over drawing our own.
**Compared** (specimen, 2026-11-10): Pixel Operator Bold + Regular; **Pixel Operator HB + Regular**; Pixelify Sans Bold + Pixel Operator; Pixelify Sans throughout.
**Decision.** System face (menus, titles, buttons, dialogs): **Pixel Operator HB**. Document face (reading text, labels): **Pixel Operator** Regular/Bold.
**License.** CC0 1.0 (full text in `src/assets/fonts/pixel-operator/LICENSE.txt`); by Jayvee Enaguas, v2018.10.04, from fontlibrary.org.
**Rules.** Drawn on a 16px grid: use 16px or whole multiples only (tokens `--font-size-body/title` = 16px, `--font-size-display` = 32px). TTF files are small (~17 KB each), so no WOFF2 conversion for now.

## D-015 Menus are hand-built, not Radix
_2026-11-10 · Accepted_

**Why.** System 7 menus need press-drag-release, hover-to-switch while open, inverted highlights and pixel glyphs; Radix Menubar would need overriding in most of those places and adds several packages. The WAI-ARIA menubar pattern is ~250 lines (`src/os/menubar/MenuBar.tsx`).
**Guardrails.** Playwright tests cover mouse, keyboard (one Tab stop, arrows, Home/End, Enter/Space, Esc with focus return), touch taps, and axe with a menu and an alert open (`tests/e2e/menubar.spec.ts`).
**Alerts** use native `<dialog>` + `showModal()` (focus trap, inert page, Esc, focus return for free); focus moves to the default button so Return confirms.

## D-016 No dock; open things from icons
_2026-11-11 · Accepted (Mike)_

There is no dock and no Application menu. Visitors open files, folders and apps by double-clicking their icons on the desktop and in Files windows (steps 7, 9). Switching between open windows: click a window, **Ctrl+`**, or File → Next Window. Revisit only if testing shows visitors get lost.

## D-017 Window manager
_2026-11-11 · Accepted_

- **State:** one Zustand store (`src/os/windows/store.ts`): windows in creation order (DOM order, so restacking never moves focus) plus a separate back-to-front `order`; geometry rules are pure functions with unit tests (`geometry.ts`).
- **Semantics:** each window is `role="dialog" aria-modal="false"` labelled by its title. Opening focuses the window; closing hands focus to the window beneath, else back to whatever opened it. A polite live region announces opens and closes.
- **Keyboard:** the title is focusable; arrows move 16px, Shift+arrows resize. **Ctrl+`** cycles windows (Shift reverses). ⌘` belongs to macOS and ⌘W/Ctrl+W close the browser tab before a page sees them, so neither is used; File → Close Window covers closing.
- **Scroll bars:** custom System 7 bars (arrows, grey track, fixed square thumb) over a natively scrolling, focusable viewport. The bars are pointer-only (`aria-hidden`); keyboard and screen readers scroll natively.
- **Measuring:** the desktop is measured synchronously on mount and then by ResizeObserver, so a window opened in a background tab still fits the screen.

## D-018 App framework
_2026-11-11 · Accepted_

Apps are folders discovered by `import.meta.glob` (`src/apps/*/index.ts`) and declared with `defineApp` (id, name, icon, instance rule, window size, lazy `load`). `launch(appId, payload)` applies the instance rule (`single` / `multiple` / `per-document`). Each app lazy-loads inside its window behind a crash boundary with Close/Relaunch. Installed apps can list themselves in the M menu, as System 7's Apple menu did. Guide: `docs/application-framework.md`. The throwaway **Hello** app proves it and goes when real apps arrive.

## D-019 Content pipeline
_2026-11-11 · Accepted_

`content/` (Markdown + `fs.yaml`) is read by a Vite plugin (`build/content-plugin.ts`, logic in `build/content.ts`). It validates with Zod and emits `virtual:vfs` (the tree, metadata only) plus one lazily loaded `virtual:doc/<id>` module per document, which imports its images so Vite hashes them. Markdown is rendered at build time with `marked`; content is Mike's own, so HTML is trusted, not sanitised. Body headings shift down one level (`##` → h3) to nest under the window's h2. Bad content fails the build with file + reason; in dev it shows the error overlay and keeps the last good version. `yaml`, `marked` and `zod` are build-time devDependencies: nothing extra ships. Sketchbook images (with resizing) come in step 10. Guide: `docs/content.md`.

## D-020 Desktop icons, Files and Notes (first version)
_2026-11-11 · Accepted_

- **Desktop icons** come from `content/fs.yaml`, laid out System 7 style in a column down the right edge. Click selects (icon and label invert), double-click or Enter opens, icons can be dragged, Special → Clean Up Desktop resets them. Right-click / Shift+F10 opens a context menu.
- **One way to open things:** `openNode()` (`src/os/open.ts`): folders → Files, docs → Notes, apps → their app, links → a new tab.
- **IconView** (`src/os/IconView.tsx`) is shared by the desktop and Files: a single-select listbox with a roving tab stop; arrows move to the nearest icon in that direction.
- **Files** navigates inside its window (Back/Forward, clickable path, icon/list views). One window per folder you open from outside.
- **Notes** is a minimal reader for now; step 9 adds the case-study layout and image viewer.
- **Known gap (step 11):** on phones a window covers the desktop icons. The launcher shell replaces windows there.

## D-021 What Mike OS remembers
_2026-11-11 · Accepted_

- **Saved (localStorage, versioned keys `mikeos:desktop`, `mikeos:windows`):** where icons were dragged; the last rect of each keyed window (one per document in Files/Notes, or a single-instance app). Multi-instance windows still cascade.
- **Not saved:** open windows (a visit starts with a clean desktop; an opt-in "reopen windows" can come with Control Panel), selection, anything personal.
- **Defensive:** storage access never throws (private mode, blocked data); saved values are sanitised on load and bad entries dropped; positions are clamped to the current screen.
- **Special → Reset Desktop…** (confirm; Reset is the default) closes every window, puts icons back and deletes every `mikeos:` key.
- Settings (pattern, screensaver, sounds) will use the same `storage` helper in `src/os/persist.ts` (step 12).

## D-022 Notes, Viewer and the ported case study
_2026-11-11 · Accepted_

- **Notes** shows a case-study header (subtitle, summary, Role / Client / Years / Scope, award), a sticky **Contents** menu (native `<details>`, jumps to a section and moves focus to its heading), and the Markdown body.
- **Pictures are buttons** (made at build time, named "View larger: <alt>") that open **Viewer**: one window per picture, fitted or Actual Size, with the Markdown image title as caption. Viewer is reused by the Sketchbook (step 10).
- **Magic Move** is ported from the Astro site with all real copy and the six real images; sections still marked Placeholder there are `TODO(mike)` comments, and the two films wait for video support in Notes.
- **Hello** is now a hidden test fixture: not in any menu; Playwright opens it through a `?e2e` hook to test windows and crash recovery.
- **Known cost:** case-study PNGs ship at full size (up to ~3 MB each, loaded only when that document is opened and scrolled to). Step 10's image pipeline should resize them along with the Sketchbook.

## D-023 Image pipeline, Sketchbook and Viewer sets
_2026-11-11 · Accepted_

- **Every content picture is resized at build time** with `sharp` (devDependency): longest edge 2000px, WebP q82; Sketchbook thumbnails 192px. Output is cached in `node_modules/.cache/mikeos-images` by file content, so unchanged images are never reprocessed. Magic Move's images went from ~7.5 MB to ~0.53 MB with no visible loss in the annotated mockups.
- **Originals stay in git** (they're the source). If the Sketchbook grows large, consider Git LFS. Pushing several MB over HTTPS may need `git -c http.postBuffer=524288000 push`.
- **Sketchbook** is a `gallery:` entry in `fs.yaml`, backed by `content/sketchbook/manifest.yaml` (file, title, alt, optional date and description). Drawings show as thumbnails in Files. It starts empty until Mike adds drawings.
- **Viewer** opens a *set* of pictures (a gallery folder, or every picture in one document) with Previous / Next buttons, ← → while active, and "n of N". One Viewer window per set; opening another picture from the same set switches that window (re-launch passes the new payload).

## D-024 Phones, tablets and desktops
_2026-11-11 · Accepted_

`useDeviceMode()` (`src/os/device.ts`) picks one of three modes from media queries:

| Mode | When | Behaviour |
|---|---|---|
| **phone** | under 768px wide | Desktop icons become a launcher grid; a single tap opens. Windows are full screen and only the front one is shown (`hidden` + `inert` behind it); closing returns to the window behind, then the launcher. No zoom, collapse or resize. |
| **tablet** | 768–1023px, or any coarse pointer | The System 7 desktop, but windows open zoomed (Restore shrinks them). Long-press an icon for its context menu. |
| **desktop** | otherwise | As before. |

**Touch targets** keep the 11px System 7 boxes but extend their hit areas (29 × 45px, never overlapping: neighbouring boxes get a 16px gap); the menu bar grows to 32px and menu items to 44px on coarse pointers. The menu bar fits a 360px phone without sideways scroll.
**Tests** run on desktop Chrome, Pixel 7 and iPad Mini (in Chromium). `tests/e2e/device.ts` helps tests branch where behaviour differs; `phone.spec.ts` and `tablet.spec.ts` cover each mode. Local runs use half the CPU cores so a busy machine doesn't cause timeouts.

## D-025 Control Panel and settings
_2026-11-11 · Accepted_

- **Settings store** (`src/os/settings.ts`, key `mikeos:settings`): desktop pattern and 12/24-hour clock. Saved values are sanitised (unknown pattern names or wrong types fall back to defaults).
- **Control Panel** (single-instance app, listed in the M menu like System 7's Control Panels): pattern swatches as a native radio group (arrow keys work), a 24-hour checkbox, Restore Defaults. Changes apply immediately.
- **Special → Reset Desktop** now also restores settings, so it truly means "start fresh".
- **Only working settings appear.** Screensaver, sounds and the cursor clock get their Control Panel sections when they're built (step 14).

## D-026 Weather
_2026-11-11 · Accepted_

- **Data:** Open-Meteo forecast + geocoding APIs, called from the browser (free, no key, CORS-enabled; non-commercial use with no ads qualifies). Licence CC BY 4.0: the window always shows "Weather data by Open-Meteo.com" linking to open-meteo.com plus a CC BY 4.0 link.
- **Default place:** Cary, NC. Visitors can search for a city (remembered in settings) or press **Use my location** (asked only on click; coordinates rounded to two decimals, about 1 km, before they leave the browser; never saved).
- **Display:** current temperature, condition (WMO code → words + six new 1-bit icons), feels-like, wind, 5-day highs/lows; °F/°C toggle, remembered.
- **Robustness:** 8 s timeout, malformed responses rejected rather than shown, friendly error with Try Again. Tests mock Open-Meteo entirely.
- Weather is on the desktop (`fs.yaml`) and in the M menu.
