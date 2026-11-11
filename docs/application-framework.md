# Application framework

How apps plug into Mike OS. Decisions: D-017 (windows), D-018 (apps).

## Adding an app

1. Create `src/apps/<id>/index.ts`:

   ```ts
   import { defineApp } from '../types';

   export default defineApp<{ docId: string }>({
     id: 'notes',
     name: 'Notes',
     icon: 'notes',                       // from src/assets/icons/icons.ts
     instances: 'per-document',           // 'single' | 'multiple' | 'per-document'
     documentKey: (payload) => payload.docId,
     title: (payload) => payload?.docId ?? 'Notes',
     window: { size: { w: 560, h: 480 }, minSize: { w: 320, h: 240 } },
     inMarkMenu: false,                   // list it in the M menu?
     load: () => import('./NotesApp'),    // code-split; loads on first open
   });
   ```

2. Create `src/apps/<id>/<Name>App.tsx` with a **default export** taking `AppProps`:

   ```tsx
   export default function NotesApp({ payload, isActive, setTitle, close }: AppProps<{ docId: string }>) {
     return <article>…</article>; // content only: the Window draws all chrome
   }
   ```

3. That's it. The registry (`src/apps/registry.ts`) finds every `src/apps/*/index.ts`; there is no list to edit. Open it from code with `launch('notes', { docId: 'readme' })`.

## Rules

- **Content only.** Never draw title bars, close boxes or scroll bars in an app; `Window` and `ScrollArea` do that.
- **Shared UI.** Build from `src/ui/` (Button, Checkbox, Radio, Alert, PixelIcon). Extend those before making a one-off.
- **Instances.** `single` brings the existing window forward; `multiple` always opens another; `per-document` opens one window per `documentKey`.
- **Crashes stay local.** Each app runs inside a crash boundary that shows “The application … has unexpectedly quit” with Close and Relaunch. Don't catch-and-hide errors to avoid it.
- **Accessibility.** The window is already a labelled dialog that takes focus when it opens; inside, use real headings, buttons and links. Call `announce()` (`src/os/announce.ts`) for changes that are only visual.
- **State.** Local React state first. Add a Zustand store in the app folder only when several windows of the app must share state.

## Pieces

| File | Role |
|---|---|
| `src/apps/types.ts` | `AppDefinition`, `AppProps`, `defineApp` |
| `src/apps/registry.ts` | Discovers apps; rejects duplicate ids and per-document apps without `documentKey` |
| `src/apps/launch.ts` | `launch(appId, payload)` applies the instance rule, then opens or focuses |
| `src/apps/AppHost.tsx` | Lazy-loads the app inside its window, with loading and crash states |
| `src/os/windows/` | Window manager (store, geometry, Window, WindowLayer) |
