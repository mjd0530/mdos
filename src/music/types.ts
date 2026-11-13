// The music library: what the build emits from content/music/ (build/music.ts) and the
// player reads from `virtual:music`.

export interface Track {
  /** Stable id, "<album>/<n>". */
  id: string;
  title: string;
  /** Audio file URL. */
  src: string;
  /** Length in seconds, read from the file at build time. */
  duration: number;
  /** Plain-text lyrics, if the album lists a file for this song. */
  lyrics?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  year?: string;
  /** Cover art (600px WebP) and a small version for lists. */
  cover: string;
  coverThumb: string;
  coverAlt: string;
  credits?: string;
  tracks: Track[];
}
