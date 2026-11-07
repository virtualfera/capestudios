#!/usr/bin/env bash
# Monta o MP4 final da previa: audio normalizado (-14 LUFS, ganho linear) + quadros renderizados.
# Uso: bash src/make.sh [nome_saida.mp4]
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="out/${1:-Cape_ReparaNoDedo_previa_v1.mp4}"
if [ -e "$OUT" ]; then echo "Ja existe $OUT — escolha outro nome (nunca sobrescrever)."; exit 1; fi

# 1a passada: medir
ffmpeg -hide_banner -nostats -i out/audio_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2> out/loudnorm_pass1.txt
FILTER=$(python3 -I - <<'EOF'
import json, re
txt = open("out/loudnorm_pass1.txt").read()
m = json.loads(re.search(r"\{[^{}]*\}", txt[txt.rfind("[Parsed_loudnorm"):], re.S).group(0))
print("loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}".format(**m))
EOF
)
# 2a passada: aplicar ganho linear (constante => nao cria emenda no loop)
ffmpeg -hide_banner -nostats -y -i out/audio_raw.wav -af "$FILTER" -ar 48000 out/audio_norm.wav

# video + audio
ffmpeg -hide_banner -nostats -y -framerate 30 -i out/frames/%04d.png -i out/audio_norm.wav \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -profile:v high -r 30 \
  -c:a aac -b:a 256k -ar 48000 -t 26 -movflags +faststart "$OUT"

ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUT"
echo "OK -> $OUT"
