# Editing content

Everything visitors read lives in `content/`. You never touch code to add or change it. Decision: D-019.

## Add a document

1. Create `content/<path>.md` (or `content/<path>/index.md` if it has images beside it):

   ```markdown
   ---
   title: Reading List
   ---

   Opening paragraph.

   ## A section

   ![What the picture shows, for people who can't see it](./cover.jpg)
   ```

2. Add it to `content/fs.yaml` where it should appear:

   ```yaml
     - folder: Personal
       children:
         - doc: personal/reading-list
   ```

3. Save. The dev server reloads; a deploy publishes it.

## Case studies

Portfolio documents add a `caseStudy` block (all fields required):

```yaml
---
title: Smart Share / Magic Move
caseStudy:
  client: Lenovo UXD · Project Fuji
  years: 2023–2026
  role: Lead UX Designer
  scope: [Interaction design, Prototyping]
  summary: One or two sentences, outcome first.
---
```

## fs.yaml entries

| Entry | Example | Opens |
|---|---|---|
| `doc:` | `- doc: about/biography` (optional `name:`) | Notes |
| `folder:` | `- folder: Personal` + `children:` | Files |
| `link:` | `- link: https://…` + `name:` | A new browser tab |
| `app:` | `- app: weather` + `name:` | That app |

Any entry can take `icon:` with a name from `src/assets/icons/icons.ts`. Order in the file is the order on screen.

## Writing rules (the build checks these)

- Headings start at `##`. The window title is the document title, so no `#`.
- Every image needs alt text, and the file must exist.
- Links to other sites open in a new tab automatically.
- Never invent facts. Leave `TODO(mike):` where something is missing.

If something is wrong the build stops and names the file and the problem, e.g. `content/readme.md: image "./x.jpg" needs alt text`. In dev, the same message appears over the page.
