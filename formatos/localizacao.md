# Formato: LOCALIZAÇÃO ("Como chegar")

**Vídeo de referência:** `clientes/arteiro/referencias/localizacao-como-chegar-arco-iris.mp4`
(57,6 s · 720×1280 · 30 fps · −14 LUFS · prévia produzida no Mac da Cape).
Folha com 1 quadro por segundo: `clientes/arteiro/referencias/localizacao-como-chegar-arco-iris_decupagem.jpg`.

**Assista ao vídeo inteiro antes de fazer qualquer localização.** Este é o padrão para todos os clientes com espaço físico.

## A ideia
Um GPS afetivo: um **mapa 3D claro em low-poly** (fundo creme, árvores, prédios brancos) com uma **rota em arco-íris**
(as cores do anel do logo do Arteiro) que leva quem vem do Rio até a porta. O mapa entrega a informação e o drone real
prova que o lugar existe. Fecha com um cartão que vale salvar (endereço, horário e café).

## Decupagem (tempos aproximados)

| Tempo | Imagem | Motion | Legenda falada (palavra a palavra, branca, centro) |
|---|---|---|---|
| 0–2 s | Interior da loja (sofá listrado, cômodas, luminárias) | corte seco | "vem visitar a gente" |
| 2–3 s | Drone alto da fachada (telhado azul, letreiro ARTEIRO) | descida leve | "salva esse vídeo" |
| 3–4 s | Drone mais aberto, pin com o logo cai sobre a loja | pin + ondas | "direitinho como chegar" |
| 4–5 s | **Transição drone → mapa 3D**: o mesmo ponto vira mapa low-poly, anel de arco-íris pulsa em volta do pin | match-cut | "direitinho como chegar" |
| 5–6 s | Mapa: câmera sobe e mostra a região | zoom out | — |
| 6–9 s | Rota de arco-íris corre pela estrada (carro low-poly na frente) | câmera persegue o carro | "vindo do rio" · "sobe a serra pela BR-040" |
| 9–11 s | **Placa verde da rodovia** "SAÍDA 62 · Itaipava · Nogueira-Corrêas" vira tela cheia | push-in na placa | "e pega a saída 62" |
| 12–13 s | Carro na alça de saída | — | "…de Itaipava" |
| 14–19 s | Vista aérea: rota pela União e Indústria, rio ao lado | travelling aéreo | "daí é só seguir" · "pela União e Indústria" · "sentido Itaipava" · "uns 3 quilômetros" |
| 20–25 s | Zoom no trecho: rótulos "Arteiro", "Escola João de Barro", "Horto · retorno" | rótulos em pílula branca com bolinha colorida | "um detalhe" · "do outro lado da pista" · "do lado da escola" · "João de Barro" |
| 26–32 s | Rota passa pela loja, sobe até o Horto, faz o retorno e volta | rota desenha o U | "você passa por ela" · "faz o retorno lá no Horto" · "e volta uns 400 metros" |
| 33 s | Pin com anel de arco-íris gigante (círculos concêntricos) | explosão de anéis | "pronto" |
| 34 s | **Transição mapa → drone**: o prédio 3D vira a foto do drone | match-cut | "pronto" |
| 35–38 s | Drone na fachada, pin sobre o telhado | descida | "chegou" · "é o prédio do telhado azul" |
| 39–43 s | Drone de cima: rótulo "Estacionamento da loja" com ícone P | pílula azul | "veio de carro" · "o estacionamento é nosso" · "aqui atrás" · "e tem vaga pra cadeirante" |
| 44 s | Corredor de container azul (interior) | — | — |
| 45–58 s | **Cartão final** sobre interiores coloridos que se alternam: logo com anel, "há 50 anos colorindo ambientes" (serifa itálica), endereço, horário, café, botão | linhas sobem uma a uma; fundo troca a cada ~2 s | "de segunda a sábado" · "das nove às seis" · "e domingo" · "das dez às três" · "e tem cafezinho te esperando" · "pra quem vem com você" |

### Cartão final (texto exato)
- `há 50 anos colorindo ambientes` (serifa itálica, cinza)
- 📍 **Estr. União e Indústria, 9155**: Itaipava · Petrópolis
- 🕘 **Seg a sáb · 9h às 18h**: Domingo · 10h às 15h
- ☕ **Café passado na hora**: te esperando na chegada
- Botão preto: 🔖 **Salva e manda pra quem vem com você**
- Fundo do cartão: creme claro (#f7f3ee aprox.), faixa de arco-íris fina separando a foto do cartão.

### Elementos fixos do formato
- Selo no topo esquerdo durante o vídeo todo: pílula escura "Como chegar no Arteiro" com mini-logo.
- Legenda: palavra-chave grande, branca com sombra, no centro da tela, trocando junto da fala.
- A narração é humana e fala como quem explica a um amigo ("um detalhe", "pronto", "chegou").

## Como adaptar para outro cliente
1. **Trajeto real**, perguntado ao cliente ou conferido no mapa: de onde vem a maioria (Rio pela BR-040? centro de Petrópolis?),
   qual saída, qual referência ("do lado da escola"), se tem retorno.
2. **Cor da rota** = paleta da marca (Hospital: azul → verde-limão; Intensa: vinho → blush; W&S: laranja → marinho).
   O arco-íris é só do Arteiro.
3. **Drone/fachada real** no começo e na chegada (match-cut mapa ↔ drone no mesmo enquadramento).
4. **Cartão final** com dados confirmados: endereço, horário, 1 mimo/diferencial real, CTA "salva e manda pra quem vem com você".
5. **Nada de fato inventado** (ver `clientes/<slug>/marca.json`).

## Ferramenta do mapa 3D
⚠ **Não está documentado com qual ferramenta o mapa 3D e a rota de arco-íris foram feitos.** Antes de adaptar, pergunte a quem
produziu o vídeo de referência e registre aqui (ferramenta, projeto/arquivo-fonte, como trocar o trajeto e a cor da rota).
O template `motor/templates/localizacao.html` do motor **não** faz o mapa: ele cobre pin, fatos e cartão em 2D, sem rota.
Os vídeos em `exemplos/` foram feitos antes de a referência aparecer e **não seguem este formato**.

## O que gravar por cliente
| Cliente | Situação | Falta |
|---|---|---|
| Arteiro | referência pronta (prévia) | aprovar e publicar; usar como modelo |
| Hospital Tannure | sem drone | drone da fachada + entrada; confirmar o endereço Av. Ipiranga, 298 e os horários; trajeto |
| Intensa | sem drone | drone do Pátio Petrópolis + caminho até a clínica; sala/andar; horários; trajeto |
| W&S | sem drone | drone da Unidade Bauhaus + recepção; endereço; horários; trajeto |
