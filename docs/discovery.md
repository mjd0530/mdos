# Mike OS: Discovery and Architecture Proposal

_Phase 1 · 2026-11-10 · Status: historical. Decisions since then live in `docs/decisions.md`; the current design is `docs/architecture.md`._

Mike OS is a **new project** in its own repo (`mjd0530/mdos`). It is not built on the Astro portfolio (`mjd0530/website`); that repo is reviewed only as a source of content and past decisions.

---

## 1. What I reviewed

### Existing portfolio (`~/Documents/GitHub/website`)
- Astro 7 static site on GitHub Pages, plain CSS tokens, Playwright + axe + Lighthouse CI. Strong quality bar worth carrying over.
- **Reusable content:** three case studies (`magic-move`, `vantage`, `hello-design-system`) as MDX with a Zod schema (title, subtitle, summary, client, years, role, scope, impact, media with required `alt`, sections). Most text is still `TODO(mike)` placeholders; Magic Move has real images and a film.
- ~~NDA handling (ADR-004)~~: not needed. Mike confirmed nothing is under NDA (D-006).
- The older `md-portfolio-website` (Next.js static export) is superseded; nothing to reuse beyond content.

### ryo.lu
A deliberately tiny front door: one live status sentence ("Ryo is exploring Taipei"), "last seen" line, links to journal, past work and "Explore ryOS". Personality comes from **live, specific detail**, not decoration. The OS is a destination you choose to enter, not the only way in.

**Takeaway for us:** give Mike OS a fast, readable entry point (and a no-JS / screen-reader-friendly plain view) and let the desktop be the delightful layer on top.

### ryOS (`ryokun6/ryos`)
Vite + React + TypeScript, Zustand (42 stores), Tailwind + Radix, Bun API server, Electron, 30 apps, 4 OS themes, i18n, AI chat via Vercel AI SDK, Redis, S3, Pusher.

**License: AGPL-3.0.** Copying any of its code would oblige us to release Mike OS under AGPL and offer its source to every visitor. **We learn patterns only; no code copied.**

Patterns worth adopting:
| Pattern | ryOS | Our version |
|---|---|---|
| App registry | `appRegistry.tsx`: metadata + lazy component + window constraints | Same idea, smaller: one `defineApp()` per app |
| Instance-based windows | `useAppStore` keyed by `instanceId` | Same; single `windows` store |
| Window chrome | `WindowFrame` owns all chrome; apps render content only | Same |
| Logic hook per app | `use[App]Logic` separates behaviour from UI | Same convention |
| Theme via root data-attributes + tokens | `data-os-theme`, `--os-*` tokens | Same, one theme to start |
| Error boundary per window | crash dialog with relaunch | Same ("The application unexpectedly quit") |
| Lazy-loaded apps | code-split per app | Same |

Deliberately **not** adopting: writable IndexedDB filesystem, cloud sync, 42 stores, multi-OS themes, Electron, i18n, chat rooms/realtime. Our filesystem is **read-only content**, which removes most of that complexity.

### Classic Mac Elements (`danmorgandesigns/classic-mac-elements`)
66 pixel-exact SVG icons (alerts, cursors, trash, folders, happy/sad Mac, HyperCard…), bitmap fonts as TTF/WOFF/WOFF2 (Chicago 12, Geneva, New York, Monaco-era Courier, Palatino, Espy Sans), 19 system sounds (Sosumi, Quack, Wild Eep, startup chime).

**License: none.** The repo has no LICENSE file (GitHub reports `license: null`), so by default all rights are reserved. Separately, the material is converted from **Apple's** fonts, icons and sounds, which Apple owns. Neither the repo author nor we can grant ourselves rights to those.

**Recommendation:** use it as a **visual reference only**, don't ship its files. Instead:
- **Icons:** draw our own 1-bit icons (32×32, SVG built from pixel rects, same technique as the repo). This is also where personality lives: a Mike-specific icon set is better than Apple's.
- **Fonts:** pick openly licensed (OFL / CC0) bitmap-style fonts with a Chicago/Geneva feel; verify each license before adding. Candidates to evaluate in Phase 4.
- **Sounds:** record or synthesize our own, or use CC0 sources; no Apple system sounds or startup chime.
- **Trademarks:** no Apple logo, "Macintosh", "Finder" or "System 7" in product UI or branding. Use our own mark in the menu-bar corner and our own app names (e.g. "Finder" → "Files" or a Mike-flavoured name). "Inspired by" in a credits/About file is fine.

---

## 2. Framework and hosting

### Options
| Option | Fit | Notes |
|---|---|---|
| **Vite + React + TS (SPA)** | ✅ Recommended | The whole experience is one long-lived, stateful app. Fast dev, simple build, no server framework to learn. Same core as ryOS. |
| Astro + one big React island | ⚠️ | Astro's strength (zero-JS content pages) goes unused when 95% of the page is one island. Useful only for the plain/SEO view, which Vite can prerender itself. |
| Next.js | ❌ | Server features we don't need; static export loses image optimization; heavier. |
| SvelteKit / Solid | ⚠️ | Fine technically, but a smaller ecosystem for accessible menu/dialog primitives and fewer references. |

### Recommended stack (minimal dependencies)
- **Vite + React 19 + TypeScript strict.**
- **State:** Zustand (+ `persist` middleware). ~1 KB, the one state dependency. Alternative: React context + reducers; more boilerplate for the window store.
- **Styling:** plain CSS with tokens + CSS Modules. No Tailwind. A 1-bit UI has few colours and very specific pixel rules; hand CSS is clearer.
- **Window manager:** our own, built on Pointer Events (drag, resize, touch). No `react-rnd`: it doesn't handle keyboard moving or our focus model, and it's ~200 lines we'd want to own.
- **Accessible primitives:** evaluate **Radix** Menubar / ContextMenu / Dialog (unstyled, robust keyboard + screen reader behaviour) vs hand-rolled WAI-ARIA patterns. Leaning Radix for menus only.
- **Animation:** CSS. Classic Mac motion is the zoom-rect outline and instant state changes; no animation library needed.
- **Content validation:** Zod at build time.
- **Testing:** Vitest (window store, VFS), Playwright + axe (interactions, a11y), the same Lighthouse gates as the portfolio.

### Hosting: GitHub Pages (accepted, D-005)
With Mike AI dropped (D-007) and nothing under NDA (D-006), Mike OS has **no server needs**. Weather comes from Open-Meteo straight from the browser (free, no key). So:

- **GitHub Pages** serves the static build from `mjd0530/mdos` at `os.mikedemar.com`, deployed by a GitHub Action on push to `main`. Same setup as the Astro site; free; no new account.
- Cloudflare Pages remains a fine alternative (its one extra is a preview URL per branch). Switching later is about an hour, since it's a plain static build.
- If a server need ever returns (an AI feature, a form), add a single Cloudflare Worker then.

---

## 3. Desktop architecture

```
<OS>                       boot, theme, global keyboard shortcuts, live-region announcer
 ├─ <MenuBar>              mark menu · File · Edit · View · Special · Help · [app menus] · clock
 ├─ <Desktop>              wallpaper pattern, icon grid, selection, context menu, drop target
 │   └─ <DesktopIcon>×n    from VFS /Desktop
 ├─ <WindowLayer>          renders open windows from the window store, z-ordered
 │   └─ <Window>           chrome: title bar, close/zoom/collapse, resize handle, error boundary
 │       └─ <App …props>   lazy-loaded app content
 ├─ <Dock>                 pinned apps + running/minimized indicators
 ├─ <CursorClock>          decorative, aria-hidden, pointer-events:none
 └─ <ScreenSaver>          idle-timer overlay
```

Stores (Zustand), each with a versioned `mikeos:*` persistence key:
- `windows` – instances, z-order, focus, geometry, minimized/maximized. Persist geometry + "reopen last session" opt-in.
- `desktop` – icon positions, selection (selection not persisted).
- `settings` – wallpaper, sounds on/off, volume, screensaver delay/enabled, cursor clock on/off, reduced motion override.
- `music` – playlist position, volume (playback state not persisted; never autoplays).
- App-specific stores only when an app genuinely needs state across windows.

"Reset desktop" in Special menu clears all `mikeos:*` keys.

---

## 4. Window manager

**Model**
```ts
interface WindowInstance {
  id: string;            // instance id
  appId: AppId;
  title: string;
  payload?: unknown;     // e.g. { path: "/Portfolio/Magic Move" }
  rect: { x; y; w; h };
  state: 'normal' | 'minimized' | 'maximized';
  z: number;
}
```
**Actions:** `open(appId, payload)` (focuses an existing instance if the app is single-instance or the same payload is already open), `close`, `focus`, `minimize`, `toggleMaximize`, `move`, `resize`, `cycleFocus`.

**Behaviour**
- Drag by title bar, resize from bottom-right grow box (classic) plus edges on touch/tablet. Windows clamped so the title bar stays reachable.
- Cascade new windows; remember last rect per app.
- Active window: striped title bar; inactive: plain, content still readable.
- Classic "zoom rect" outline animation on open/close; fade-only or none under reduced motion.

**Accessibility**
- Each window is a labelled `role="dialog"` with `aria-modal="false"` (or `region`; decide in Phase 3 with screen-reader testing). Title is its accessible name.
- Opening a window moves focus into it; closing returns focus to the icon/menu that opened it.
- Keyboard: **Ctrl/⌘+`** cycle windows, **Ctrl/⌘+W** close, **Ctrl/⌘+M** minimize, **Esc** leaves menus. Title-bar buttons are real `<button>`s.
- Keyboard move/resize mode from the window menu (arrow keys, Enter to commit) so dragging is never the only way.
- Live region announces "Portfolio window opened", "3 windows open".

---

## 5. Application framework

```ts
export default defineApp({
  id: 'music',
  name: 'Jukebox',
  icon: icons.music,
  window: { defaultSize: [420, 300], minSize: [320, 220], resizable: true },
  instances: 'single',            // 'single' | 'multiple' | 'per-document'
  handles: ['audio/playlist'],    // file kinds it opens from the VFS
  menus?: AppMenus,               // contributes to the menu bar when focused
  component: () => import('./MusicApp'),
});
```
- Apps get `AppProps { instanceId, payload, isActive, setTitle, close }` and render **content only**; `Window` owns all chrome.
- Shared UI kit (`src/ui/`): Button, DefaultButton (thick-ring), Checkbox, Radio, Slider, ScrollArea, ListView, IconGrid, Tabs, Alert, ProgressBar, TextField, Toolbar, Divider. Every app is built from these.
- Folder per app: `src/apps/<id>/{index.ts, <App>.tsx, use<App>Logic.ts, <App>.module.css}`.
- Registry is just `import.meta.glob('./apps/*/index.ts')`; adding an app = adding a folder.

---

## 6. Virtual filesystem and content

**Read-only, build-time generated.** Visitors explore; they don't create files (Stickies, if built, store notes in their own browser only).

```
content/
  fs.yaml                   # the tree: folders, order, icons, which file opens what
  about/*.md
  portfolio/<slug>/index.md + images/
  sketchbook/manifest.yaml + images/
  music/playlist.yaml (+ audio/ if self-hosted)
  personal/*.md
  contact.yaml
```
A build step validates everything with Zod (missing `alt` = build fails) and emits `vfs.json`:
```ts
type Node =
  | { kind: 'folder'; id; name; icon?; children: Node[] }
  | { kind: 'file'; id; name; icon?; type: FileType; src: string }   // type → app via registry `handles`
  | { kind: 'alias'; id; name; target: string }                      // desktop shortcuts
  | { kind: 'app'; id; name; appId: AppId }
  | { kind: 'link'; id; name; href: string }                         // LinkedIn, email
```
Folders open in Files (Finder); files open in the app registered for their `type`. Content and presentation never mix.

**Case studies:** port the portfolio's schema (outcome-first, Role / Years / Scope, required alt) to Markdown + front matter. MDX not needed unless we want embedded components; start with Markdown plus a few shortcodes.

**Sketchbook and music updates.** Honest framing: on a static host any new file needs a deploy. What we can promise is **no code changes**: drop the image in `content/sketchbook/images/`, add 3 lines to `manifest.yaml`, push (from GitHub's web UI or the Files app on iPad, even). Cloudflare redeploys in about a minute. If that's still too much friction later, move images to **Cloudflare R2** and fetch the manifest at runtime: true no-deploy updates, one more service.

---

## 7. Apps: scope recommendation

| App | v1? | Notes |
|---|---|---|
| Files (Finder) | ✅ core | Icon + list view, back/forward, path popup |
| Read Me | ✅ | First window on first visit; explains how to use Mike OS, keyboard shortcuts, plain-view link |
| About Mike | ✅ | SimpleText/TeachText-style document windows |
| Portfolio (case study viewer) | ✅ | Opens as a Notes document with images (D-009) |
| Sketchbook | ✅ | Gallery grid + viewer window |
| Music player | ❌ removed | Dropped by Mike (D-008) |
| Mike AI | ❌ removed | Dropped by Mike (D-007) |
| Weather | ✅ small | Open-Meteo (free, no key); default Cary, NC; geolocation only on explicit click |
| Screensaver | ✅ small | Flying 1-bit objects or floating sketchbook drawings; off under reduced motion |
| Contact card | ✅ tiny | Just a file type, not an app |
| Control Panel (Preferences) | ✅ | Wallpaper patterns, sounds, screensaver, cursor clock, reset |
| Calculator | ❌ v2 | Charming but says nothing about Mike |
| Stickies | ❌ v2 | Needs per-visitor storage; low value |
| Photo viewer | merge | Same viewer as Sketchbook |

---


## 8. Responsive strategy

| Width | Experience |
|---|---|
| ≥ 1024 | Full desktop: free windows, drag/resize, dock, cursor clock |
| 768–1023 (tablet) | Windows still float but open larger and default-maximized; bigger title-bar targets (≥ 44 px); long-press = context menu |
| < 768 (phone) | **"At Ease"-style launcher**: big 1-bit icon grid as home; apps open full-screen with a title bar + back button; menu bar collapses to the mark menu + clock; dock hidden (launcher replaces it) |

Same apps, same store; only the shell (`DesktopShell` vs `LauncherShell`) changes.

---

## 9. Accessibility plan (WCAG 2.1 AA)
- Menu bar follows the WAI-ARIA menubar pattern; context menus also reachable via Shift+F10 / menu key.
- Desktop icons: roving-tabindex grid, arrows move, Enter opens, type-ahead select.
- Skip link: "Skip to Read Me / plain view".
- **Plain view** (`/plain`): prerendered HTML of all public content, for no-JS, search engines and anyone who prefers it.
- 1-bit black/white gives 21:1 contrast; never put text on dither patterns.
- Classic cursor via CSS `cursor:` images with system fallback and an off switch; cursor clock is decorative (`aria-hidden`, `pointer-events: none`), off by default on touch.
- No single-key shortcuts without modifiers; sounds off by default or very quiet, toggle in menu bar.
- Reduced motion: no zoom-rects, no screensaver movement.

---

## 10. Claude Code skills and agents (verified 2026-11-10)

**Installed in this session:** `code-review`, `simplify`, `security-review`, `run`, `dataviz`, `artifact-design`, built-in browser (visual checks at each viewport).

**Available, not installed:**
- **frontend-design** (Anthropic): UI implementation guidance.
- **Design** (Anthropic): `accessibility-review`, `design-critique`, `design-system`, `ux-copy`. Useful at each phase gate.

**Subagents, once the core framework exists:** one per app build (each app is isolated by the framework), an accessibility audit agent, a visual QA agent (viewports × reduced motion), a code-review agent per phase. Not before the core is done: parallel work on an unsettled framework causes churn.

---

## 11. Open questions (in groups)

**Group 1: direction** (answered 2026-11-10, see `docs/decisions.md`)
1. Location → **`os.mikedemar.com`**, next to and linked with the Astro site (D-002). How they link: later.
2. Hosting → **GitHub Pages** (D-005). Mike AI removed (D-007), nothing NDA (D-006).
3. Assets → **original assets, no Apple marks** (D-003).
4. Era → **System 7** (D-004).

**Group 2: content** (answered 2026-11-10): music player dropped (D-008); full case studies as Notes documents (D-009); sketchbook starts with 10–20 drawings (D-010); stack approved (D-011).

**Group 3: personality (later)**: naming (Mike OS vs alternatives), your own menu-bar mark, app names, screensaver concept, startup sequence.
