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

## Pictures

`![Alt text describing the picture](./file.png "Optional caption")`. Every picture can be clicked to open larger in Viewer (which steps through all the pictures in that document); the caption shows under it and in Viewer's title. Pictures are resized to WebP at build time, so add originals at full size.

## Sketchbook drawings

1. Put the image in `content/sketchbook/` (PNG or JPG at any size; the build resizes it).
2. Add it to `content/sketchbook/manifest.yaml`:

   ```yaml
   drawings:
     - file: owl.png
       title: Night Owl
       alt: A pencil sketch of an owl on a branch, looking over its shoulder
       date: 2025-03-14            # optional
       description: Procreate.     # optional
   ```

Order in the file is the order in the folder and in Viewer.

## Case studies

Portfolio documents add a `caseStudy` block (`subtitle` and `awards` optional, the rest required):

```yaml
---
title: Smart Share / Magic Move
caseStudy:
  client: Lenovo UXD · Project Fuji
  years: 2023–2026
  role: Lead UX Designer
  scope: [Interaction design, Prototyping]
  summary: One or two sentences, outcome first.
  subtitle: Optional one-line headline
  awards: Optional recognition
---
```

## Music

The music player (D-034) reads `content/music/`. Audio is stored with **Git LFS**: install it once with `brew install git-lfs && git lfs install` before committing audio.

1. Put full-quality masters (WAV, AIFF, FLAC, MP3 or M4A) in `music-masters/<album>/` at the project root. That folder is git-ignored; masters never go in the repo.
2. Encode web-sized copies (AAC, 160 kbps), numbered in file-name order:

   ```bash
   scripts/encode-music.sh music-masters/first-album first-album
   ```

3. Add the cover (PNG or JPG, any size; the build resizes it) and one `.txt` file of lyrics per song to `content/music/first-album/`. Lyrics are plain text; a blank line starts a new verse.
4. Describe the album in `content/music/first-album/album.yaml`:

   ```yaml
   title: First Album
   artist: Mixed Solution
   year: 2004                  # optional
   cover: cover.jpg
   coverAlt: What the cover shows, for people who can't see it
   credits: Optional line of credits.
   tracks:                     # play order
     - file: 01.m4a
       title: Song Title
       lyrics: 01.txt          # optional
   ```

5. List the album folder in `content/music/music.yaml` (order there is the order in the player):

   ```yaml
   albums:
     - first-album
   ```

Song lengths are read from the files. The build stops if a file is missing, a cover has no `coverAlt`, or audio isn't `.m4a`/`.mp3`. `test-tones/` is a placeholder album: delete it (and its line in `music.yaml`) once real albums are in.

## fs.yaml entries

| Entry | Example | Opens |
|---|---|---|
| `doc:` | `- doc: about/biography` (optional `name:`) | Notes |
| `folder:` | `- folder: Personal` + `children:` | Files |
| `link:` | `- link: https://…` + `name:` | A new browser tab |
| `app:` | `- app: weather` + `name:` | That app |
| `gallery:` | `- gallery: sketchbook` + `name:` | Files, showing thumbnails; pictures open in Viewer |
| `image:` | `- image: about/portrait.jpg` + `name:` + `alt:` | Viewer (one picture; PNG or JPG) |

Any entry can take `icon:` with a name from `src/assets/icons/icons.ts`. Order in the file is the order on screen.

A `doc:` or `image:` on the desktop (not inside a folder) can add `opensOnFirstVisit: true` to open by itself the first time someone visits, on desktops and tablets. Phones start at the launcher instead. Reset Desktop counts as a fresh visit. About Mike uses this.

## Writing rules (the build checks these)

- Headings start at `##`. The window title is the document title, so no `#`.
- Every image needs alt text, and the file must exist.
- Links to other sites open in a new tab automatically.
- Never invent facts. Leave `TODO(mike):` where something is missing.

If something is wrong the build stops and names the file and the problem, e.g. `content/readme.md: image "./x.jpg" needs alt text`. In dev, the same message appears over the page.
