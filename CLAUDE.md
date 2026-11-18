# Cape Studios — como o Claude trabalha aqui

A Cape é uma produtora/agência de conteúdo de Petrópolis (RJ). Equipe: Fred (fotógrafo e editor) e o time de estratégia/roteiro.
Este repositório é a **máquina de produção de vídeo** da Cape: fichas dos clientes, formatos de vídeo testados,
motor de motion/edição e os projetos de cada vídeo.

Para produzir qualquer vídeo de cliente, **use a skill `video-cliente`** (`.claude/skills/video-cliente/SKILL.md`).

## Regras que não se quebram

1. **Nada genérico.** Todo vídeo nasce de um fato real do cliente (ficha, transcrição de vídeo já gravado, bio, post publicado,
   catálogo). Se o texto serviria para qualquer outra loja/clínica trocando o nome, está errado — reescreva.
2. **Nunca inventar dado.** Endereço, preço, desconto, número de anos, nome de pessoa, resultado clínico: só se estiver numa fonte.
   Cada fato em `clientes/<slug>/marca.json` tem `fonte`. Faltou? Escreva `CONFIRMAR` e pergunte — não chute.
3. **Sempre com referência.** Antes de criar, olhe o que o cliente já posta (`clientes/<slug>/referencias/`) e o formato de
   referência em `formatos/`. Mantenha a identidade: Arteiro = anéis arco-íris + condensada + amarelo;
   Hospital = azul/verde-limão + gradiente; Intensa = vinho/blush + Playfair itálico; W&S = laranja/marinho + caixa laranja.
4. **Saúde (Hospital, Dr. William, Intensa):** só afirmações que já estão em roteiro aprovado ou gravado pelo profissional.
   Sem promessa de resultado, sem antes/depois de paciente sem autorização.
5. **Nunca sobrescrever entrega.** Versão nova = nome novo (`_v2`, `_v3`). Prévias levam `_previa` no nome.
6. **Registro certo por cliente** (skill `roteiro-humanizado-marketing`): Arteiro = personagem fixo (Robson) recebendo em casa;
   Hospital/Intensa = confiança/educativo; W&S = empresário para empresário.

## Estrutura

```
clientes/<slug>/marca.json     cores, fontes, local, fatos (com fonte), rosto, CTA, IDs das pastas no Drive
clientes/<slug>/marca/         logo
clientes/<slug>/referencias/   frames/posts reais usados como referência e fundo
formatos/                      catálogo de formatos (o que é, estrutura, tempos, quando usar, o que gravar)
motor/                         templates de motion (HTML) + render (Playwright) + montagem (ffmpeg)
projetos/<slug>/*.json         um arquivo por vídeo: textos, takes, áudio, saída
entregas/<slug>/               MP4 + capa .jpg prontos (prévias e finais)
brutos/                        takes originais baixados do Drive (NÃO vai pro git — ver .gitignore)
```

## Clientes ativos (slug → ficha)

| Slug | Cliente | Registro | Pasta do editor no Drive |
|---|---|---|---|
| `arteiro` | Loja Arteiro (Itaipava) | descoberta com personagem fixo (Robson Garrido) | EDITOR CAPE / Arteiro |
| `hospital-tannure` | Hospital de Olhos Dr. Tannure + Dr. William Tannure | confiança | EDITOR CAPE / William tannure |
| `intensa` | Intensa Odontologia Afetiva (Pátio Petrópolis) | confiança com afeto | — |
| `ws-coworking` | W&S Coworking (centro de Petrópolis) | empresário p/ empresário | EDITOR CAPE / ws |

Fichas completas no Drive: pasta com `Loja-Arteiro.md`, `Dr-William-Tannure.md`, `Intensa-Odontologia-Afetiva.md`.

## Comandos

```bash
python3 -I motor/montar.py projetos/arteiro/localizacao.json --checar   # 6 quadros-chave em PNG (segundos)
python3 -I motor/montar.py projetos/arteiro/localizacao.json            # MP4 1080x1920 30fps + capa
python3 -I motor/ferramentas/folha.py <pasta_quadros> folha.png          # folha de contato p/ revisar
open motor/templates/localizacao.html?t=4&guias                          # ver um instante + zonas seguras
```

Requisitos: Node 18+ com `playwright` (Chromium), Python 3 com Pillow, ffmpeg. Opcional: `opencv-python-headless`
(para `motor/ferramentas/limpar_legenda.py`).
