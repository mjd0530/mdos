// Reads content/music/, validates it and describes the player's library (D-034). Pure
// Node apart from reading durations; the Vite wiring lives in content-plugin.ts.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseFile } from 'music-metadata';
import YAML from 'yaml';
import { z } from 'zod';
import type { Album } from '../src/music/types.ts';
import { ContentError, slug } from './content.ts';

const text = z.string().trim().min(1);

const libraryFile = z.object({ albums: z.array(text).default([]) }).strict();

const albumFile = z
  .object({
    title: text,
    artist: text,
    // YAML reads a bare 2004 as a number; keep it as text.
    year: z.union([text, z.number()]).transform(String).optional(),
    cover: text.regex(/\.(png|jpe?g)$/i, 'must be a .png or .jpg file'),
    coverAlt: text,
    credits: text.optional(),
    tracks: z
      .array(
        z
          .object({
            file: text.regex(/\.(m4a|mp3)$/i, 'must be an .m4a or .mp3 file'),
            title: text,
            lyrics: text.regex(/\.txt$/i, 'must be a .txt file').optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

/** Placeholders for file URLs in the library, swapped for real URLs in virtual:music. */
export const audioToken = (index: number) => `__MIKEOS_AUDIO_${index}__`;
export const coverToken = (variant: 'cover' | 'thumb', index: number) =>
  `__MIKEOS_COVER_${variant}_${index}__`;

export interface MusicResult {
  albums: Album[];
  /** Root-relative audio files ("/content/music/…"), by audio index. */
  audio: string[];
  /** Root-relative cover images, by cover index. */
  covers: string[];
  /** Every file read: the dev server watches these. */
  files: string[];
}

const rootRelative = (rootDir: string, absolute: string) =>
  '/' + path.relative(rootDir, absolute).split(path.sep).join('/');

function readYaml(file: string): unknown {
  try {
    return YAML.parse(readFileSync(file, 'utf8')) ?? {};
  } catch (error) {
    throw new ContentError(file, `not valid YAML: ${error}`);
  }
}

const describe = (error: z.ZodError) =>
  error.issues
    .map((issue) => `${issue.path.join('.') || '(top)'}: ${issue.message}`)
    .join('; ');

/** Length of an audio file in whole seconds (0 if it can't be read). */
async function readDuration(file: string): Promise<number> {
  try {
    const meta = await parseFile(file, { duration: true, skipCovers: true });
    return Math.round(meta.format.duration ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Load content/music/music.yaml and each album it lists. No music.yaml means an empty
 * library. Missing files, alt text or bad fields fail with the file named.
 */
export async function buildMusic({
  contentDir,
  rootDir,
}: {
  contentDir: string;
  rootDir: string;
}): Promise<MusicResult> {
  const musicDir = path.join(contentDir, 'music');
  const libraryPath = path.join(musicDir, 'music.yaml');
  const result: MusicResult = { albums: [], audio: [], covers: [], files: [] };
  if (!existsSync(libraryPath)) return result;

  result.files.push(libraryPath);
  const library = libraryFile.safeParse(readYaml(libraryPath));
  if (!library.success) {
    throw new ContentError(libraryPath, describe(library.error));
  }

  const ids = new Set<string>();
  for (const folder of library.data.albums) {
    const dir = path.join(musicDir, folder);
    const albumPath = path.join(dir, 'album.yaml');
    if (!existsSync(albumPath)) {
      throw new ContentError(
        libraryPath,
        `album "${folder}" needs ${folder}/album.yaml`,
      );
    }
    result.files.push(albumPath);
    const parsed = albumFile.safeParse(readYaml(albumPath));
    if (!parsed.success) {
      throw new ContentError(albumPath, describe(parsed.error));
    }
    const album = parsed.data;
    const id = slug(folder);
    if (ids.has(id)) {
      throw new ContentError(libraryPath, `album "${folder}" is listed twice`);
    }
    ids.add(id);

    const need = (file: string) => {
      const absolute = path.join(dir, file);
      if (!existsSync(absolute)) {
        throw new ContentError(albumPath, `file not found: ${file}`);
      }
      return absolute;
    };

    result.covers.push(rootRelative(rootDir, need(album.cover)));
    const coverIndex = result.covers.length - 1;

    const tracks = await Promise.all(
      album.tracks.map(async (track, n) => {
        const audioPath = need(track.file);
        result.audio.push(rootRelative(rootDir, audioPath));
        const audioIndex = result.audio.length - 1;
        let lyrics: string | undefined;
        if (track.lyrics) {
          const lyricsPath = need(track.lyrics);
          result.files.push(lyricsPath);
          lyrics = readFileSync(lyricsPath, 'utf8').replace(/\r\n?/g, '\n');
          lyrics = lyrics.trim() || undefined;
        }
        return {
          id: `${id}/${n + 1}`,
          title: track.title,
          src: audioToken(audioIndex),
          duration: await readDuration(audioPath),
          ...(lyrics && { lyrics }),
        };
      }),
    );

    result.albums.push({
      id,
      title: album.title,
      artist: album.artist,
      ...(album.year && { year: album.year }),
      cover: coverToken('cover', coverIndex),
      coverThumb: coverToken('thumb', coverIndex),
      coverAlt: album.coverAlt,
      ...(album.credits && { credits: album.credits }),
      tracks,
    });
  }
  return result;
}

/**
 * `virtual:music`: the library with real URLs. Covers are imported (so Vite hashes the
 * resized copies); audio URLs come from `audioUrl`, which returns a JS expression.
 */
export function musicModuleCode(
  music: MusicResult,
  coverUrl: (source: string, variant: 'cover' | 'thumb') => string,
  audioUrl: (index: number) => string,
): string {
  const imports = music.covers
    .flatMap((source, i) => [
      `import cover${i} from ${JSON.stringify(coverUrl(source, 'cover'))};`,
      `import thumb${i} from ${JSON.stringify(coverUrl(source, 'thumb'))};`,
    ])
    .join('\n');
  const albums = JSON.stringify(music.albums)
    .replace(
      /"__MIKEOS_COVER_(cover|thumb)_(\d+)__"/g,
      (_match, variant: string, index: string) => `${variant}${index}`,
    )
    .replace(/"__MIKEOS_AUDIO_(\d+)__"/g, (_match, index: string) =>
      audioUrl(Number(index)),
    );
  return `${imports}\nexport const albums = ${albums};\n`;
}
