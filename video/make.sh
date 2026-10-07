#!/usr/bin/env bash
# Uso: ./make.sh   (assume frames/ já renderizados com render.mjs e audio.wav gerado por audio.py)
set -e
cd "$(dirname "$0")"
ffmpeg -y -framerate 30 -i frames/f_%05d.jpg -i audio.wav \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -vf "scale=1080:1920:flags=lanczos" \
  -c:a aac -b:a 192k -shortest -movflags +faststart out/terremoto_1000_dias.mp4
