# Cape Studios — Jogo Roblox

Estúdio criando um jogo Roblox monetizado (público majoritariamente < 13 anos).
- Plano de Negócios e conceitos: `docs/fase-1-plano-de-negocios.md`
- Skill de importação de modelos: `.claude/skills/roblox-model-importing/`
- Status: Fase 1 concluída em rascunho; aguardando respostas do questionário para fechar o GDD.

## Economia de créditos (sempre)
- Um agente só, alternando os papéis (pesquisa, negócios, level design, UI, sistemas). Subagentes só se o usuário pedir.
- Um módulo por sessão. Ao trocar de módulo, nova sessão / `/clear`. Este arquivo e o GDD carregam o contexto.
- MCP do Studio: nunca listar a árvore inteira; ler só o alvo; relatórios de 1–3 linhas.
- Código reutilizável fica em arquivos no repo. Mapas são feitos por scripts geradores re-executáveis com parâmetros, nunca regerados do zero.
- Tarefas rotineiras podem usar um modelo mais barato; arquitetura e bugs difíceis, o mais forte.

## Ordem de construção
1. Setup (Claude Code local + MCP oficial do Roblox Studio + Rojo) → 2. Mapa macro por bioma → 3. Sistemas → 4. UI/Loja → 5. Polimento.
- Mapa antes da lógica. IA faz 90% estrutural (pisos, paredes, penhascos de borda, portões); humano posiciona props finos, assets da Toolbox e corrige rotação de penhascos.
- Uma etapa por vez, validada no Studio antes da próxima.

## Regras de engenharia
- Servidor é a autoridade: rolagens, dinheiro, roubo, compras. Nunca confiar no cliente; validar todo RemoteEvent.
- Dados: ProfileStore (session lock). Compras: `ProcessReceipt` idempotente; Game Pass = permanente, Developer Product = consumível/bundle.
- Itens aleatórios pagos: mostrar odds; checar `PolicyService` `ArePaidRandomItemsRestricted`.
- RNG no servidor com `Random.new()`; chance efetiva = sorte / N, tabela de odds em ModuleScript compartilhado.
- StreamingEnabled ligado; `ModelStreamingMode` Atomic em criaturas; mobile primeiro (testar no emulador de celular do Studio).
- Performance: reaproveitar MeshIds, `CastShadow` off em peças pequenas, PointLight só de Rare para cima, Highlight no máximo 31 simultâneos.
- Estrutura: `Workspace/Map/<Bioma>/{Floor,Walls,Cliffs,Gate,Props,Spawns}`, `ReplicatedStorage/Shared`, `ServerScriptService/Services`, `StarterPlayerScripts/Controllers`.
- Animações e áudios devem pertencer ao mesmo dono (usuário ou grupo) da experiência.

## UI
- Contorno preto grosso e uniforme em tudo. Texto e botões: `UIStroke` com espessura única definida num módulo de estilo.
- Ícones PNG: o contorno vai **embutido na imagem** (mesma espessura em todos), pois `UIStroke` em ImageLabel contorna o retângulo, não o desenho.
- Loja: blocos grandes no topo (Bundle BEST VALUE, Server Boost), grade de blocos pequenos (Game Passes).
- Títulos e nomes de raridade com palavras que uma criança de 8 anos entende.
