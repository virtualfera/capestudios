---
name: video-cliente
description: Produz vídeos de clientes da Cape Studios (reels, stories mudos, localização, tour do espaço, vídeo de serviço, com ou sem narração, motion e 3D) a partir das fichas, referências e takes reais de cada cliente. Use sempre que pedirem vídeo, reel, story, edição, motion, "o que o Fred grava/edita", ou para cobrir buracos do calendário editorial de Arteiro, Hospital de Olhos Dr. Tannure, Intensa ou W&S Coworking.
---

# Produção de vídeo de cliente — Cape Studios

Objetivo: tirar o Fred do "não sei o que produzir" com vídeos **específicos de cada cliente**, bem acabados,
em formatos já testados, e manter o calendário editorial em dia.

Você é o Claude do Fred (editor da Cape) e produz junto com ele, no computador dele, com os takes originais.

## 0. Antes de tudo
- Leia `CLAUDE.md` (regras) e `clientes/<slug>/marca.json` (fatos com fonte, cores, rosto, CTA, pastas do Drive).
- Veja as referências reais em `clientes/<slug>/referencias/` e o formato escolhido em `formatos/`.

## 1. Escolher o formato (nunca começar pelo visual)
Pergunte: **qual fato real deste cliente ainda não virou vídeo?** Depois escolha o formato que melhor mostra esse fato:

| Formato | Arquivo | Quando | Precisa de |
|---|---|---|---|
| Localização | `formatos/localizacao.md` | todo cliente com espaço físico; referência = vídeo do Arteiro com o caminho do arco-íris (pedir o arquivo) | referência decupada + takes de chegada/fachada |
| Tour do espaço | `formatos/tour-espaco.md` | lançamento, novidade no espaço, sazonal | takes de cada ambiente, rosto apresentando |
| Vídeo do serviço | `formatos/video-servico.md` | explicar 1 serviço/produto por vídeo | rosto + B-roll do serviço + motion de apoio |
| Story mudo | `formatos/story-mudo.md` | testar formato novo, pauta de dúvida, aquecimento | só texto (opcional foto) — sai em minutos |

Se o cliente não tem take para o formato, **não preencha com banco de imagem**: faça o story mudo (só texto real)
e coloque o take na lista de gravação (`formatos/*.md` → "O que gravar").

## 2. Texto (roteiro)
- Narrado: use a skill `roteiro-humanizado-marketing` (gancho → desenvolvimento → CTA, registro do cliente).
- Mudo/legenda: frases curtas, 1 ideia por tela, palavra-chave em `*acento*` (vira o destaque visual da marca).
- Só fatos com fonte. Saúde: só texto já aprovado/gravado pelo profissional.

## 3. Montar o projeto
Crie `projetos/<slug>/<nome>.json` (copie um existente do mesmo formato). Campos:
- `template`: `localizacao` | `story` (novos templates em `motor/templates/`)
- `dados`: textos, tempos, fatos, CTA (ver o .md do formato)
- `clipes`: takes reais em `brutos/<slug>/...` com `in`/`dur` (quando houver) — o motion vai por cima, com transparência
- `audio`: `narracao`, `trilha` (`trilha_db`), `som_clipes`. Sem `audio` = mudo (padrão de story)

Takes vêm do Drive (IDs em `marca.json → drive`), sincronizado no computador do Fred. Copie ou aponte para `brutos/` (fora do git).

## 4. Checar antes de renderizar
`python3 -I motor/montar.py <projeto> --checar` → 6 quadros-chave. Monte a folha (`motor/ferramentas/folha.py`) e **olhe**:
- texto dentro da zona segura (x 80–930, y 220–1540; abra o template com `?guias`)
- nada sobreposto, nenhuma palavra sozinha na linha, pontuação colada
- cores/fontes da marca certas; avisos `⚠` do montador resolvidos ou conscientes

## 5. Render e entrega
`python3 -I motor/montar.py <projeto>` → `entregas/<slug>/<Nome>_vN.mp4` + `_capa.jpg` (1080x1920, 30 fps, H.264, −14 LUFS).
Suba para a pasta do cliente no Drive (EDITOR CAPE / <cliente>) e anote no calendário. Prévia → `_previa` no nome.

## 6. Aprender
Depois de publicado, registre em `formatos/<formato>.md → Histórico` o que funcionou (retenção, salvamentos, DMs)
e ajuste o formato. Formato que não performa 2x seguidas sai do rodízio daquele cliente.
