# Encarte Aí — animação (Three.js + Canvas 2D, determinística)

- `index.html` + `src/main.js` (cena 3D, câmera, lógica por tempo e compositor), `src/overlay.js` (tipografia, flares, flash, end card), `src/tex.js` (texturas desenhadas em canvas e telas do app a partir dos crops reais), `src/util.js` (easings e keyframes).
- Toda a cronologia segue `timeline.json` (as falas e os efeitos sonoros usam os mesmos tempos).
- Prévia com som: sirva a pasta `encarte-ai/` (ex.: `npx http-server encarte-ai`) e abra `/anim/index.html`; `?t=12.4` congela num instante.
- Stills: `node render/stills.mjs <pasta> 1.5 9.6 ...`
- Render final (60 fps em subframes → 30 fps com motion blur):
  `node render/render.mjs --root .. --page anim/index.html --out <frames> --fps 60 --end 30.8 --workers 3`
  `render/encode.sh <frames> ../out/encarte-ai-reel.mp4 ../sfx/mix.wav`
