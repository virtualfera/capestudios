# PARTE 1 — Desmonte da referência ("What if it rained for a thousand years?")

Fonte: vídeo de referência (TikTok @then.what.animation). Tudo abaixo foi medido nos quadros
(1 quadro/s, contact sheets em `reference/sheets/s0..s7.jpg`) e no áudio. Itens marcados
**[inferido]** não foram confirmados diretamente — validar nas próximas partes.

## 1. Ficha técnica

| Item | Valor |
|---|---|
| Formato | vertical 9:16, 576×1024, 30 fps, H.264 + AAC 44,1 kHz |
| Duração total | 96,0 s |
| Conteúdo real | **0 → ~91 s**. De ~92 s a 96 s é o end-card do TikTok (adicionado pela plataforma) — **não replicar** |
| Overlays da plataforma | logo TikTok + @handle (direita) e "AI-generated" (canto inf. esq.) — **não replicar** (são da plataforma) |
| Estilo visual | cena 3D **low-poly procedural** (parece Three.js/WebGL): prédios de tijolo e bege com janelas, táxis amarelos, ônibus azul, guarda-chuvas coloridos, árvore redonda, semáforos |
| Câmera | **fixa**, elevada, olhando uma esquina de avenida (NYC) em diagonal. Não há cortes: é um plano contínuo de 91 s. A água sobe até **cobrir a câmera** (~Ano 7) e depois desce e a emerge (~Ano 1.060) |
| Narrativa | contador de tempo **não-linear (acelera exponencialmente)** + 7 frases-legenda + HUD de estado |

## 2. HUD (idêntico durante todo o vídeo)

Bloco alinhado à esquerda, ~y=44% da altura (a partir de 0:07), 3 linhas:

1. **Estado** — caixa-alta, sans, tracking largo, branco ~85%: `BEFORE THE RAIN` → `RAINING` → `RAIN STOPPED`
2. **Contador** — serifa grande, branca: `Hour 0`, `Hour 1…43`, `Day 3…50`, `Month 3…23`, `Year 2…2,979` (milhar com vírgula)
3. **Métrica** — caixa-alta minúscula, tracking largo, branco ~60%: `WATER 0 M ABOVE THE STREET` (some quando = 0 e vira `WATER 0 M`)

Tipografia **[inferido]**: serifa de aspecto Garamond (EB Garamond / Cormorant) para contador e legendas
(legendas em *itálico*); sans geométrica (Inter-like) para estado e métrica.

Legenda central: itálico serif branco, centralizado, ~y=33% (acima do centro), fade-in ~0,5 s,
fica 4–6 s, fade-out ~0,5 s. Uma por vez.

## 3. Linha do tempo medida (segundos do vídeo)

| t (s) | Contador / estado | Legenda | Cena / câmera |
|---|---|---|---|
| 0–4 | — | **"What if it rained for a thousand years?"** (título, topo) | cena seca, entardecer cinza, tráfego andando; título faz fade em ~5 s |
| 6 | Hour 0 · BEFORE THE RAIN | — | HUD aparece |
| 7–11 | Hour 1–2 · RAINING | "It starts like any other shower." | primeiras gotas; trânsito continua; primeiros guarda-chuvas |
| 12–15 | Hour 3–8 | — | escurece; janelas **acendem** (luzes amarelas); poças |
| 16–21 | Hour 12–21 | "By nightfall, the drains give up." | água começa a acumular; WATER 0.1 M |
| 22–25 | Hour 27 → Day 4 | — | rua alagando; carros param |
| 26–35 | Day 4–19 | "New Yorkers adapt. They always do." | chuva forte, névoa; carros boiando |
| 36–42 | Day 23 → Month 3 | "Month two: the avenue is a canal." | rua = canal; carros flutuam, barcos azul/vermelho aparecem |
| 43–53 | Month 3–9 | "Life moves upstairs." | botes infláveis, patos de borracha; água chega às janelas baixas |
| 48–57 | Month 9–23, Year 2–3 | "But the water never stops rising." | água cobre o térreo; destroços flutuando; luzes apagando |
| 57–62 | Year 3–4 | "One by one, the lights go out." | quase tudo submerso; só topo dos prédios |
| 60–63 | Year 5–25 | — | câmera **fica submersa**: cor verde-azulada plana (Year 7), depois vista subaquática com raios de luz e destroços |
| 64–68 | Year 167 → 1.059 | "For a thousand years, nothing changes." | escuridão subaquática, blocos de destroços à deriva (Year 750: preto quase total) |
| 69 | Year 1.060 · **RAIN STOPPED** | — | **linha d'água cruza a tela** (câmera emerge); áudio cai ~−20 dB |
| 70–75 | Year 1.062–1.087 | "Then, one day, the rain stops." | superfície lisa, luz quente entra, névoa dourada |
| 76–80 | Year 1.104–1.206 | "The water takes three centuries to leave." | água recua, postes tortos, carros reaparecem |
| 78–83 | Year 1.263–1.846 | — | rua seca, tom sépia/oliva, sombras longas, musgo/árvores começam |
| 81–88 | Year 1.632 → 2.979 | "What is left belongs to the forest." | árvores low-poly crescem em cima da rua e dos prédios; céu claro |
| 88–91 | — | fade p/ preto → **título final** + subtítulo `1,000 YEARS OF RAIN · 300 YEARS TO DRAIN · ONE AVENUE` | cartão final (fundo quase preto) |
| 92–96 | — | — | end-card TikTok (ignorar) |

Escala do contador: Hour 0 → 43 em ~15 s, Day 3 → 50 em ~14 s, Month 3 → 23 em ~12 s, Year 2 → 25 em ~8 s,
Year 167 → 1.059 em ~5 s. Ou seja, **cada ordem de grandeza de tempo ocupa ~10–15 s, e o ritmo vai acelerando**.

## 4. Áudio

- Presente do 0 ao fim, nível médio ≈ −16,5 dBFS, pico 0 dB.
- Envelope: ~−15 dB até 27 s, desce a ~−18 dB (27–48 s), volta a −15 dB (51–66 s), **cai para ~−31 dB aos 69 s** (chuva para) e fica baixo até 88 s; leve retorno aos 90 s.
- Espectro: 0–66 s é ruído de banda larga (centroide ~2,9–3,4 kHz) com grave forte (~60–70 Hz) → **chuva + trovão/rumble [inferido pelo espectro, não ouvido]**; 72–85 s centroide ~2 kHz, bem mais suave → ambiente quase silencioso/vento; fim ~300 Hz.
- **Não há narração falada** [inferido: o envelope e o espectro são de ruído, sem picos de fala]. Toda a informação vem do texto na tela.

## 5. Regras que NÃO podem ser quebradas na nossa versão

1. Plano **único, contínuo, câmera fixa** — sem cortes.
2. Contador acelerando de forma não-linear; HUD de 3 linhas sempre no mesmo lugar.
3. **11 legendas curtas** (a referência tem 11, uma por "capítulo") + título inicial + cartão final.
4. Virada dramática no ~76% do vídeo (ponto de "RAIN STOPPED" → "O ABALO PAROU") com queda de áudio.
5. Epílogo de **"natureza retoma"** com luz quente, depois fade para preto e cartão final.
6. Sem narração; só texto + som ambiente.
7. Sem overlays TikTok / "AI-generated" no arquivo final.

## 6. Tradução para o nosso vídeo (proposta, a validar na Parte 2)

**Tema:** "E se tremesse a terra por 1.000 dias seguidos?" — 1:30 (90 s), 9:16, 1080×1920 @ 30 fps, PT-BR.

| Referência | Nossa versão |
|---|---|
| Chuva 1.000 anos | Terremoto contínuo 1.000 dias (~2,7 anos) |
| Hour → Day → Month → Year | Minuto → Hora → Dia → Mês → Ano (aceleração igual) |
| `WATER x M ABOVE THE STREET` | `MAGNITUDE x,x` e/ou `PRÉDIOS DE PÉ x%` |
| `RAINING / RAIN STOPPED` | `TREMENDO / O TREMOR PAROU` |
| Água sobe e cobre a câmera | Rachaduras → prédios caem → poeira cobre tudo (câmera é soterrada de poeira/escombros) |
| Luzes apagando | Luzes apagando + rua afundando |
| Floresta retoma | Vegetação retoma entre ruínas |

**Pendências para decidir antes da Parte 2** (defaults já assumidos):
- Cidade: **mesma esquina estilo NYC low-poly** (máxima fidelidade à referência) vs. uma cidade brasileira. *Default: mesma esquina.*
- Duração dos 1.000 dias: a referência usa 1.000 anos + 1.800 anos de epílogo. Aqui o epílogo precisa de "anos" depois dos 1.000 dias. *Default: tremor 0 → Dia 1.000 (≈ 66 s), depois "Ano 3 … Ano 300" no epílogo.*
- Ferramenta de renderização: **Three.js + Playwright/Chromium (já instalado) → quadros → ffmpeg**. *Default.*
- Áudio: síntese procedural (rumble grave + estalos + silêncio na virada) com ffmpeg/Python.

## 7. Plano em partes

1. ✅ **Parte 1** — desmonte da referência (este documento)
2. **Parte 2** — roteiro + "storyboard de dados" em PT-BR (tabela t → contador, métrica, legenda, estado da cena) em JSON, mapeado 1:1 com a tabela acima
3. **Parte 3** — cena 3D base: esquina low-poly idêntica (prédios, táxis, árvores, luzes), câmera fixa → *teste visual contra o quadro 0 s*
4. **Parte 4** — HUD + legendas + título/cartão final (tipografia igual), *teste contra os quadros do HUD*
5. **Parte 5** — simulação do terremoto por fases (tremor da câmera, rachaduras, desabamento, poeira, subsidência) conduzida pelo storyboard
6. **Parte 6** — áudio procedural e mixagem
7. **Parte 7** — render quadro a quadro, mux com ffmpeg, conferência final lado a lado com a referência (contact sheets)
