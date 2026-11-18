# capestudios
empresa de marketing

Máquina de produção de vídeo da Cape Studios. Comece por:
- `CLAUDE.md`: regras e estrutura (o Claude lê sozinho)
- `PAUTA-FRED.md`: o que produzir agora
- `formatos/`: formatos de vídeo (localização "como chegar", story mudo, tour, serviço)
- `.claude/skills/video-cliente/`: o passo a passo que o Claude segue para produzir

---

## Fred: como começar no seu Mac (uma vez só)

**1. Instale as ferramentas.** Abra o app **Terminal** e cole um bloco por vez:

```bash
# Homebrew (gerenciador de programas do Mac). Pule se já tiver.
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# git, node, ffmpeg e python
brew install git node ffmpeg python

# Claude Code (o Claude que trabalha dentro da pasta)
curl -fsSL https://claude.ai/install.sh | bash
```

**2. Baixe o repositório** (vai criar a pasta `capestudios` dentro de Documentos):

```bash
cd ~/Documents
git clone https://github.com/virtualfera/capestudios.git
cd capestudios
git checkout claude/producao-videos-clientes-6xsw3f   # enquanto o material não estiver no main
```

**3. Instale o motor de vídeo** (dentro da pasta `capestudios`):

```bash
npm install
npx playwright install chromium
pip3 install pillow opencv-python-headless
```

**4. Abra o Claude na pasta:**

```bash
claude
```

Na primeira vez ele pede para entrar com a conta da Cape no Claude. Depois disso o `CLAUDE.md` já está carregado.
Teste com: *"lê o CLAUDE.md e a PAUTA-FRED.md e me diz o que eu produzo hoje"*.

> Prefere sem terminal? No **app Claude para Mac**, abra a aba **Code** e escolha a pasta `capestudios`.
> Os passos 1 a 3 continuam necessários para o motor de vídeo funcionar.

## No dia a dia

```bash
cd ~/Documents/capestudios
git pull          # pega o que o time atualizou (fichas, formatos, pauta)
claude            # abre o Claude
```

- Takes brutos ficam em `brutos/` e vídeos prontos em `entregas/`. **Nenhum dos dois vai para o GitHub** (são pesados).
- Quando o Claude atualizar uma ficha ou um formato (ex.: uma decupagem nova), peça para ele **commitar e dar push**
  para o time receber no próximo `git pull`.
