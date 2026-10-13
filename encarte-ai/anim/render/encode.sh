#!/usr/bin/env bash
# Blend 60 fps subframes into 30 fps with real motion blur, add light film grain, encode H.264.
# Usage: encode.sh <frames_dir> <out.mp4> [audio.wav]
set -euo pipefail
FR="$1"; OUT="$2"; AUD="${3:-}"
VF="tmix=frames=2:weights='1 1',framestep=2,noise=alls=3:allf=t,format=yuv420p"
if [ -n "$AUD" ]; then
  ffmpeg -y -v error -framerate 60 -i "$FR/f%05d.jpg" -i "$AUD" -vf "$VF" -r 30 -c:v libx264 -preset slow -crf 16 -profile:v high -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT"
else
  ffmpeg -y -v error -framerate 60 -i "$FR/f%05d.jpg" -vf "$VF" -r 30 -c:v libx264 -preset slow -crf 16 -profile:v high -movflags +faststart "$OUT"
fi
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact "$OUT"
