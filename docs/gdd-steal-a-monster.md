# GDD v1 — Steal a Monster

Status: v1 fechado para o MVP. Valores de economia são o ponto de partida e devem ser balanceados com playtest.
Valores de loja em **Robux**.

## 0. Decisões

| Tema | Decisão | Motivo |
|---|---|---|
| Conceito | **A — Steal a Monster** como primeiro teste de mercado | Escolha do usuário. Mapa e monstros servem para B/C se houver pivô |
| Tema | **Monstros e criaturas míticas**, de bichinhos fofos (Common) a feras épicas (Mythic/Secret). Sem terror | Amplo para < 13 anos; dragões nos tiers altos |
| Estética | **Semi-realista vibrante**: materiais PBR e iluminação rica, cores saturadas, silhuetas grandes e legíveis | Escolha do usuário, ajustada para criança e celular |
| Plataforma | **Celular + PC** (orçamento de performance pensado no celular médio) | Escolha do usuário |
| Idioma | **Inglês** + tradução automática do Roblox (PT, ES etc.) | Mercado global; o Brasil é coberto pela tradução |
| Raridades | Common, Uncommon, Rare, Epic, Legendary, Mythic, Secret, ??? | Aprovado |
| Trabalho manual | Assumido: o próprio usuário, ~4–6 h/semana | Resposta "não sei"; o plano minimiza tarefas manuais |
| Grupo Roblox | **Criar antes de publicar** e antes de subir animações/áudios | Assets precisam ter o mesmo dono da experiência |
| Verba | Zero para anúncios e ferramentas 3D | Usar `generate_mesh` do Studio, Creator Store gratuita e marketing orgânico |

## 1. Visão

**Pitch (EN, para a página do jogo):** *Buy monsters, build your base, and steal the rarest monsters from other players!*

- Servidor de **8 jogadores**, cada um com uma base.
- Sessão-alvo: 15–25 min. Primeiro "uau" em menos de 60 s: o primeiro monstro já gera dinheiro na base.

## 2. Core loop

```
Comprar monstro no bioma → monstro aparece na cela da base → gera $/s
      ↑                                                       ↓
Rebirth (multiplicador + novo bioma) ← juntar $ ← coletar na cela
      ↑                                                       ↓
Roubar monstros raros de outras bases  ←→  trancar e defender a sua base
```

## 3. Mecânicas

| Mecânica | Regra (MVP) |
|---|---|
| **Base** | Atribuída ao entrar. 8 celas no térreo (+6 no 2º andar com Game Pass). Placa com o nome do dono. Some quando o jogador sai; monstros ficam salvos no perfil |
| **Compra** | Monstros andam pela esteira do bioma (do portal norte até o portal sul, ~25 s). Prompt "Buy" (segurar 0,5 s). Com dinheiro suficiente, o monstro **teleporta** para uma cela livre (VFX de portal). Sem caminhada até a base no MVP, para evitar bugs de pathfinding |
| **Renda** | Cada cela acumula $ do monstro. O dono coleta pisando na placa da cela (Auto-Collect com Game Pass) |
| **Roubo** | Entrar numa base destrancada → segurar prompt 1,5 s no monstro → carregar (monstro sobre a cabeça, velocidade −35%) → pisar na placa "Secure" da própria base. Anúncio global para Legendary ou mais raro: *"Player is stealing a MYTHIC!"* |
| **Defesa** | Botão de tranca: parede laser por 60 s, recarga de 60 s. Todos têm um **Bat** grátis: acertar quem está carregando faz o monstro voltar para o dono |
| **Proteções anti-frustração** | Escudo de novato nos primeiros 10 min. Monstro recém-roubado fica imune por 60 s (evita pingue-pongue). Ninguém rouba de jogador offline |
| **Rebirth** | Custa $ (tabela abaixo). Zera dinheiro e monstros, mantém compras. Dá +50% de renda (acumulativo) e +1 cela, e desbloqueia portões |
| **Eventos de servidor** | A cada ~15 min, um evento aleatório de 3 min: *Lucky Hour* (sorte x2), *Golden Rain* (chance de Secret), *Fast Portals*. Também podem ser ativados por compra (Server Lucky Portal) |
| **Códigos** | Sistema de códigos grátis (ex.: `LAUNCH` = 1 escudo + $1k). Forte para crescimento orgânico |

## 4. Raridades e economia (v1)

| Tier | Preço ($) | Renda ($/s) | Payback | Cor |
|---|---|---|---|---|
| Common | 50–150 | 2–5 | ~25 s | cinza |
| Uncommon | 400–1.200 | 10–25 | ~40 s | verde |
| Rare | 3.000–9.000 | 50–120 | ~60 s | azul |
| Epic | 30.000–90.000 | 400–900 | ~80 s | roxo |
| Legendary | 400 mil–1,2 mi | 4.000–10.000 | ~100 s | dourado |
| Mythic | 5–15 mi | 40.000–100.000 | ~130 s | vermelho |
| Secret | 100–300 mi | 600 mil–1,5 mi | ~170 s | branco brilhante |
| ??? | não vendável (só evento) | — | — | preto/glitch |

**Spawn por bioma** (peso por monstro que sai do portal, 1 a cada ~3 s):

| Bioma | Desbloqueio | Common | Uncommon | Rare | Epic | Legendary | Mythic | Secret |
|---|---|---|---|---|---|---|---|---|
| Forest | livre | 70% | 25% | 5% | | | | |
| Crystal | Rebirth 1 | | 55% | 35% | 10% | | | |
| Volcano | Rebirth 3 | | | 50% | 35% | 13% | 2% | |
| Void | Rebirth 6 (update) | | | | 50% | 35% | 13,5% | 1,5% |

**Custo de rebirth:** R1 = $1 mi, depois ×5 a cada nível (R2 5 mi, R3 25 mi, R4 125 mi, R5 625 mi, R6 3,1 bi).
Dinheiro inicial: $100 (o suficiente para o 1º Common).

Odds sempre visíveis na placa de cada portal (transparência e conformidade).

## 5. Monstros do MVP (16)

Nomes simples, que uma criança entende. Cada um tem silhueta própria, som de idle e cor de raridade.

| Bioma | Monstro | Raridade | Silhueta / som |
|---|---|---|---|
| Forest | Moss Slime | Common | bolha verde com musgo / "blop" |
| Forest | Mushroom Frog | Common | sapo com chapéu de cogumelo / coaxar |
| Forest | Forest Fox | Uncommon | raposa com cauda de folhas / ganido |
| Forest | Giant Beetle | Uncommon | besouro de chifre grande / estalo |
| Forest | Tree Giant | Rare | gigante de tronco e raízes / ranger de madeira |
| Crystal | Frost Bunny | Uncommon | coelho de pelo branco e cristais / guincho |
| Crystal | Crystal Crab | Rare | caranguejo com casco de cristal / tilintar |
| Crystal | Ice Wolf | Rare | lobo de gelo / uivo |
| Crystal | Yeti | Epic | yeti grande e peludo / rugido grave |
| Crystal | Crystal Golem | Epic | golem de cristais roxos / rocha rachando |
| Volcano | Lava Lizard | Rare | lagarto com costas de magma / chiado |
| Volcano | Fire Hound | Epic | cão de fogo / rosnado com crepitar |
| Volcano | Magma Golem | Epic | golem de rocha com fendas de lava / trovão |
| Volcano | Phoenix | Legendary | ave de fogo, asas abertas / grito agudo |
| Volcano | Lava Dragon | Mythic | dragão de lava / rugido + bater de asas |
| Evento | Golden Dragon | Secret | dragão dourado brilhante / rugido épico |

Update 1 (Void): Void Jelly (Epic), Shadow Cat (Epic), Star Serpent (Legendary), Void Kraken (Mythic), Cosmic Dragon (Secret).
Monstros ??? (Glitch Monster) ficam reservados para eventos especiais.

**Animação no MVP:** idle procedural (respirar/flutuar) no cliente, sem upload de animações. Animações completas
(com Markers + ModelKit) só para Legendary ou mais raro, depois do grupo criado.

## 6. Mapa (macro)

```
                       N (−Z)
          ┌──────────────────────────┐ Z = −780
          │  VOID  (Rebirth 6)       │ "COMING SOON" no lançamento
          ├────────── portão ────────┤ Z = −620
          │  VOLCANO  (Rebirth 3)    │
          ├────────── portão ────────┤ Z = −460
          │  CRYSTAL  (Rebirth 1)    │
          ├────────── portão ────────┤ Z = −300
          │  FOREST  (livre)         │
          ├─────────── arco ─────────┤ Z = −140
 ┌────────┴──────────────────────────┴────────┐
 │  B1  │                            │  B5    │ Z = −105
 │  B2  │   PRAÇA CENTRAL / SPAWN    │  B6    │ Z = −35
 │  B3  │   teleportes p/ biomas     │  B7    │ Z = 35
 │  B4  │                            │  B8    │ Z = 105
 └────────────────────────────────────────────┘ Z = 140
 X = −160               X = 0                  X = 160
```

- **Praça:** 320 × 280 studs. Bases 60 × 60 centradas em X = ±110, com a entrada virada para o centro.
  Teleportes gratuitos para os biomas já liberados.
- **Biomas:** 160 × 160 studs cada, esteira no eixo central (portal ao norte, saída ao sul).
- **Portões:** arcos grandes com o requisito escrito (*"REBIRTH 1"*) e o melhor monstro do próximo bioma visível atrás.
- **Bordas:** penhascos com Terrain em todo o perímetro (escondem o "fim do mundo").
- **Iluminação por zona** (troca suave no cliente ao entrar no bioma):

| Zona | Clima visual |
|---|---|
| Praça | sol de fim de tarde, quente e limpo |
| Forest | verde, raios de sol entre árvores, névoa leve |
| Crystal | azul frio, neve fina, brilho (bloom) nos cristais |
| Volcano | laranja/vermelho, fumaça, lava brilhante |
| Void | roxo escuro, estrelas, ilhas flutuantes |

## 7. Monetização

**Blocos grandes (topo da loja)**

| Item | Tipo | Robux | Entrega |
|---|---|---|---|
| **Mega Bundle — BEST VALUE** | Dev Product (1x por conta) | 1.499 | 2x Cash para sempre + **Royal Dragon** (Mythic exclusivo da loja) + 5 escudos |
| **Server Lucky Portal** | Dev Product | 99 | spawn de raros x2 para o servidor todo por 15 min (empilha), anúncio com o nome de quem comprou |
| **Starter Pack** (só nos 3 primeiros dias) | Dev Product (1x) | 99 | monstro Rare garantido + $5.000 + 1 escudo |

**Blocos pequenos (grade)**

| Item | Tipo | Robux |
|---|---|---|
| VIP (+50% Cash, tag, área VIP) | Game Pass | 399 |
| Extra Floor (+6 celas) | Game Pass | 299 |
| Auto-Collect | Game Pass | 249 |
| Speed Boots (carregar sem perder velocidade) | Game Pass | 199 |
| Longer Lock (tranca 2x mais longa) | Game Pass | 149 |
| Shield 10 min | Dev Product | 49 |
| Pacotes de $ | Dev Product | 49 / 99 / 249 / 499 / 999 |

Regras: compras sempre via `ProcessReceipt` idempotente; consultar `PolicyService` em tudo que tiver resultado
aleatório; nada de texto enganoso ou pressão.

## 8. Arte e performance (semi-realista em celular)

- **Monstros:** `generate_mesh` (texto → malha texturizada, dentro do Studio) + Creator Store gratuita.
  Manter **um estilo por bioma**: misturar artistas diferentes é o que mais deixa o jogo com cara de amador.
- **Orçamento por monstro:** ~3 mil triângulos (Common) a ~12 mil (Mythic/Secret). Até 8 bases × 14 celas
  de monstros visíveis, por isso `RenderFidelity` automático e StreamingEnabled ligado.
- **O "semi-realista" vem principalmente da iluminação:** Atmosphere, Bloom, ColorCorrection, SunRays e
  MaterialVariants no chão. Isso custa pouco e unifica assets de origens diferentes.
- **Modelos grátis:** remover todos os scripts antes de usar (`stripScripts = true` no ModelKit), porque
  modelos gratuitos podem trazer backdoors.

## 9. UI

- HUD: dinheiro e $/s no topo à esquerda; centro inferior com **Shop**, **Lock** (destaque) e **Rebirth**;
  aviso de evento no topo central.
- Loja: blocos grandes no topo, grade de pequenos embaixo, abas *Featured / Passes / Cash*.
- Contorno preto uniforme: `UIStroke` com espessura única (módulo de estilo) em textos e botões;
  ícones PNG com contorno embutido na imagem.
- Celular + PC: layout em Scale, `UIAspectRatioConstraint`, botões de no mínimo ~44 px, respeitar áreas seguras (notch).

## 10. Crescimento sem verba de anúncios

Este é o ponto forte de uma empresa de marketing:
- Clipes curtos (TikTok, Shorts, Reels) de momentos de roubo: *"I stole a MYTHIC!"*. Gravar desde o primeiro playtest.
- Códigos grátis divulgados nos vídeos e no grupo Roblox.
- Contato com criadores pequenos de Roblox (códigos exclusivos em troca de vídeo).
- Ícone e thumbnail fortes, testados com variações.
- Cadência de updates semanal (monstro novo ou evento) para voltar ao algoritmo.

## 11. Teste de mercado e critério de pivô

Após 2–4 semanas de tráfego orgânico:

| Métrica | Meta | Se ficar abaixo |
|---|---|---|
| D1 | ≥ 25% | refazer os primeiros 5 min (onboarding) |
| D7 | ≥ 8% | mais progressão e eventos |
| Sessão média | ≥ 15 min | mais metas de curto prazo |
| Pagantes | ≥ 1% | revisar loja e Starter Pack |

Duas iterações sem bater D1 ≥ 15% → pivô para o conceito **B (Roll a Dragon)**, reaproveitando mapa, monstros e loja.

## 12. Trabalho manual (humano)

| Tarefa | Quando | Estimativa |
|---|---|---|
| Criar o Grupo Roblox (custa Robux, confirmar o valor atual) | antes de publicar | 10 min |
| Props finos por bioma (árvores, cristais, rochas) e corrigir rotação de penhascos | após cada bioma | 2–3 h por bioma |
| Curadoria dos monstros (escolher a melhor geração, remover scripts de modelos grátis) | fase de assets | ~30 min por monstro |
| Testar no celular real | ao fim de cada módulo | 15 min |
| Ícone, thumbnails e clipes | antes do lançamento | parte do marketing |

## 13. Pendências

- [ ] Conferir no Roblox se o nome "Steal a Monster" já existe (alternativas: *Steal Monsters!*, *Monster Thief*).
- [ ] Criar o Grupo Roblox da empresa.
- [ ] Validar a skill `roblox-model-importing` com o 1º monstro.
