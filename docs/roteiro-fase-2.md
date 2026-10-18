# Roteiro da Fase 2 — Construção (no seu PC)

A construção roda no **Claude Code do seu computador**, conectado ao Roblox Studio. A sessão na nuvem não
alcança o Studio. Cada sessão abaixo é **um módulo**: abra uma sessão nova (ou use `/clear`), cole o prompt
curto e valide no Studio antes de ir para a próxima. O `CLAUDE.md` e o GDD carregam o contexto sozinhos.

## Setup (uma vez, ~15 min, sem terminal)

O Claude pela web (claude.ai no navegador) roda na nuvem e não alcança o Studio. É preciso o **app do Claude
para Windows** rodando no mesmo PC que o Studio.

1. **Instalar o app do Claude:** abrir `claude.ai/download`, baixar a versão para Windows, instalar e entrar
   com a mesma conta da web. Se o app pedir para instalar o *Git*, aceitar (é gratuito).
2. **Baixar o projeto:** abrir o link
   `https://github.com/virtualfera/capestudios/archive/refs/heads/claude/keen-wozniak-nlcsoo.zip`, ir em
   Downloads, clicar com o botão direito no ZIP → **Extrair tudo** → **Extrair**. Mover a pasta extraída
   para **Documentos**.
3. **Ligar o Studio:** Roblox Studio → **New** → **Baseplate**. Abrir o **Assistant** → `…` →
   **Manage MCP Servers** → ligar **Enable Studio as MCP server**. Em *Quick connect*, ligar as opções do
   **Claude** que aparecerem. Deixar o Studio aberto.
4. **Reiniciar o app do Claude** (fechar de vez e abrir de novo).
5. **Abrir o projeto no app:** entrar na área **Code**, escolher trabalhar **no computador (Local)** e
   selecionar a pasta do projeto em Documentos.
6. **Primeira mensagem** (o Claude local faz a parte técnica):
   `Verifique se o MCP do Roblox Studio (Roblox_Studio) está conectado. Se não estiver, configure para mim no Windows e me diga em passos bem simples o que eu preciso clicar. Depois rode list_roblox_studios e confirme que encontrou meu Studio aberto.`
   Comando manual, caso ele precise: `claude mcp add --transport stdio Roblox_Studio -- cmd.exe /c %LOCALAPPDATA%\Roblox\mcp.bat`
7. **Salvar o place:** File → Save to Roblox como *Steal a Monster (DEV)*. Pode ficar na conta pessoal por
   enquanto. A versão final é publicada no grupo com *File → Publish to Roblox As* → grupo.

## Dicas de economia durante a construção

- `/usage` mostra quanto do seu limite já foi usado.
- `/model`: use um modelo mais barato nas sessões repetitivas (biomas 2–4, lote de monstros) e o mais forte
  nas de sistemas (dados, roubo, compras).
- `screen_capture` (print do Studio) custa caro: no máximo 1 ou 2 por sessão, no fim, para validar.
- Ajustes no mapa = mudar parâmetro do gerador e rodar de novo. Nunca pedir para "refazer do zero".

## Sessões

| # | Módulo | Prompt para colar |
|---|---|---|
| 1 | Praça + 8 bases | `Sessão 1. Crie roblox/map/gen_hub.luau seguindo o GDD seção 6: gerador re-executável que apaga e recria Workspace.Map.Hub (piso da praça, 8 bases vazias com piso, paredes, entrada, 8 celas marcadas, placa de nome, botão de tranca só visual, spawn central e pads de teleporte só visuais). Rode via MCP. Só visual, sem lógica. No fim: 1 screen_capture de cima e relatório curto.` |
| 2 | Floresta + arco | `Sessão 2. Mesmo padrão da sessão 1: roblox/map/gen_forest.luau para o bioma Forest (piso, esteira central, portal norte e saída sul só visuais, penhascos laterais com Terrain, arco de entrada). Deixe pontos marcados (Parts invisíveis na pasta PropSpots) onde o humano vai colocar árvores e rochas.` |
| 3 | Cristal + portão | `Sessão 3. Igual à sessão 2 para o bioma Crystal, mais o portão "REBIRTH 1" entre Forest e Crystal.` |
| 4 | Vulcão + portão | `Sessão 4. Igual à sessão 3 para Volcano, com portão "REBIRTH 3".` |
| 5 | Void + bordas + luz | `Sessão 5. Bioma Void como "COMING SOON" (portão fechado "REBIRTH 6"), penhascos no perímetro inteiro e iluminação por zona (GDD seção 6) com troca suave no cliente.` |
| — | **Passe manual** | Você: props nos PropSpots (Toolbox/Creator Store), rotação de penhascos, teste no celular. ~2–3 h por bioma |
| 6 | 1º monstro + validar a skill | `Sessão 6. Use a skill roblox-model-importing. Gere o Moss Slime com generate_mesh (estilo semi-realista vibrante), rode o ModelKit e corrija o ModelKit.luau/SKILL.md no repo se algo falhar.` |
| 7 | Dados + bases | `Sessão 7. Sistema de dados com ProfileStore e atribuição de base ao entrar/sair (GDD seção 3). Servidor autoritativo. Teste com run de play.` |
| 8 | Esteira + compra + renda | `Sessão 8. Spawner por bioma com a tabela de spawn do GDD seção 4, compra com prompt, teleporte para a cela, renda e coleta.` |
| 9 | Roubo + defesa | `Sessão 9. Roubo, carregar, Secure, Bat, tranca de 60 s e proteções anti-frustração (GDD seção 3). Validar tudo no servidor.` |
| 10 | Rebirth + eventos + códigos | `Sessão 10. Rebirth, portões funcionais, eventos de servidor e sistema de códigos.` |
| 11 | Monetização | `Sessão 11. Game Passes e Dev Products da seção 7 (eu crio os IDs no Creator Hub e te passo), ProcessReceipt idempotente, PolicyService.` |
| 12 | HUD | `Sessão 12. HUD da seção 9 com módulo de estilo (UIStroke único), celular + PC.` |
| 13 | Loja | `Sessão 13. Shop GUI da seção 7/9: blocos grandes no topo, grade de pequenos, abas.` |
| 14 | Monstros restantes | `Sessão 14. Importar os monstros restantes da seção 5 com a skill, um por vez, relatório de 1 linha cada.` |
| 15 | Polimento + publicação | `Sessão 15. Checklist de lançamento: performance no celular, odds visíveis, textos em inglês, ícone/thumbnail, publicar no grupo.` |

Antes da sessão 11: **Grupo Roblox criado** e o place publicado nele (Game Passes, animações e áudios
precisam pertencer ao grupo).
