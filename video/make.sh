#!/usr/bin/env bash
# Uso: ./make.sh  — frames1080/ + audio_v2.wav -> out/ (master alta qualidade + cópia leve p/ chat)
set -e
cd "$(dirname "$0")"; mkdir -p out
AF="highpass=f=60,loudnorm=I=-14:TP=-1.5:LRA=9"
ffmpeg -y -framerate 30 -i frames1080/f_%05d.jpg -i audio_v2.wav -af "$AF" \
  -c:v libx264 -profile:v high -preset slow -crf 16 -maxrate 14M -bufsize 28M -pix_fmt yuv420p \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart out/terremoto_v2_1080p_master.mp4
ffmpeg -y -i out/terremoto_v2_1080p_master.mp4 -c:v libx264 -preset slow -crf 27 -maxrate 2.6M -bufsize 5M \
  -c:a aac -b:a 128k -movflags +faststart out/terremoto_v2_1080p_leve.mp4
