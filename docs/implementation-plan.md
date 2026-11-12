# Implementation plan

_Each step ends with a demo Mike can try plus the checks in CLAUDE.md "Verify before calling it done". One branch per step. Don't start apps before the core (steps 1–8) is working and tested._

## Core desktop

| # | Step | Done when |
|---|---|---|
| 1 | **Scaffold** ✅ 2026-11-10 | Vite 8 + React 19 + TS 7 strict, oxlint + Prettier, Vitest, Playwright + axe (desktop + mobile), GitHub Actions deploying a placeholder page to `os.mikedemar.com` |
| 2 | **Design foundations** ✅ 2026-11-10: fonts (D-014), 10 icons, 6 patterns, buttons/checkbox/radio, menu + window chrome | Tokens, chosen fonts (licenses recorded), first 8–10 icons, desktop patterns, a static System 7 "specimen" page for Mike to review |
| 3 | **Desktop + menu bar** ✅ 2026-11-10 (D-015, D-016) | Patterned desktop; menu bar with keyboard-accessible menus (Radix vs hand-rolled decided here); clock; About Mike OS alert; app-switching decision (Application menu / dock) |
| 4 | **Window manager** ✅ 2026-11-11 (D-017) | Open/close/focus/drag/resize/zoom/collapse, custom System 7 scroll bar with arrow buttons (CSS can't draw them in Chrome/macOS), cascade, keyboard move mode, focus return, announcer; unit tests on the store |
| 5 | **App framework** ✅ 2026-11-11 (D-018) | `defineApp` registry, lazy loading, error boundary, a throwaway "Hello" app in a window |
| 6 | **Content pipeline + VFS** ✅ 2026-11-11 (D-019) | Vite plugin validates `content/`, emits vfs + docs + images; build fails on bad content; tests |
| 7 | **Desktop icons + Files** ✅ 2026-11-11 (D-020; Notes minimal until step 9) | Icons from VFS, select/drag/arrange, roving-tabindex grid, context menu; Files app with icon/list views, back/forward |
| 8 | **Persistence + reset** ✅ 2026-11-11 (D-021) | Window rects, icon positions, settings persist; Special → Reset Desktop |

## Apps and content

| # | Step | Done when |
|---|---|---|
| 9 | **Notes + case studies** ✅ 2026-11-11 (D-022; Vantage + Hello Design System await Mike's copy) | Notes app; three case studies ported from the Astro site; Read Me; About |
| 10 | **Viewer + Sketchbook** ✅ 2026-11-11 (D-023; drawings to come from Mike) | Image pipeline (also resizes case-study images); Viewer prev/next; Sketchbook folder with 10–20 drawings |
| 11 | **Responsive shells** ✅ 2026-11-11 (D-024) | Tablet adjustments; phone launcher shell |
| 12 | **Control Panel** ✅ 2026-11-11 (D-025): pattern, clock, Restore Defaults; sounds/screensaver/cursor clock settings arrive with step 14 |
| 13 | **Weather** ✅ 2026-11-11 (D-026) |
| 14 | **Screensaver + cursor clock + sounds** ✅ 2026-11-11 (D-027) |
| 15 | **Plain view + launch QA** ✅ 2026-11-12 (D-028; DNS + link from mikedemar.com remain for Mike) | `/plain/` pages; full accessibility audit, visual QA across viewports, Lighthouse, security review; link from the Astro site |

## Still to decide (asked when we reach the step)
- Your menu-bar mark, app names, Mike OS name (step 2–3)
- Drawing export format (Procreate?) (step 10), screensaver concept (step 14)
- How mikedemar.com links to Mike OS (step 15)
