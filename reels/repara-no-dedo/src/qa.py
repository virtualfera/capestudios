"""Conferencia: folha de contato (1 quadro por segundo) e medicao da emenda do loop.

Uso: python3 -I src/qa.py out/frames out/qa
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

frames = Path(sys.argv[1])
qa = Path(sys.argv[2])
qa.mkdir(parents=True, exist_ok=True)
files = sorted(frames.glob("*.png"))
n = len(files)


def arr(i):
    return np.asarray(Image.open(files[i % n]).convert("RGB").resize((270, 480))).astype(float)


# diferenca media entre quadros vizinhos: a emenda (ultimo -> primeiro) deve parecer um passo normal
diffs = [np.abs(arr(i + 1) - arr(i)).mean() for i in range(n - 3, n)] + [np.abs(arr(1) - arr(0)).mean()]
seam = np.abs(arr(0) - arr(n - 1)).mean()
print(f"quadros: {n}  passo medio perto da emenda: {np.mean(diffs):.2f}  emenda (ultimo->primeiro): {seam:.2f}")

# folha de contato
idx = list(range(0, n, 30)) + [n - 1]
w, h, cols = 216, 384, 9
rows = (len(idx) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * (h + 24)), (25, 25, 28))
d = ImageDraw.Draw(sheet)
for k, i in enumerate(idx):
    im = Image.open(files[i]).convert("RGB").resize((w, h))
    x, y = (k % cols) * w, (k // cols) * (h + 24)
    sheet.paste(im, (x, y + 24))
    d.text((x + 6, y + 6), f"{i / 30:.1f}s", fill=(255, 220, 0))
sheet.save(qa / "folha_de_contato.png")

# emenda lado a lado: 3 ultimos + 3 primeiros quadros
seq = [n - 3, n - 2, n - 1, 0, 1, 2]
strip = Image.new("RGB", (len(seq) * 270, 480 + 24), (25, 25, 28))
d = ImageDraw.Draw(strip)
for k, i in enumerate(seq):
    strip.paste(Image.open(files[i]).convert("RGB").resize((270, 480)), (k * 270, 24))
    d.text((k * 270 + 6, 6), f"quadro {i}", fill=(255, 220, 0))
strip.save(qa / "emenda_loop.png")
