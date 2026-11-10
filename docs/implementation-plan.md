# Implementation plan

_Each step ends with a demo Mike can try plus the checks in CLAUDE.md "Verify before calling it done". One branch per step. Don't start apps before the core (steps 1–8) is working and tested._

## Core desktop

| # | Step | Done when |
|---|---|---|
| 1 | **Scaffold** ✅ 2026-11-10 | Vite 8 + React 19 + TS 7 strict, oxlint + Prettier, Vitest, Playwright + axe (desktop + mobile), GitHub Actions deploying a placeholder page to `os.mikedemar.com` |
| 2 | **Design foundations** | Tokens, chosen fonts (licenses recorded), first 8–10 icons, desktop patterns, a static System 7 "specimen" page for Mike to review |
| 3 | **Desktop + menu bar** | Patterned desktop; menu bar with keyboard-accessible menus (Radix vs hand-rolled decided here); clock; About Mike OS alert; app-switching decision (Application menu / dock) |
| 4 | **Window manager** | Open/close/focus/drag/resize/zoom/collapse, cascade, keyboard move mode, focus return, announcer; unit tests on the store |
| 5 | **App framework** | `defineApp` registry, lazy loading, error boundary, a throwaway "Hello" app in a window |
| 6 | **Content pipeline + VFS** | Vite plugin validates `content/`, emits vfs + docs + images; build fails on bad content; tests |
| 7 | **Desktop icons + Files** | Icons from VFS, select/drag/arrange, roving-tabindex grid, context menu; Files app with icon/list views, back/forward |
| 8 | **Persistence + reset** | Window rects, icon positions, settings persist; Special → Reset Desktop |

## Apps and content

| # | Step | Done when |
|---|---|---|
| 9 | **Notes + case studies** | Notes app; three case studies ported from the Astro site; Read Me; About |
| 10 | **Viewer + Sketchbook** | Image pipeline; Viewer with prev/next; Sketchbook folder with 10–20 drawings |
| 11 | **Responsive shells** | Tablet adjustments; phone launcher shell |
| 12 | **Control Panel** | Desktop pattern, sounds, screensaver, cursor clock, reset |
| 13 | **Weather** | Open-Meteo, default location, opt-in geolocation, error/offline states |
| 14 | **Screensaver + cursor clock + sounds** | Idle overlay, reduced-motion behaviour, our own sounds |
| 15 | **Plain view + launch QA** | `/plain/` pages; full accessibility audit, visual QA across viewports, Lighthouse, security review; link from the Astro site |

## Still to decide (asked when we reach the step)
- Fonts (step 2), app switching: Application menu vs dock (step 3), Radix vs hand-rolled menus (step 3)
- Your menu-bar mark, app names, Mike OS name (step 2–3)
- Drawing export format (Procreate?) (step 10), screensaver concept (step 14)
- How mikedemar.com links to Mike OS (step 15)
