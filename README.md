# capestudios
empresa de marketing

Máquina de produção de vídeo da Cape Studios. Comece por:
- `CLAUDE.md`: regras e estrutura (o Claude lê sozinho)
- `PAUTA-FRED.md`: o que produzir agora
- `formatos/`: formatos de vídeo (localização "como chegar", story mudo, tour, serviço)
- `.claude/skills/video-cliente/`: o passo a passo que o Claude segue para produzir

---

## Fred: como começar (Windows, Acer Nitro)

O passo a passo completo está em **`docs/Guia-do-Fred-Cape.pdf`** (mesma coisa em texto: `docs/Guia-do-Fred-Cape.txt`).
Resumo, no PowerShell:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Python.Python.3.12 -e
winget install --id Gyan.FFmpeg -e
# feche e abra o PowerShell
irm https://claude.ai/install.ps1 | iex
# feche e abra o PowerShell
cd $HOME\Documents
git clone https://github.com/virtualfera/capestudios.git
cd capestudios
git checkout claude/producao-videos-clientes-6xsw3f
npm install
npx playwright install chromium
py -m pip install pillow opencv-python-headless
claude
```

No dia a dia: `git pull` e depois `claude`, dentro da pasta. `brutos/` e `entregas/` não vão para o GitHub.
No Windows, use `py` no lugar de `python3` nos comandos do `CLAUDE.md`.

Para regerar o guia depois de editar `docs/guia-fred.html`: peça ao Claude para "gerar o PDF e o txt do guia".
