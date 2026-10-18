# Cape Studios — Steal a Monster (Roblox)

Estúdio criando um jogo Roblox monetizado (público majoritariamente < 13 anos).
- **GDD (fonte da verdade):** `docs/gdd-steal-a-monster.md`
- **Roteiro de sessões da construção:** `docs/roteiro-fase-2.md`
- Plano de negócios original (3 conceitos): `docs/fase-1-plano-de-negocios.md`
- Skill de importação de modelos: `.claude/skills/roblox-model-importing/`
- Status: GDD v1 fechado. Próximo: Fase 2, sessão 1 (praça + bases).

Decisões: conceito A (Steal a Monster) como teste de mercado; semi-realista vibrante; celular + PC; UI em inglês;
raridades Common→Uncommon→Rare→Epic→Legendary→Mythic→Secret→???; sem verba (usar `generate_mesh` + Creator Store).

## Economia de créditos (sempre)
- Um agente só, alternando os papéis. Subagentes (do Claude ou o `subagent` do MCP) só se o usuário pedir.
- Um módulo por sessão. O usuário abre sessão nova / `/clear` entre módulos.
- MCP: nunca varrer a árvore inteira (`search_game_tree` só com alvo); preferir `ModelKit.inspect` ou leitura pontual.
  `screen_capture` no máximo 1–2 por sessão, no fim. Relatórios de 1–3 linhas.
- Mapas: scripts geradores em `roblox/map/*.luau`, re-executáveis e com parâmetros no topo. Ajuste = mudar parâmetro e rodar de novo.
- Código reutilizável fica em arquivos no repo.

## MCP do Roblox Studio (embutido no Studio)
- Toda chamada precisa de `studio_id` (`list_roblox_studios`). `execute_luau` e `multi_edit` precisam de `datamodel_type` (Edit para construir).
- Rodar gerador: ler o arquivo do repo e passar o conteúdo para `execute_luau` (Edit).
- Assets: `generate_mesh` (monstros), `generate_material`, `search_asset` / `insert_asset`. Remover scripts de modelos grátis.

## Ordem de construção
Mapa macro por zona → passe manual do humano → 1º monstro (validar skill) → sistemas → UI/Loja → monstros restantes → polimento.
- IA faz 90% estrutural (pisos, paredes, penhascos de borda, portões, esteiras, pontos `PropSpots`); humano coloca props finos e corrige rotação de penhascos.
- Uma etapa por vez, validada no Studio antes da próxima.

## Regras de engenharia
- Servidor é a autoridade: compra, dinheiro, roubo, tranca, rebirth. Nunca confiar no cliente; validar todo RemoteEvent (distância, cooldown, dono).
- Dados: ProfileStore (session lock). Compras: `ProcessReceipt` idempotente; Game Pass = permanente, Developer Product = consumível/bundle.
- Resultado aleatório pago: mostrar odds; checar `PolicyService` `ArePaidRandomItemsRestricted`.
- RNG no servidor com `Random.new()`; tabelas de spawn/economia num ModuleScript em `ReplicatedStorage.Shared`.
- StreamingEnabled ligado; `ModelStreamingMode` Atomic em monstros; orçamento de triângulos do GDD seção 8; testar no emulador de celular.
- PointLight só de Rare para cima; Highlight no máximo 31 simultâneos.
- Estrutura: `Workspace/Map/<Zona>/{Floor,Walls,Cliffs,Gate,Conveyor,PropSpots}`, `ReplicatedStorage/Shared`, `ServerScriptService/Services`, `StarterPlayerScripts/Controllers`.
- Animações, áudios e produtos devem pertencer ao grupo dono da experiência.

## UI
- Contorno preto grosso e uniforme: `UIStroke` com espessura única (módulo de estilo) em textos e botões; ícones PNG com contorno embutido na imagem (UIStroke em ImageLabel contorna o retângulo).
- Layout em Scale para celular + PC; botões ≥ ~44 px; respeitar áreas seguras.
- Textos em inglês simples; nomes que uma criança de 8 anos entende.
