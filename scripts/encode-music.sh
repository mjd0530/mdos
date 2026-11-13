#!/usr/bin/env bash
# Turn full-quality masters into web-sized copies for the music player (D-034).
#
#   scripts/encode-music.sh <masters-folder> <album-folder-name>
#
# Example: masters in music-masters/first-album/*.wav (git-ignored) become
# content/music/first-album/01.m4a, 02.m4a, … in file-name order (AAC, 160 kbps).
# Then list each track in content/music/first-album/album.yaml (docs/content.md → Music).
# Needs ffmpeg: brew install ffmpeg
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <masters-folder> <album-folder-name>" >&2
  exit 1
fi

src="$1"
out="content/music/$2"
mkdir -p "$out"

n=0
while IFS= read -r -d '' file; do
  n=$((n + 1))
  target="$out/$(printf '%02d' "$n").m4a"
  echo "$(basename "$file") → $target"
  # -map_metadata -1: drop embedded tags and art; titles come from album.yaml.
  ffmpeg -loglevel error -y -i "$file" -map 0:a:0 -map_metadata -1 \
    -c:a aac -b:a 160k -movflags +faststart "$target"
done < <(find "$src" -maxdepth 1 -type f \
  \( -iname '*.wav' -o -iname '*.aif' -o -iname '*.aiff' -o -iname '*.flac' -o -iname '*.mp3' -o -iname '*.m4a' \) \
  -print0 | sort -z)

echo "Encoded $n tracks into $out"
