# Fase 1 — Estudo Preliminar e Plano de Negócios

Status: rascunho para decisão. Aguardando as respostas do questionário (seção 8) para fechar o GDD.
Valores em **Robux** (não em reais). Números de receita são **hipóteses de exemplo**, não previsões.

---

## 1. O que o mercado está mostrando (Agente 01)

- **Os títulos que estouram são verbo + substantivo simples**: *Steal a Brainrot*, *Grow a Garden*,
  *Fish It!*, *Sell Lemons*, *Kick a Lucky Block*. A criança entende o jogo só pelo nome.
- **Formatos dominantes na lista de jogadores ao vivo**: simulador, idle e RNG. *Steal a Brainrot* já
  aparece em 2º lugar em visitas totais (~68 bi), atrás só de *Brookhaven*.
- **"Steal a ___" está saturado**: há muitos clones. Entrar nesse formato exige um diferencial forte (tema + arte + eventos).
- **Eventos globais do servidor** (clima, chuva de raros, boosts comprados por alguém) geram o
  "momento social" que segura o jogador e vende Server Boost.
- **Receita de criador melhorou**: DevEx subiu ~8,5% em set/2025 (~US$ 0,0038 por Robux ganho) e há
  taxa maior para gasto de jogadores 18+ verificados dos EUA desde jun/2026. Confirmar na página oficial do DevEx antes de usar em contas.

Limitação: o Claude não assiste vídeos do YouTube. Ele lê páginas, posts do DevForum e transcrições.
Se quiser a análise de um vídeo específico, cole a transcrição (é mais barato que pesquisa aberta).

### Aplicando a Regra da Clareza às raridades

A escala do prompt (Folklore, Paranormal, Classified, REDACTED) quebra a própria regra da clareza: uma
criança de 8 anos não sabe o que é "Folklore" ou "Classified". Proposta:

| Tier | Nome sugerido | Cor | Chance base |
|---|---|---|---|
| 1 | Common | cinza | 1 em 2 |
| 2 | Uncommon | verde | 1 em 5 |
| 3 | Rare | azul | 1 em 20 |
| 4 | Epic | roxo | 1 em 100 |
| 5 | Legendary | dourado | 1 em 1.000 |
| 6 | Mythic | vermelho | 1 em 10.000 |
| 7 | Secret | branco brilhante | 1 em 100.000 |
| 8 | ??? (visual "REDACTED", glitch) | preto/glitch | 1 em 1.000.000 |

O tier 8 mantém o mistério do "REDACTED" no visual, sem exigir que a criança conheça a palavra.

---

## 2. Conceito A — **Steal a Monster** (Steal & Defend)

**Pitch:** monstros passam numa esteira saindo de portais. Compre, coloque na sua base, eles geram
dinheiro sozinhos. Roube os monstros dos outros e proteja os seus.

**Core loop (30 s):** ver monstro na esteira → comprar → monstro vai para a cela da base → gera $/s →
juntar dinheiro → comprar monstro melhor / roubar monstro raro de alguém → trancar a base.

**Progressão:** rebirth aumenta multiplicador e desbloqueia portais de biomas novos na esteira
(Floresta → Gelo/Cristal → Vulcão → Void). Cada bioma traz monstros com silhueta e som próprios.

**Monetização**

| Bloco | Item | Tipo | Robux | Entrega |
|---|---|---|---|---|
| Grande | **Mega Bundle — BEST VALUE** | Dev Product (1x por conta) | 1.499 | 2x Cash para sempre + monstro Secret exclusivo + 3 escudos |
| Grande | **Server Lucky Portal** | Dev Product | 99 | Raros aparecem mais na esteira para o servidor todo (15 min), com anúncio do nome de quem comprou |
| Grande | Starter Pack (primeiros 3 dias) | Dev Product (1x) | 99 | Monstro Rare garantido + dinheiro + 1 escudo |
| Pequeno | VIP (+50% Cash) | Game Pass | 399 | +50% dinheiro, tag no chat |
| Pequeno | Extra Floor (mais celas) | Game Pass | 299 | +4 celas na base |
| Pequeno | Speed Boots | Game Pass | 199 | +velocidade ao carregar monstro roubado |
| Pequeno | Longer Lock | Game Pass | 149 | Tranca da base dura 2x |
| Pequeno | Shield 10 min | Dev Product | 49 | Base imune a roubo por 10 min |

**Forças:** formato mais viral do momento; muito conteúdo de YouTube/TikTok ("roubei o Secret de alguém").
**Riscos:** saturado; roubo exige servidor 100% autoritativo e anti-exploit (mais código = mais créditos);
roubo frustra crianças menores (mitigar: proteção offline, monstro roubado gera menos por X min).
**Custo de construção: ALTO.**

---

## 3. Conceito B — **Roll a Dragon** (RNG/Roller) ⭐ recomendado para o 1º jogo

**Pitch:** role o dado e ganhe dragões. Quanto mais raro, mais lindo, mais alto o rugido. Coloque no
seu ninho e eles geram moedas. Abra portões para biomas novos com dragões ainda mais raros.

**Core loop (10 s):** apertar ROLL → animação de suspense → dragão aparece com cor e som da raridade →
equipar o melhor no ninho (gera moedas/s e aumenta a sorte) → moedas compram upgrades e abrem portões.

**Progressão e biomas (o mapa é o jogo):**

| Bioma | Abre com | Pool de dragões | Visual |
|---|---|---|---|
| 1. Floresta Inicial | — | Common → Legendary | verde vibrante, cachoeira |
| 2. Caverna de Cristal/Gelo | moedas + 1.000 rolls | até Mythic | azul/roxo, cristais brilhantes |
| 3. Vulcão | moedas + 10.000 rolls | até Secret | lava, fumaça, rochas negras |
| 4. Void | moedas + 100.000 rolls | até ??? | céu cósmico, ilhas flutuantes, glitch |

Cada bioma tem seu **altar de rolar** com pool própria e multiplicador maior. Portões grandes e
visíveis entre biomas mostram o próximo dragão "trancado" (desejo visível).

**Monetização**

| Bloco | Item | Tipo | Robux | Entrega |
|---|---|---|---|---|
| Grande | **Mega Bundle — BEST VALUE** | Dev Product (1x por conta) | 1.499 | 2x Luck para sempre + 500 gemas + dragão Mythic exclusivo |
| Grande | **Server Luck Boost x2** | Dev Product | 99 | Sorte x2 para o servidor inteiro por 30 min (empilha x2 → x4 → x8) com anúncio global |
| Grande | Starter Pack (primeiros 3 dias) | Dev Product (1x) | 99 | 3 Lucky Potions + dragão Rare garantido |
| Pequeno | Double Roll | Game Pass | 599 | 2 dragões por roll |
| Pequeno | Fast Roll | Game Pass | 299 | animação de roll 2x mais rápida |
| Pequeno | VIP (+50% Coins) | Game Pass | 399 | +50% moedas, tag, área VIP no lobby |
| Pequeno | Extra Nest Slots | Game Pass | 249 | +3 dragões equipados |
| Pequeno | Lucky Rolls | Game Pass | 75 | todo 10º roll com sorte x2 |
| Pequeno | Super Potions (pacote) | Dev Product | 199 | 5 poções de sorte x3 por 10 min |
| Moeda | Pacotes de gemas | Dev Product | 49 / 99 / 249 / 499 / 999 | gemas (bônus crescente) |

Correção técnica ao prompt: **Super Potions não podem ser Game Pass** (Game Pass é compra única
permanente); consumíveis repetíveis são **Developer Products**. O mesmo vale para o Mega Bundle: como
Game Pass não pode ser empacotado, ele é um Developer Product que grava "2x Luck para sempre" no save.

**Forças:** loop mais simples de construir; a tabela de monetização do prompt encaixa 1:1; jogável solo
(menos netcode); dragões combinam perfeitamente com a skill de importação (rugido, bater de asas, VFX).
**Riscos:** muitos jogos RNG existentes, então o diferencial é a qualidade visual dos dragões e dos biomas.
Verificar se o nome "Roll a Dragon" já está em uso antes de fechar.
**Custo de construção: MÉDIO (o menor dos três).**

---

## 4. Conceito C — **Catch a Monster** (híbrido: RNG + coleção + eventos)

**Pitch:** monstros aparecem pelos biomas. Corra, jogue a rede e pegue antes dos outros! Leve para sua
base, onde eles geram dinheiro.

**Core loop (30–60 s):** monstros nascem nos biomas (raridade por RNG) → anúncio global para Mythic+
("Um monstro SECRET apareceu no Vulcão!") → corrida até lá → minigame simples de captura → monstro vai
para a base → gera $/s → rede melhor / biomas novos.

**Progressão:** os mesmos 4 biomas com portões; redes melhores pegam raridades maiores; eventos de clima
por bioma (nevasca, chuva de meteoros) mudam a tabela de spawn.

**Monetização**

| Bloco | Item | Tipo | Robux | Entrega |
|---|---|---|---|---|
| Grande | **Mega Bundle — BEST VALUE** | Dev Product (1x) | 1.499 | 2x Luck para sempre + rede Mythic + monstro exclusivo |
| Grande | **Server Luck Boost** | Dev Product | 99 | spawns raros x2 no servidor por 30 min |
| Grande | **Summon Storm** | Dev Product | 399 | dispara evento de clima com chuva de raros para todos |
| Pequeno | Auto-Catch | Game Pass | 299 | captura automática de Common/Uncommon |
| Pequeno | VIP (+50% Cash) | Game Pass | 399 | +50% dinheiro, tag |
| Pequeno | Extra Cells | Game Pass | 249 | +4 celas na base |
| Pequeno | Teleport | Game Pass | 149 | teleporte para qualquer bioma liberado |
| Pequeno | Lucky Bait | Dev Product | 49 | próximo spawn perto de você com sorte x3 |

**Forças:** usa o mapa intensamente; eventos globais criam momentos sociais fortes; sem roubo (menos frustração).
**Riscos:** monstros andando pelo mapa (pathfinding, sincronização) e eventos exigem mais engenharia que o B.
**Custo de construção: MÉDIO-ALTO.**

---

## 5. Recomendação (Agente 02)

1. **Construir o B (Roll a Dragon) como primeiro jogo**: o menor custo de créditos, o menor risco
   técnico, e a tabela de monetização pronta.
2. **O mapa de 4 biomas e os kits de assets servem para os três conceitos.** Se o B performar, o C vira
   uma atualização ou um segundo jogo reaproveitando 70% do trabalho.
3. Deixar o A (Steal) para quando houver equipe e orçamento para anti-exploit e moderação.

---

## 6. Economia e LTV (fórmula para usar com dados reais)

```
Receita líquida (Robux)   = Robux brutos × 0,70        (Roblox fica com ~30% nas vendas)
Receita em US$            = Robux líquidos × ~0,0038    (DevEx; confirmar taxa atual)
Robux brutos/mês          = MAU × % pagantes × ticket médio (Robux)
```

Exemplo **hipotético** (só para entender as alavancas):

| MAU | % pagantes | Ticket médio | Robux brutos | Robux líquidos | ≈ US$/mês |
|---|---|---|---|---|---|
| 100.000 | 2% | 400 | 800.000 | 560.000 | ~2.100 |
| 1.000.000 | 2% | 400 | 8.000.000 | 5.600.000 | ~21.300 |

Alavancas, em ordem de impacto: **tráfego** (thumbnail/ícone + anúncios + algoritmo), **retenção**
(D1/D7, que alimentam o algoritmo), **conversão** (a primeira compra barata: Starter Pack 99) e
**ticket** (Bundle 1.499 e boosts empilháveis). Somam-se os *Premium Payouts* (tempo de jogo de assinantes Premium).

Metas de referência comuns na comunidade de devs (validar com dados próprios): D1 ≥ 25–30%,
D7 ≥ 8–10%, sessão média ≥ 15 min.

## 7. Regras de plataforma e ética (obrigatórias para não perder o jogo)

- **Itens aleatórios pagos** (Robux → resultado aleatório): mostrar as chances antes da compra e checar
  `PolicyService:GetPolicyInfoForPlayerAsync().ArePaidRandomItemsRestricted` para esconder esses produtos
  nos países onde são restritos.
- Preço claro, entrega imediata, nada de "compre agora ou perde tudo". Público infantil exige cuidado
  extra: táticas enganosas derrubam o jogo na moderação e destroem a reputação.
- Compras processadas de forma idempotente (`ProcessReceipt`) para nunca cobrar sem entregar.
- Anúncios de compra no servidor mostram o **nome de exibição**, nunca dados pessoais.

---

## 8. Questionário de alinhamento (para fechar o GDD)

1. Qual conceito seguimos: **A** (Steal a Monster), **B** (Roll a Dragon, recomendado), **C** (Catch a Monster) ou uma mistura?
2. Tema: dragões, monstros fofos, criaturas assustadoras ou outro? (define todo o kit de arte)
3. Estética do mapa: cartoon low-poly vibrante (padrão dos sucessos atuais) ou semi-realista?
4. Plataforma prioritária: **mobile primeiro** (a maioria das crianças joga no celular) ou PC?
5. Idioma: título e UI em **inglês** (mercado global, com tradução automática) ou PT-BR?
6. As raridades da tabela da seção 1 estão aprovadas, ou preferem o tema "Classified/REDACTED"?
7. Equipe humana: quem faz os 10% manuais (props, Toolbox, rotação de penhascos) e quantas horas por semana?
8. Já existe um **Grupo Roblox** da empresa? (animações, áudios e produtos precisam pertencer ao mesmo dono da experiência)
9. Orçamento: há verba para anúncios no Roblox e para uma ferramenta de geração 3D (Meshy/Tripo)?
10. Ambiente: vocês já têm Roblox Studio + Claude Code (ou Claude Desktop) instalados no mesmo computador?
