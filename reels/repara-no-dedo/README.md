# Cape — "Repara no dedo" (prévia v1)

Reel 9:16 de antes/depois dos perfis de Intensa, Hospital de Olhos Dr. Tannure, W&S Coworking e Loja Arteiro.
O dedo passa direto pelos posts antigos e **trava** nos novos. A cada cliente a parada vira uma ação maior:
**para → toca → digitando → VENDIDO**. Fecha com "Você também parou." e volta sem emenda para "Repara no dedo.".

- `out/Cape_ReparaNoDedo_previa_v1.mp4`: 1080×1920, 30 fps, 26 s (13 compassos a 120 BPM), −14 LUFS.

## O que é prévia e o que vai ser trocado

| Nesta versão | Na versão final (kit de edição no PC) |
|---|---|
| Círculo de toque desenhado | Mão real gravada (macro, tela verde) |
| "Reel" = capa do post ampliada + legenda | Trecho real de cada reel, com a voz |
| Música e efeitos sintetizados | Música licenciada com drop no VENDIDO (manter 13 compassos) |
| Folha de agendamento e DM ilustrativas | Pode manter, porque não têm dado falso |

Nada foi inventado: não há números, seguidores "antes" nem mensagens. A linha "Seguido(a) por" (perfis de terceiros)
foi removida dos cabeçalhos.

## Linha do tempo (s)

| Tempo | Cena |
|---|---|
| 0–2,5 | Gancho "Repara no dedo." em macro sobre os posts antigos da Intensa → rebobina → trava em "Perdeu um dente lá atrás?" |
| 2,5–5,5 | Reel da Intensa + legenda (vinho/blush, Playfair) |
| 5,5–11,6 | Hospital: antigos → trava em "Como você sabe que enxerga bem?" → toca no link → "Agende sua consulta" |
| 11,6–17,6 | W&S: antigos → trava em "PORTA É PROFISSÃO" → toca em Mensagem → DM "digitando…" |
| 17,6–21,6 | Arteiro: drone → trava em "SOFÁ VENDIDO!" — **drop em 20,0** |
| 21,6–22,4 | Anel de 6 cores do Arteiro abre o final |
| 22,4–25,0 | "Você também parou." (o dedo fica parado na tela) |
| 25,0–26,0 | Emenda: o dedo volta a rolar e o quadro 26,0 = quadro 0 |

## Como refazer

```bash
python3 -I src/build_assets.py <pasta_dos_prints> assets   # faixas de rolagem + layout
node src/render.js out/frames                              # 780 quadros + out/events.json
python3 -I src/audio.py out/events.json out/audio_raw.wav  # trilha + efeitos (loop sem emenda)
bash src/make.sh Cape_ReparaNoDedo_previa_v2.mp4           # nunca sobrescreve
```

Para ver um instante no navegador: `src/scene.html?t=20.1`.
