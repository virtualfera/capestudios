# E se a terra tremesse por 1.000 dias seguidos? — vídeo 1:30 (9:16)

Cena 3D low-poly procedural (Three.js) do Rio de Janeiro — Rua Jardim Botânico com o Corcovado e o
Cristo Redentor ao fundo — renderizada quadro a quadro (Chromium + WebGL) e montada com ffmpeg.
Estrutura 1:1 com a referência analisada em `../reference/PARTE-1-DESMONTE-DA-REFERENCIA.md`.

```
npm install                      # three, playwright-core, fontes EB Garamond/Inter
node render.mjs --still=0,30,57  --out=stills        # testar instantes (png/jpg)
node render.mjs --from=0 --to=2700 --out=frames      # render completo (rodar em 4 processos p/ acelerar)
python3 audio.py audio.wav                           # trilha procedural (usa events.json gerado no render)
./make.sh                                            # frames + áudio -> out/terremoto_1000_dias.mp4
```

- `src/storyboard.json` — contador, estados, 12 legendas, iluminação por tempo (tudo parametrizado)
- `src/world.js` — cidade, colapsos, poeira, Cristo, vegetação | `src/main.js` — HUD e loop de render
- `audio.py` — rumble, colapsos sincronizados, silêncio na virada, vento, pássaros
