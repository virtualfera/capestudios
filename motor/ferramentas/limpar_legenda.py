#!/usr/bin/env python3
"""Remove legenda branca queimada numa faixa de uma imagem (inpainting).
Uso: python3 -I motor/ferramentas/limpar_legenda.py entrada.png saida.png y0 y1 [limiar=215]
Serve para reaproveitar frames de vídeos antigos como fundo. Sempre conferir o resultado a olho."""
import sys, cv2, numpy as np
src, dst, y0, y1 = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
lim = int(sys.argv[5]) if len(sys.argv) > 5 else 215
im = cv2.imread(src)
m = np.zeros(im.shape[:2], np.uint8)
faixa = im[y0:y1]
branco = (faixa.min(axis=2) > lim).astype(np.uint8) * 255
m[y0:y1] = cv2.dilate(branco, np.ones((5, 5), np.uint8), iterations=2)
# contorno escuro das letras (sombra) também
cv2.imwrite(dst, cv2.inpaint(im, m, 7, cv2.INPAINT_TELEA))
print('ok', dst, int(m.sum() / 255), 'px')
