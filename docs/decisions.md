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
