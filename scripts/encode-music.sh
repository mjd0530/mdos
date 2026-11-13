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

# A plain glob lists files in name order on every system (no GNU-only sort -z), and any
# ffmpeg failure stops the script.
shopt -s nullglob
n=0
for file in "$src"/*; do
  [[ -f "$file" ]] || continue
  ext="$(printf '%s' "${file##*.}" | tr '[:upper:]' '[:lower:]')"
  case "$ext" in
    wav | aif | aiff | flac | mp3 | m4a) ;;
    *) continue ;;
  esac
  n=$((n + 1))
  target="$out/$(printf '%02d' "$n").m4a"
  echo "$(basename "$file") → $target"
  # -map_metadata -1: drop embedded tags and art; titles come from album.yaml.
  ffmpeg -nostdin -loglevel error -y -i "$file" -map 0:a:0 -map_metadata -1 \
    -c:a aac -b:a 160k -movflags +faststart "$target"
done

if [[ $n -eq 0 ]]; then
  echo "No audio files (wav, aif, aiff, flac, mp3, m4a) found in $src" >&2
  exit 1
fi
echo "Encoded $n tracks into $out"
