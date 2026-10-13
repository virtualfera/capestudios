# Encarte Aí — Brand & Asset Kit

Kit de marca e de assets para a animação de apresentação do app **Encarte Aí** (nome na App Store: "Encarte AI").
Coletado em **13/10/2026** a partir de fontes públicas: iTunes Lookup API, App Store, Google Play. Todas as cores foram amostradas dos PNGs originais, e todos os vetores foram renderizados e comparados lado a lado com o original.

---

## 1. Fatos verificados

| Item | Valor | Fonte |
|---|---|---|
| Nome na loja | Encarte AI (marca falada/escrita: **Encarte Aí**) | iTunes lookup |
| Desenvolvedor | Caio Vieira (artistId 6775663002) | iTunes lookup |
| Bundle / package | `com.encarte.ai` (o mesmo no iOS e no Android) | iTunes lookup + Play |
| Versão atual iOS | **1.4.0**, publicada em **09/10/2026** | iTunes lookup |
| Primeiro lançamento iOS | **18/06/2026** | iTunes lookup |
| Notas da versão | "- Correções e melhorias de performance" | iTunes lookup |
| Nota App Store | média 4,97 (exibida como **5,0**), **30 avaliações** | iTunes lookup |
| Categoria | Compras (principal) + Estilo de vida | iTunes lookup |
| Preço / classificação | Grátis / +4 | iTunes lookup |
| Requisito / tamanho | iOS 15.1+ / 47,9 MB; idiomas EN e PT | iTunes lookup |
| **Android** | **DISPONÍVEL**: https://play.google.com/store/apps/details?id=com.encarte.ai: "Encarte ai", nota **5,0**, **70 avaliações**, **1 mil+ downloads**, atualizado em 08/10/2026, Classificação Livre | Google Play (`play-listing.json`) |
| Descrição curta (Play) | "Ofertas e encartes dos supermercados de Petrópolis em um só lugar!" | Google Play |
| Recursos extras citados na Play | "Salve seus produtos e mercados preferidos e **receba alertas** quando as ofertas chegarem"; "**sem cadastro obrigatório**. Abra o app e já veja as ofertas da sua cidade"; "encartes atualizados **toda semana**" | Google Play |
| Instagram @encarteai.app | **BLOQUEADO.** API pública `web_profile_info` → 401 `require_login` ("Please wait a few minutes"); HTML do perfil e do post → 429; embed público → shell vazio, sem mídia. Nada foi salvo e não houve tentativa de login ou bypass. | — |
| Site `encarteai.com.br` (o `sellerUrl` da App Store) | ⚠️ **É OUTRO PRODUTO**: "EncarteAI — encartes de supermercado prontos pra imprimir e pra vender", B2B para lojistas, "feito pela Hoom", com identidade roxa/vermelha. **Não use** visuais, cores nem textos dele. | encarteai.com.br |

> **Consequência para o CTA:** o app está nas duas lojas, então dá para dizer "Disponível para iPhone e Android" ou "Baixe grátis na App Store e no Google Play". "Link na bio" continua valendo como alternativa.

---

## 2. Paleta (hex amostrados)

Cada valor é a mediana dos pixels sólidos internos, sem a borda antialiasada. Versão legível por máquina: `palette.json`; amostras: `palette.png`.

| Papel | Hex | Onde foi amostrado |
|---|---|---|
| **Verde da marca (wordmark "Encarte")** | `#338A3E` | logo no header e no lockup da tela de cidade |
| Verde de destaque da UI (aba ativa, links, pins, checkbox) | `#3A7D44` | "Ver todos", "Indique aqui", aba Início |
| Verde claro da etiqueta (ícone, brilho/sparkle) | `#3CAD4C` | ícone 1024 |
| Verde de sombra da etiqueta (dobra a 45°) | `#2F8A3B` | ícone 1024 |
| **Fundo verde-escuro do ícone** | `#102018` | ícone 1024 (quase uniforme: #112019 → #0E1D16) |
| **Laranja de destaque ("AI" + canto do cartão)** | `#F6A624` | wordmark / ícone (#F6A623) |
| Laranja do selo de desconto ("41% OFF") | `#E67E22` | cards de Ofertas Quentes |
| Vermelho do banner (Vale Verde "Ofertas da Semana!") | `#D61801` | banner (é conteúdo de terceiro, não da marca) |
| Vermelho do coração (Favoritos) | `#E74C3C` | card Meus Favoritos |
| Fundo do card Favoritos / borda / círculo | `#FFF5F5` / `#FDDADA` / `#FFE4E4` | card Meus Favoritos |
| Círculo verde-claro do pin | `#EAF2EB` | linha "Petrópolis RJ" |
| Fundo da tela da UI | `#FFFFFF` | telas |
| Off-white dos prints da App Store | `#FDFDF8` | fundo do print 1 |
| Divisores | `#F1F1F1` (`#F0F0F0`–`#F3F3F3`) | header, linha de localização |
| Texto escuro da UI (títulos) | `#2D2D2D` (núcleo mais escuro ≈ `#1A1A1A`) | "Mercados da Região", "Onde você está?" |
| Texto secundário | `#555555` | "Petrópolis" na localização, subtítulo da cidade |
| Texto apagado (km, abas inativas, "6 ofertas") | `#999999` | vários |

Sugestão de fundo para vídeo: `#102018` (o escuro do ícone) com etiqueta `#3CAD4C` e acentos `#F6A624`, o que dá contraste alto e "cara de cinema". Sobre fundo escuro, use o `wordmark-on-dark` (o verde `#338A3E` fica com pouco contraste em `#102018`).

---

## 3. Tipografia

| Uso | Fonte (Google Fonts, npm `@fontsource/*`) | Observação |
|---|---|---|
| **Wordmark "EncarteAI"** | **Nunito ExtraBold (800)**, tracking −0.03em, +0.10em antes de "AI" | **Verificado:** o render sobre o logo do app dá IoU 0,90, e a sobreposição praticamente coincide. Já vem convertido em paths em `wordmark.svg`. |
| **Títulos do vídeo (recomendado)** | **Nunito Black (900)** / ExtraBold (800), tracking −0.01 a −0.02em | É a mesma família do logo, o que garante coerência imediata com a marca. Os terminais arredondados passam simpatia e proximidade (mercado, cidade, economia), e o peso Black aguenta títulos grandes e cinematográficos, inclusive em caixa-alta curta ("ECONOMIA", "PETRÓPOLIS"). O subset latin cobre todos os acentos do PT-BR (ã, ç, ê, ó…). Arquivos em `fonts/`. Licença OFL. |
| Texto de apoio / legendas / réplicas da UI | **Inter** 400/500/600/700 | A UI do app usa a fonte do sistema iOS (SF Pro), e a Inter é a Google Font mais próxima dela. Use para recriar cards, chips e legendas. Arquivos em `fonts/`. |
| Estilo dos prints da App Store | Open Sans Bold 700, caixa-alta, tracking +0.04em (subtítulo em Open Sans Regular) | Verificado com IoU 0,95 em "ECONOMIA". Use só se quiser espelhar os prints da loja. |
| Alternativa "premium neutra" | Plus Jakarta Sans 800 | Opcional, caso o diretor queira menos arredondado. Não é a marca. |

**Grafia:** o logo diz literalmente **"EncarteAI"** (com "I" maiúsculo, sem acento). Em copy e narração, escreva e fale **"Encarte Aí"**. Não redesenhe o logo com acento.

---

## 4. Geometria do ícone (para rig de animação)

Coordenadas no canvas 1024 de `icon-symbol.svg` / `icon-full.svg`, as mesmas do PNG original:

- **Etiqueta:** x 256,5–766,5, y 128,5–895,75. Topo chanfrado de (355,128,5)–(667,9,128,5) até as laterais em y≈258. Raio dos cantos inferiores 44.
- **Argola/furo:** centro **(511,75, 218,5)**, raio interno 35 e externo 54,3. É o **pivô natural para um "balanço" da etiqueta**.
- **Cordão:** x 503–520,5, de y 128,5 até 207,5, com ponta arredondada.
- **Cartão branco:** (311, 311), 401,5×401,5, rx 10, com sombra deslocada (+11, +11), preto a 19%, desfoque de 2.
- **Canto laranja:** triângulo (564,713)–(713,713)–(713,564), recortado pelo cartão.
- **Brilho de 4 pontas (sparkle):** centro **(512, 512)**, raio da ponta 114, 4 cúbicas côncavas. Bom candidato para animar "twinkle"/rotação.
- **Sombra a 45°:** polígono ao longo de x+y=1027 (acima e à direita do cartão) e x+y=1154 (abaixo e à esquerda), recortado pela etiqueta.
- Grupos e IDs no SVG: `symbol`, `hole-fill`. Os paths são simples e fáceis de separar em camadas no After Effects, Lottie ou Remotion.

Fidelidade do vetor: a diferença média absoluta contra o PNG original é 1,25/255. O resíduo está só nas bordas, porque o original é levemente borrado (upscale). O original tem um pequeno artefato quadrado em (≈950–990, ≈950–990) que **não** foi reproduzido.

---

## 5. Crops da UI: resolução efetiva

- A tela dentro do mockup mede **822×1780 px**, ou seja, ~**0,64×** um screenshot nativo de iPhone (1284×2778). É essa a resolução real disponível. As versões `_2x` são upscale Lanczos: ficam mais suaves, mas **não acrescentam detalhe**.
- `screen-home.png` / `screen-city.png`: os cantos arredondados e o notch foram **preenchidos com branco** (`#FFFFFF`), o que dá um retângulo limpo e opaco para colocar dentro de qualquer mockup próprio (aplique o seu próprio raio de canto, ~68 px nessa escala). As versões `*-masked.png` mantêm os pixels originais com alfa no formato exato da tela.
- A barra de status (16:38, sinal, bateria) faz parte do print, com ~90 px no topo de `screen-*.png`. Para escondê-la, recorte de y≈95 para baixo ou cubra com a barra do seu mockup.
- Para closes muito grandes (por exemplo, um card ocupando 1080 px de largura, ≈3,2×), o raster fica mole. Prefira zoom ≤2× ou recrie o componente em vetor/HTML com a paleta + Inter. Card, chip, badge e tab bar são formas simples.

---

## 6. Ressalvas

1. **Conteúdo de terceiros dentro da UI:** os logos dos mercados (Vale Verde Supermercado, Terra Nova Merkado), as marcas (Assaí Atacadista, "Meu Assaí", São Vicente), as fotos de produto e o banner "Ofertas da Semana!" pertencem às lojas/marcas. Use-os apenas como a tela real do app, e não os isole como "marca".
2. **Os chips do print parecem dados de demonstração:** o chip "Bramil" mostra o logo da Vale Verde, "Petro Frutas" e "Rede Econ…" mostram Terra Nova, e assim por diante. Evite closes que evidenciem esse descasamento.
3. **Preços e descontos são um retrato do momento do print** (Banana Prata Kg 41% OFF, Queijo Camembert 40% OFF), e não ofertas vigentes. Não afirme que "hoje tem 41% OFF".
4. Os cards de produto têm a borda inferior escondida sob a tab bar no print original. O 5º chip ("Multi…") e o 3º card ("Espu…") estão cortados pela borda da tela.
5. **Os vetores são recriações**, não arquivos oficiais. `wordmark-on-dark.*` é uma variante **derivada** (branco + laranja) para fundo escuro.
6. Instagram: não foi possível coletar nenhuma mídia (bloqueio de login/rate-limit). Se precisar do conteúdo do post, peça o arquivo ao cliente.
7. O `sellerUrl` da App Store (encarteai.com.br) aponta para outro produto/empresa (Hoom). Não o use como site do app.
8. Os trechos de avaliações da Play em `play-listing.json` são de pessoas reais: **não** os use como depoimento na tela sem autorização.
9. A nota exibida pode mudar: em 13/10/2026 era 5,0 com 30 avaliações no iOS e 5,0 com 70 avaliações no Android.

---

## 7. Inventário de arquivos

| Path | What it is | Pixel size |
|---|---|---|
| `icon-1024.png` | Original App Store icon (square, full-bleed dark bg; iOS rounds it). Source of truth for the symbol. | 1024×1024 |
| `icon-full.png` | Render of icon-full.svg (transparent outside the rounded square). | 1024×1024 RGBA |
| `icon-full.svg` | Vector recreation of the full icon: dark rounded square (rx 228) + tag symbol. | viewBox 0 0 1024 1024 |
| `icon-symbol-tight.png` | Render of icon-symbol-tight.svg at 2x, transparent. | 1056×1568 RGBA |
| `icon-symbol-tight.svg` | Same symbol, viewBox cropped tight to the tag (248 120 528 784). | viewBox 248 120 528 784 |
| `icon-symbol.png` | Render of icon-symbol.svg, transparent background. | 1024×1024 RGBA |
| `icon-symbol.svg` | Vector recreation of the tag symbol only, 1024 canvas (same coordinates as the icon). Hole filled #102018 (element id="hole-fill"; delete for a see-through hole). | viewBox 0 0 1024 1024 |
| `itunes-lookup.json` | Raw iTunes lookup response (country=br), fetched 2026-10-13. | 6 KB |
| `logo-lockup.png` | Render of logo-lockup.svg at 2x, transparent. | 2436×790 RGBA |
| `logo-lockup.svg` | Horizontal lockup (tag symbol + wordmark) with the same proportions as the app's city-screen logo. | viewBox -317.94 -260.43 1218.14 395.10 |
| `palette.json` | Sampled brand/UI colors (machine-readable). | 1 KB |
| `palette.png` | Swatch sheet of palette.json. | 1200×1020 |
| `play-listing.json` | Google Play listing facts (fetched 2026-10-13). | 2 KB |
| `wordmark-on-dark.png` | Render of wordmark-on-dark.svg at 2x, transparent. | 1788×322 RGBA |
| `wordmark-on-dark.svg` | DERIVED variant for dark backgrounds: "Encarte" white, "AI" orange (not an official asset). | viewBox 6.2 -150.8 894 161 |
| `wordmark.png` | Render of wordmark.svg at 2x, transparent. | 1788×322 RGBA |
| `wordmark.svg` | "EncarteAI" wordmark as outlined paths (Nunito ExtraBold 800, tracking -0.03em, +0.10em before "AI"). Encarte #338A3E, AI #F6A624. | viewBox 6.2 -150.8 894 161 |
| `screens/appstore-01-economia-perto-de-voce.png` | App Store screenshot 1 (max resolution available): "ECONOMIA PERTO DE VOCÊ" + phone mockup with Home screen. | 1284×2778 |
| `screens/appstore-02-sua-cidade-seus-mercados.png` | App Store screenshot 2: "SUA CIDADE SEUS MERCADOS" + phone mockup with city picker. | 1284×2778 |
| `ui/city-indique-aqui.png` | "Não achou sua cidade? Indique aqui". Box in screen-city.png: (156,806)-(666,853) | 510×47 |
| `ui/city-indique-aqui_2x.png` | 2x Lanczos upscale of ui/city-indique-aqui.png | 1020×94 |
| `ui/city-logo-lockup.png` | City screen logo lockup (tag + EncarteAI). Box in screen-city.png: (230,217)-(590,349) | 360×132 |
| `ui/city-logo-lockup_2x.png` | 2x Lanczos upscale of ui/city-logo-lockup.png | 720×264 |
| `ui/city-logo-tag.png` | Tag symbol from the lockup (raster). Box in screen-city.png: (234,221)-(324,345) | 90×124 |
| `ui/city-logo-tag_2x.png` | 2x Lanczos upscale of ui/city-logo-tag.png | 180×248 |
| `ui/city-onde-voce-esta.png` | "Onde você está?" + subtitle block. Box in screen-city.png: (56,411)-(766,593) | 710×182 |
| `ui/city-onde-voce-esta_2x.png` | 2x Lanczos upscale of ui/city-onde-voce-esta.png | 1420×364 |
| `ui/city-petropolis-rj.png` | "Petrópolis / RJ" row with pin + chevron. Box in screen-city.png: (22,649)-(800,761) | 778×112 |
| `ui/city-petropolis-rj_2x.png` | 2x Lanczos upscale of ui/city-petropolis-rj.png | 1556×224 |
| `ui/city-wordmark.png` | Wordmark from the lockup (raster). Box in screen-city.png: (325,252)-(585,309) | 260×57 |
| `ui/city-wordmark_2x.png` | 2x Lanczos upscale of ui/city-wordmark.png | 520×114 |
| `ui/home-banner-ofertas-semana.png` | Banner "Ofertas da Semana!" – Vale Verde Supermercado (rounded corners on white). Box in screen-home.png: (34,324)-(788,602) | 754×278 |
| `ui/home-banner-ofertas-semana_2x.png` | 2x Lanczos upscale of ui/home-banner-ofertas-semana.png | 1508×556 |
| `ui/home-card-banana-prata.png` | Product card "Banana Prata Kg — 41% OFF — Bramil" (card bottom edge hidden under the tab bar in the source). Box in screen-home.png: (30,1232)-(364,1649) | 334×417 |
| `ui/home-card-banana-prata_2x.png` | 2x Lanczos upscale of ui/home-card-banana-prata.png | 668×834 |
| `ui/home-card-queijo-camembert.png` | Product card "Queijo Camembert… — 40% OFF — Assaí Atacadista" (bottom edge hidden under tab bar). Box in screen-home.png: (381,1232)-(715,1649) | 334×417 |
| `ui/home-card-queijo-camembert_2x.png` | 2x Lanczos upscale of ui/home-card-queijo-camembert.png | 668×834 |
| `ui/home-chip-armazem.png` | Market chip "Armazém… 1.2 km". Box in screen-home.png: (377,898)-(552,1128) | 175×230 |
| `ui/home-chip-armazem_2x.png` | 2x Lanczos upscale of ui/home-chip-armazem.png | 350×460 |
| `ui/home-chip-bramil.png` | Market chip "Bramil 3.5 km". Box in screen-home.png: (27,898)-(202,1128) | 175×230 |
| `ui/home-chip-bramil_2x.png` | 2x Lanczos upscale of ui/home-chip-bramil.png | 350×460 |
| `ui/home-chip-petro-frutas.png` | Market chip "Petro Frutas 3.8 km". Box in screen-home.png: (202,898)-(377,1128) | 175×230 |
| `ui/home-chip-petro-frutas_2x.png` | 2x Lanczos upscale of ui/home-chip-petro-frutas.png | 350×460 |
| `ui/home-chip-rede-econ.png` | Market chip "Rede Econ… 1.5 km". Box in screen-home.png: (552,898)-(727,1128) | 175×230 |
| `ui/home-chip-rede-econ_2x.png` | 2x Lanczos upscale of ui/home-chip-rede-econ.png | 350×460 |
| `ui/home-header-bell.png` | Bell icon. Box in screen-home.png: (722,135)-(782,195) | 60×60 |
| `ui/home-header-bell_2x.png` | 2x Lanczos upscale of ui/home-header-bell.png | 120×120 |
| `ui/home-header-logo.png` | Header logo only (raster EncarteAI). Box in screen-home.png: (21,133)-(251,197) | 230×64 |
| `ui/home-header-logo_2x.png` | 2x Lanczos upscale of ui/home-header-logo.png | 460×128 |
| `ui/home-header.png` | Header: EncarteAI logo + bell (full width). Box in screen-home.png: (0,110)-(822,220) | 822×110 |
| `ui/home-header_2x.png` | 2x Lanczos upscale of ui/home-header.png | 1644×220 |
| `ui/home-location-pill.png` | Pin + "Petrópolis" tight. Box in screen-home.png: (313,232)-(501,278) | 188×46 |
| `ui/home-location-pill_2x.png` | 2x Lanczos upscale of ui/home-location-pill.png | 376×92 |
| `ui/home-location.png` | Location row "Petrópolis" (full width, between dividers). Box in screen-home.png: (0,227)-(822,288) | 822×61 |
| `ui/home-location_2x.png` | 2x Lanczos upscale of ui/home-location.png | 1644×122 |
| `ui/home-mercados-regiao.png` | "Mercados da Região" title + chip row (5th chip cut by screen edge, as in the app). Box in screen-home.png: (0,836)-(822,1128) | 822×292 |
| `ui/home-mercados-regiao_2x.png` | 2x Lanczos upscale of ui/home-mercados-regiao.png | 1644×584 |
| `ui/home-meus-favoritos.png` | "Meus Favoritos — 6 ofertas · 2 redes" card. Box in screen-home.png: (22,663)-(800,817) | 778×154 |
| `ui/home-meus-favoritos_2x.png` | 2x Lanczos upscale of ui/home-meus-favoritos.png | 1556×308 |
| `ui/home-ofertas-quentes-title.png` | "Ofertas Quentes" + "Ver todos". Box in screen-home.png: (0,1165)-(822,1213) | 822×48 |
| `ui/home-ofertas-quentes-title_2x.png` | 2x Lanczos upscale of ui/home-ofertas-quentes-title.png | 1644×96 |
| `ui/home-ofertas-quentes.png` | Ofertas Quentes title + cards row (3rd card cut by screen edge). Box in screen-home.png: (0,1165)-(822,1649) | 822×484 |
| `ui/home-ofertas-quentes_2x.png` | 2x Lanczos upscale of ui/home-ofertas-quentes.png | 1644×968 |
| `ui/home-tabbar.png` | Bottom tab bar: Início (active) / Buscar / Configurações. Box in screen-home.png: (0,1649)-(822,1780) | 822×131 |
| `ui/home-tabbar_2x.png` | 2x Lanczos upscale of ui/home-tabbar.png | 1644×262 |
| `ui/screen-city-masked.png` | Same crop, RGBA with the real screen shape as alpha. | 822×1782 RGBA |
| `ui/screen-city-masked_2x.png` | 2x Lanczos upscale of ui/screen-city-masked.png | 1644×3564 RGBA |
| `ui/screen-city.png` | City picker screen, full screen area. Crop box in screenshot 2: (266,760)-(1088,2542). Corners + notch filled white. | 822×1782 |
| `ui/screen-city_2x.png` | 2x Lanczos upscale of ui/screen-city.png | 1644×3564 |
| `ui/screen-home-masked.png` | Same crop, untouched pixels, RGBA: alpha = exact screen shape (rounded corners + notch transparent). | 822×1780 RGBA |
| `ui/screen-home-masked_2x.png` | 2x Lanczos upscale of ui/screen-home-masked.png | 1644×3560 RGBA |
| `ui/screen-home.png` | Home screen, full screen area inside the mockup. Crop box in screenshot 1: (266,760)-(1088,2540). Rounded corners + notch filled with white (#FFFFFF) so it is a clean opaque rectangle. | 822×1780 |
| `ui/screen-home_2x.png` | 2x Lanczos upscale of ui/screen-home.png | 1644×3560 |
| `fonts/LICENSE-Inter-OFL.txt` | SIL OFL 1.1 license for Inter. | 4 KB |
| `fonts/LICENSE-Nunito-OFL.txt` | SIL OFL 1.1 license for Nunito. | 4 KB |
| `fonts/inter-latin-400-normal.woff2` | Inter Regular (OFL) – UI/supporting text (closest Google font to iOS SF Pro). | 23 KB |
| `fonts/inter-latin-500-normal.woff2` | Inter Medium (OFL). | 23 KB |
| `fonts/inter-latin-600-normal.woff2` | Inter SemiBold (OFL). | 23 KB |
| `fonts/inter-latin-700-normal.woff2` | Inter Bold (OFL). | 23 KB |
| `fonts/nunito-latin-700-normal.woff2` | Nunito Bold (OFL) – @fontsource/nunito 5.3.0. | 15 KB |
| `fonts/nunito-latin-800-normal.woff2` | Nunito ExtraBold (OFL) – the wordmark weight. | 16 KB |
| `fonts/nunito-latin-900-normal.woff2` | Nunito Black (OFL) – suggested video headline weight. | 16 KB |
