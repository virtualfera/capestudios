#!/usr/bin/env python3
"""Junta quadros PNG numa folha de contato (para revisar a olho). Uso: folha.py pasta saida.png [largura_quadro=360]"""
import sys, glob, os
from PIL import Image, ImageDraw
pasta, saida = sys.argv[1], sys.argv[2]
w = int(sys.argv[3]) if len(sys.argv) > 3 else 360
fs = sorted(f for f in glob.glob(os.path.join(pasta, '*.png')))
h = int(w * 16 / 9)
im = Image.new('RGB', (w * len(fs) + 8 * (len(fs) - 1), h + 30), (40, 40, 40))
d = ImageDraw.Draw(im)
for i, f in enumerate(fs):
    q = Image.open(f).convert('RGBA'); bg = Image.new('RGBA', q.size, (255, 0, 255, 255)); bg.alpha_composite(q)
    im.paste(bg.convert('RGB').resize((w, h)), (i * (w + 8), 30)); d.text((i * (w + 8) + 6, 8), os.path.basename(f), fill='white')
im.save(saida); print(saida)
