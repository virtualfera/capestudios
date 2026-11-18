# Formato: LOCALIZAÇÃO

Modelo: o vídeo do drone do Arteiro ("você sabe que aqui no Arteiro…"). Vale para **todos os clientes com espaço físico**.
Função: tirar a dúvida "onde fica / como chego / vale a ida" e virar destaque fixo no perfil.

Template: `motor/templates/localizacao.html` · Duração: 15 s · 9:16 · funciona mudo, com legenda ou com narração.

## Estrutura (tempos para 15 s; escalam com `dados.dur`)

| Tempo | Bloco | O que aparece | Regra |
|---|---|---|---|
| 0–3 s | Gancho | 2–4 linhas, palavra-chave em `*acento*` | Fala do lugar, não da marca. Ex.: "Já passou por esse prédio de *containers* em Itaipava?" |
| 3–6 s | Pin | Pin com o logo cai no ponto exato do take (`dados.pin.x/y`), ondas, rótulo nome + bairro | O pin aponta para o prédio real |
| 6–11 s | O que te espera | 3–4 chips com ícone (`dados.fatos`) | Só fatos com fonte (estacionamento, andares, desde quando…) |
| 11–15 s | Cartão final | Logo com anel, nome, endereço, cidade, CTA, @ | Rua/número só com `endereco_confirmado: true` |

## O que gravar (Fred)
1. **Drone**: aproximação lenta até a fachada (10–15 s, sem giro brusco) + 1 plano alto mostrando a rua/acesso.
2. **Chegada**: POV do carro/entrada do estacionamento (3–5 s).
3. **Porta**: abrir a porta / entrar (3 s), luz do dia.
4. (Opcional) **Rosto** dizendo 1 frase de convite (vira narração e lower-third).

| Cliente | Situação | Falta |
|---|---|---|
| Arteiro | drone já gravado (DRONE ARTEIRO, 24/06) + gravação 04/11 | escolher os takes e baixar para `brutos/arteiro/`; endereço completo |
| Hospital Tannure | sem take de fachada | gravar fachada/entrada Av. Ipiranga (confirmar endereço) |
| Intensa | sem take | entrada do Pátio Petrópolis + corredor até a clínica (pedir sala/andar) |
| W&S | sem take | fachada da Unidade Bauhaus + recepção (pedir endereço) |

## Versão final com takes
No projeto, mova `_versao_final.clipes`/`audio` para o nível de cima (ver `projetos/arteiro/localizacao.json`).
Ajuste `dados.pin` olhando um quadro do take (`--checar`). O motion vai por cima com transparência.

## Histórico
- 18/11/2026 — prévias v1 (motion) dos 4 clientes. Arteiro usa frame do drone; os outros, versão só-marca até gravar a fachada.
