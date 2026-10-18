---
name: roblox-model-importing
description: Pós-importação de modelos no Roblox Studio via MCP (armas, criaturas, pets, dragões, props de bioma) — rig com Motor6D/Welds, VFX e SFX sincronizados por Animation Markers, brilho de raridade, onda de choque e otimização, chamando o módulo ModelKit já pronto em vez de gerar código novo. Use sempre que um modelo .glb/.fbx ou da Creator Store for importado, ou precisar de rig, efeitos, sons ou animações.
---

# Model Importing (ModelKit) — v0 rascunho

Objetivo: importar um modelo novo custando **1 a 3 chamadas curtas** de MCP, sem gerar
scripts do zero. Toda a lógica vive em `ModelKit.luau` (nesta pasta).

> Status: rascunho. O módulo compila no Luau, mas ainda não foi testado dentro do Studio.
> Primeira tarefa da Fase 2: testar com 1 arma e 1 criatura e corrigir esta skill.

## Regras de economia (obrigatórias)

1. **Nunca** reescrever nem colar de novo o código do ModelKit se ele já existe no jogo.
2. **Nunca** listar a árvore inteira do Explorer. Para entender um modelo use `MK.inspect(modelo)` (1 linha).
3. Um modelo por chamada. Resposta final ao usuário: o relatório de 1 linha + pendências.
4. Se algo falhar, corrigir o **ModelKit.luau no repositório** (e reinstalar), não fazer remendo avulso no Studio.

## Passo 0 — ModelKit instalado?

Via MCP (ferramenta de executar código no Studio):

```lua
local s = game.ReplicatedStorage:FindFirstChild("Shared")
print(s and s:FindFirstChild("ModelKit") and "OK" or "FALTA")
```

Se `FALTA`: criar `ReplicatedStorage.Shared` (Folder) e um ModuleScript `ModelKit` com o conteúdo de
`ModelKit.luau` (via Rojo, se o projeto usar, ou setando `.Source` pelo MCP). Também garantir um
LocalScript em `StarterPlayerScripts` com:

```lua
require(game.ReplicatedStorage.Shared.ModelKit).autoBind()
```

Observação: a Command Bar guarda o `require` em cache. Após atualizar o módulo, rodar
`MK = require(game.ReplicatedStorage.Shared.ModelKit:Clone())` para pegar a versão nova.

## Passo 1 — Importar (humano)

O Claude não importa arquivos do disco do usuário. O humano faz:

- `.glb/.fbx`: **File → Import 3D** (3D Importer). Rig com ossos → marcar como rig no importador.
- Creator Store: o MCP pode inserir por asset id (ferramenta de inserir modelo).
- Modelos `.glb` de criaturas/dragões vêm de ferramentas 3D (geração 3D do próprio Roblox, Meshy, Tripo,
  Blender). Props simples (cristais, pedras, cercas, portões) **não precisam de .glb**: gerar direto em Luau.

## Passo 2 — Convenções que o modelo deve seguir

```
Dragon_Fire (Model)            ← nome único, PascalCase, sufixo do bioma/raridade
├─ Root / HumanoidRootPart     ← vira PrimaryPart (Tool usa "Handle")
├─ Body, Head, WingL, WingR... ← nomes de peças ÚNICOS (animações endereçam por nome)
├─ Animations (Folder)         ← objetos Animation: Idle, Walk, Attack, Roar, Inspect...
└─ FX (Folder)
   ├─ Roar (Folder)  [Anchor="Head"]      ← nome do grupo = nome do Marker
   │   ├─ ParticleEmitter  [EmitCount=30]
   │   ├─ Sound            [Overlap=true]
   │   └─ Shockwave (Configuration) [Radius=14, Duration=0.5, Color=Color3]
   └─ WingFlap (Folder) [Anchor="WingL"]
       ├─ Sound
       └─ Trail [A0="WingTipA", A1="WingTipB", Duration=0.4]
```

Atributos reconhecidos:

| Onde | Atributo | Efeito |
|---|---|---|
| Peça | `RigParent` (string) | Motor6D liga a essa peça em vez do root (hierarquia) |
| Peça | `Static` (bool) | Não recebe Motor6D, só solda |
| Peça | Attachment filho `RigJoint` | Pivô da articulação (ombro, base da asa) |
| Grupo FX | `Anchor` (string) | Attachment ou peça onde o efeito nasce (padrão: root) |
| ParticleEmitter | `EmitCount` (number) | Partículas por disparo (o parâmetro do Marker sobrescreve) |
| Sound | `Overlap` (bool) | Clona o som a cada disparo (sons repetidos rápidos) |
| Trail/Beam/Light/Fire/Smoke/Sparkles | `Duration` (number) | Segundos ligado após o disparo |
| Trail/Beam | `A0`, `A1` (string) | Nomes dos Attachments |
| Configuration "Shockwave" | `Radius`, `Duration`, `Color` | Onda de choque em expansão |

## Passo 3 — Rodar o setup (1 chamada)

```lua
local MK = require(game.ReplicatedStorage.Shared.ModelKit)
print(MK.inspect(workspace.Dragon_Fire))
print(MK.setup(workspace.Dragon_Fire, { kind = "creature", rarity = "Mythic" }))
```

| kind | O que faz |
|---|---|
| `prop` | Ancora tudo, sombras off em peças pequenas, colisão Hull |
| `weapon` (Tool) | Solda tudo no Handle, desancora, sem colisão |
| `creature` / `pet` | Rig estrela com Motor6D (pula se já tiver ossos ou Motor6D), solda o resto, Animator, streaming Atomic. `anchored = false` para NPC que anda |

Todos: organiza `FX` (desliga emissores, move para a âncora, marca `FXGroup`, tag `MK_FX`), aplica
raridade (PointLight + aura opcional de `ReplicatedStorage.VFXLibrary.Aura_<Raridade>`) e otimiza.
O setup é idempotente: rodar de novo não duplica juntas.

## Passo 4 — Animações e Markers

- Preferir **Animation Markers** (Animation Editor → Add Animation Event) a `wait()`. Nome do marker =
  nome do grupo em `FX`. Keyframes nomeados também funcionam. O parâmetro do marker pode ser um número
  (quantidade de partículas).
- KeyframeSequence gerada por script serve para **testar no Studio**
  (`KeyframeSequenceProvider:RegisterKeyframeSequence`). Para o jogo publicado, publicar pelo Animation
  Editor com o **mesmo dono da experiência** (usuário ou grupo), senão a animação não toca.
- O cliente toca os efeitos: `autoBind()` liga os markers de qualquer modelo com a tag `MK_FX`
  (inclusive armas: liga ao personagem que segura a Tool). Servidor só toca a animação: `MK.play(model, "Idle")`.

Markers padrão do projeto (usar estes nomes para reaproveitar presets):

| Marker | VFX sugerido | SFX |
|---|---|---|
| `Equip` | brilho curto | puxar arma |
| `Swing` | Trail na lâmina | whoosh |
| `Impact` | faíscas + Shockwave pequena | impacto |
| `Charge` | partículas convergindo + PointLight | carga de energia |
| `Explode` | explosão + Shockwave grande | explosão |
| `Roar` | Shockwave + poeira | rugido |
| `WingFlap` | poeira/vento | bater de asa |
| `Footstep` | poeira no pé | passo |
| `Inspect` | brilho na lâmina | — |

## Passo 5 — Verificação curta

1. Rodar `MK.inspect` de novo e conferir `motors/welds/fx`.
2. Se tiver animação: play-test curto e ler só os erros do console.
3. Responder com: relatório de 1 linha + o que o humano precisa ajustar (ex.: publicar animação, posição de um Attachment).

## Limites conhecidos (v0)

- Rig estrela é ótimo para criaturas de peças rígidas; criaturas orgânicas precisam de malha com ossos (skinned).
- `CollisionFidelity` pode não ser alterável por script em alguns contextos (o módulo usa `pcall`).
- Muitos modelos com PointLight pesam no mobile: luz só a partir de `Rare`.
